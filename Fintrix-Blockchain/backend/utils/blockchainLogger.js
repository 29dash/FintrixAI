/**
 * blockchainLogger.js
 * ─────────────────────────────────────────────────────────────
 * Core logging module. Called by routes to write records to the
 * blockchain. All functions return a standardised response:
 * {
 *   transaction_hash,
 *   block_number,
 *   verification_status,
 *   audit_status
 * }
 * ─────────────────────────────────────────────────────────────
 */

const { getContracts }    = require("./contractLoader");
const { getOwnerAccount } = require("./web3Provider");
const { hashPayload, hashString, toBytes32 } = require("./hashHelper");

// ─────────────────────────────────────────────────────────────
//  Helper: build the standard response object
// ─────────────────────────────────────────────────────────────
function buildResponse(receipt, note = "Tamper-proof record stored") {
  return {
    transaction_hash:   receipt.transactionHash,
    block_number:       Number(receipt.blockNumber),
    verification_status: "Verified",
    audit_status:       note,
    gas_used:           Number(receipt.gasUsed),
  };
}

// ─────────────────────────────────────────────────────────────
//  1. Log Loan Record
// ─────────────────────────────────────────────────────────────
/**
 * Records a loan approval/rejection on the LoanRecord contract.
 * @param {object} loanData - { loanId, applicantAddress, applicantName,
 *                              loanAmount, interestRate, tenureMonths, status, note }
 */
async function logLoanRecord(loanData) {
  const { LoanRecord, AuditTrail } = await getContracts();
  const owner = await getOwnerAccount();

  const {
    loanId,
    applicantAddress,
    applicantName,
    loanAmount,
    interestRate,
    tenureMonths,
    status,
    note,
  } = loanData;

  // Write to LoanRecord contract
  const receipt = await LoanRecord.methods
    .recordLoan(
      loanId,
      applicantAddress,
      applicantName,
      loanAmount,
      interestRate,
      tenureMonths,
      status
    )
    .send({ from: owner, gas: 1000000 });

  // Compute payload hash for audit entry
  const payloadHash = hashPayload(loanData);

  // Log to AuditTrail
  // ActionType 2 = LOAN_APPROVAL, 3 = LOAN_REJECTION
  const actionType = status === "APPROVED" ? 2 : status === "REJECTED" ? 3 : 1;
  await AuditTrail.methods
    .addAuditEntry(
      actionType,
      loanId,
      applicantAddress,
      toBytes32(payloadHash),
      note || `Loan ${status === "APPROVED" ? "Approved" : "Rejected"} by Admin`
    )
    .send({ from: owner, gas: 1000000 });

  return buildResponse(receipt, `Loan record for ID ${loanId} stored on-chain`);
}

// ─────────────────────────────────────────────────────────────
//  2. Log Transaction
// ─────────────────────────────────────────────────────────────
/**
 * Appends a transaction to the immutable TransactionLog.
 * @param {object} txData - { loanId, initiator, recipient, amount, txType, description }
 *   txType: 0=DISBURSEMENT, 1=REPAYMENT, 2=APPLICATION, 3=STATUS_CHANGE, 4=AUDIT
 */
async function logTransaction(txData, requestId) {
  const { TransactionLog, AuditTrail } = await getContracts();
  const owner = await getOwnerAccount();

  const { loanId, initiator, recipient, amount, txType, description } = txData;
  const payloadHash = hashPayload(txData);
  const hash = toBytes32(payloadHash);
  let receipt;
  let transactionHash;
  let blockNumber;
  let txIndex;
  let shouldWriteAudit = true;

  if (requestId) {
    const requestKey = hashString(`fintrix-payment:${requestId}`);
    const existingIndexPlusOne = Number(
      await TransactionLog.methods.requestIndexPlusOne(requestKey).call()
    );

    if (existingIndexPlusOne > 0) {
      txIndex = existingIndexPlusOne - 1;
      shouldWriteAudit = false;
      const existingTransaction = await TransactionLog.methods.getTransaction(txIndex).call();
      if (existingTransaction.dataHash.toLowerCase() !== hash.toLowerCase()) {
        throw new Error("This payment request ID was already used with a different payload.");
      }
    } else {
      receipt = await TransactionLog.methods
        .logTransactionWithId(
          requestKey,
          loanId,
          initiator,
          recipient,
          amount,
          txType,
          description,
          hash
        )
        .send({ from: owner, gas: 1000000 });

      txIndex = Number(
        receipt.events.TransactionLoggedWithRequest?.returnValues?.txIndex
          ?? receipt.events.TransactionRequestReused?.returnValues?.txIndex
      );
      if (!Number.isSafeInteger(txIndex)) {
        throw new Error("Blockchain transaction receipt did not include its transaction index.");
      }
      shouldWriteAudit = Boolean(receipt.events.TransactionLoggedWithRequest);
    }

    const requestEvents = await TransactionLog.getPastEvents("TransactionLoggedWithRequest", {
      filter: { requestId: requestKey },
      fromBlock: 0,
      toBlock: "latest",
    });
    const originalEvent = requestEvents[0];
    if (!originalEvent) {
      throw new Error(`Could not find the on-chain event for payment request ${requestId}.`);
    }
    transactionHash = originalEvent.transactionHash;
    blockNumber = Number(originalEvent.blockNumber);
  } else {
    receipt = await TransactionLog.methods
      .logTransaction(
        loanId,
        initiator,
        recipient,
        amount,
        txType,
        description,
        hash
      )
      .send({ from: owner, gas: 1000000 });

    txIndex = Number(receipt.events.TransactionLogged?.returnValues?.txIndex ?? 0);
    transactionHash = receipt.transactionHash;
    blockNumber = Number(receipt.blockNumber);
  }

  let auditError = "";
  if (shouldWriteAudit) {
    try {
      const auditActionType = txType === 0 ? 4 : txType === 1 ? 5 : 9;
      await AuditTrail.methods
        .addAuditEntry(
          auditActionType,
          loanId,
          initiator,
          hash,
          `${txType === 1 ? "Repayment" : txType === 0 ? "Disbursement" : "Transaction"} ${txIndex} logged for loan ${loanId}`
        )
        .send({ from: owner, gas: 1000000 });
    } catch (error) {
      auditError = error.message;
      console.error(`[BlockchainLogger] Transaction ${txIndex} was recorded, but its audit entry failed:`, auditError);
    }
  }

  return {
    ...(receipt && !requestId
      ? buildResponse(
          receipt,
          auditError ? `Transaction ${txIndex} logged immutably; audit entry failed` : `Transaction ${txIndex} logged immutably`
        )
      : {
          transaction_hash: transactionHash,
          block_number: blockNumber,
          verification_status: "Verified",
          audit_status: auditError ? "Transaction recorded; audit entry failed" : `Transaction ${txIndex} logged immutably`,
          gas_used: receipt ? Number(receipt.gasUsed) : 0,
        }),
    tx_index: txIndex,
    payload_hash: payloadHash,
    audit_error: auditError,
  };
}

// ─────────────────────────────────────────────────────────────
//  3. Register User Record
// ─────────────────────────────────────────────────────────────
/**
 * Registers a user's hashed KYC and profile data on-chain.
 * @param {object} userData - { userId, walletAddress, kycData, profileData,
 *                              creditScore, kycVerified }
 */
async function logUserRecord(userData) {
  const { UserRecord, AuditTrail } = await getContracts();
  const owner = await getOwnerAccount();

  const { userId, walletAddress, kycData, profileData, creditScore, kycVerified } = userData;

  // Hash sensitive off-chain data — never store raw PII on-chain
  const kycHash     = toBytes32(hashPayload(kycData));
  const profileHash = toBytes32(hashPayload(profileData));

  const receipt = await UserRecord.methods
    .registerUser(
      userId,
      walletAddress,
      kycHash,
      profileHash,
      creditScore,
      kycVerified
    )
    .send({ from: owner, gas: 1000000 });

  // Audit entry for user registration
  await AuditTrail.methods
    .addAuditEntry(
      0, // USER_REGISTRATION
      userId,
      walletAddress,
      kycHash,
      `User ${userId} registered, KYC verified: ${kycVerified}`
    )
    .send({ from: owner, gas: 1000000 });

  return buildResponse(receipt, `User ${userId} registered on-chain`);
}

// ─────────────────────────────────────────────────────────────
//  4. Verify a Loan Record
// ─────────────────────────────────────────────────────────────
/**
 * Reads a loan record from the blockchain and returns it.
 * @param {number} loanId
 */
async function verifyLoanRecord(loanId) {
  const { LoanRecord } = await getContracts();

  const exists = await LoanRecord.methods.loanRecordExists(loanId).call();
  if (!exists) {
    return {
      verification_status: "Not Found",
      audit_status:        "No record found for this loan ID",
    };
  }

  const loan = await LoanRecord.methods.getLoan(loanId).call();

  return {
    verification_status: "Verified",
    audit_status:        "Record retrieved from immutable blockchain storage",
    record: {
      loanId:           Number(loan.loanId),
      applicantAddress: loan.applicantAddress,
      applicantName:    loan.applicantName,
      loanAmount:       Number(loan.loanAmount),
      interestRate:     Number(loan.interestRate) / 100,   // Convert back
      tenureMonths:     Number(loan.tenureMonths),
      status:           loan.status,
      timestamp:        new Date(Number(loan.timestamp) * 1000).toISOString(),
    },
  };
}

// ─────────────────────────────────────────────────────────────
//  5. Verify a Transaction by Payload Hash
// ─────────────────────────────────────────────────────────────
/**
 * Verifies a logged transaction has not been tampered with.
 * @param {number} txIndex    - Index in the TransactionLog
 * @param {object} originalPayload - The original data to recompute the hash
 */
async function verifyTransactionIntegrity(txIndex, originalPayload) {
  const { TransactionLog } = await getContracts();

  const recomputedHash = toBytes32(hashPayload(originalPayload));

  const isValid = await TransactionLog.methods
    .verifyTransaction(txIndex, recomputedHash)
    .call();

  const txOnChain = await TransactionLog.methods.getTransaction(txIndex).call();

  return {
    tx_index:            txIndex,
    verification_status: isValid ? "Verified" : "TAMPERED — Hashes do not match!",
    audit_status:        isValid
      ? "Tamper-proof integrity confirmed"
      : "WARNING: Payload hash mismatch — possible data tampering",
    on_chain_hash:       txOnChain.dataHash,
    recomputed_hash:     recomputedHash,
    timestamp:           new Date(Number(txOnChain.timestamp) * 1000).toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
//  6. Fetch Full Audit Trail for a Loan
// ─────────────────────────────────────────────────────────────
async function getAuditTrailForLoan(loanId) {
  const { AuditTrail } = await getContracts();

  const entryIds = await AuditTrail.methods.getAuditsByRelatedId(loanId).call();

  const entries = await Promise.all(
    entryIds.map((id) => AuditTrail.methods.getAuditEntry(id).call())
  );

  return entries.map((e) => ({
    entryId:    Number(e.entryId),
    actionType: Number(e.actionType),
    relatedId:  Number(e.relatedId),
    actor:      e.actor,
    note:       e.note,
    blockNumber: Number(e.blockNumber),
    timestamp:  new Date(Number(e.timestamp) * 1000).toISOString(),
  }));
}

module.exports = {
  logLoanRecord,
  logTransaction,
  logUserRecord,
  verifyLoanRecord,
  verifyTransactionIntegrity,
  getAuditTrailForLoan,
};
