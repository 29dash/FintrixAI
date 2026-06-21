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
const { hashPayload, toBytes32 } = require("./hashHelper");

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
 *                              loanAmount, interestRate, tenureMonths, status }
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
      `Loan ${loanId} recorded with status ${status}`
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
async function logTransaction(txData) {
  const { TransactionLog, AuditTrail } = await getContracts();
  const owner = await getOwnerAccount();

  const { loanId, initiator, recipient, amount, txType, description } = txData;
  const payloadHash = hashPayload(txData);

  const receipt = await TransactionLog.methods
    .logTransaction(
      loanId,
      initiator,
      recipient,
      amount,
      txType,
      description,
      toBytes32(payloadHash)
    )
    .send({ from: owner, gas: 1000000 });

  // Determine txIndex from return value via event logs
  const txIndex = Number(
    receipt.events.TransactionLogged?.returnValues?.txIndex ?? 0
  );

  // Also audit this log event
  await AuditTrail.methods
    .addAuditEntry(
      4, // AUDIT action type
      loanId,
      initiator,
      toBytes32(payloadHash),
      `Transaction ${txIndex} logged for loan ${loanId}`
    )
    .send({ from: owner, gas: 1000000 });

  return {
    ...buildResponse(receipt, `Transaction ${txIndex} logged immutably`),
    tx_index: txIndex,
    payload_hash: payloadHash,
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
