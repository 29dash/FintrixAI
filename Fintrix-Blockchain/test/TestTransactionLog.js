/**
 * TestTransactionLog.js
 * Truffle test for TransactionLog smart contract.
 */
const TransactionLog = artifacts.require("TransactionLog");
const { Web3 } = require("web3");

contract("TransactionLog", (accounts) => {
  const owner     = accounts[0];
  const initiator = accounts[1];
  const recipient = accounts[2];
  let tlInstance;
  let web3local;

  before(async () => {
    tlInstance = await TransactionLog.deployed();
    web3local  = new Web3();
  });

  it("deploys correctly", async () => {
    const contractOwner = await tlInstance.owner();
    assert.equal(contractOwner, owner);
  });

  it("logs a transaction", async () => {
    const payload = { loanId: 1, initiator, amount: 500000 };
    const hash    = web3local.utils.keccak256(JSON.stringify(payload));

    const tx = await tlInstance.logTransaction(
      1, initiator, recipient, 500000,
      0, // LOAN_DISBURSEMENT
      "Initial disbursement for loan 1",
      hash,
      { from: owner }
    );
    assert.ok(tx.receipt.status, "Transaction failed");

    const count = await tlInstance.getTotalTransactions();
    assert.equal(Number(count), 1, "Should have 1 logged transaction");
  });

  it("retrieves a logged transaction", async () => {
    const entry = await tlInstance.getTransaction(0);
    assert.equal(Number(entry.loanId), 1);
    assert.equal(Number(entry.txType), 0); // LOAN_DISBURSEMENT
  });

  it("verifies transaction hash correctly", async () => {
    const payload = { loanId: 1, initiator, amount: 500000 };
    const hash    = web3local.utils.keccak256(JSON.stringify(payload));
    const valid   = await tlInstance.verifyTransaction(0, hash);
    assert.equal(valid, true, "Hash should verify correctly");
  });

  it("detects tampered payload", async () => {
    const tamperedPayload = { loanId: 1, initiator, amount: 999999 }; // amount changed!
    const tamperedHash = web3local.utils.keccak256(JSON.stringify(tamperedPayload));
    const valid = await tlInstance.verifyTransaction(0, tamperedHash);
    assert.equal(valid, false, "Should detect tampered hash");
  });

  it("reuses the existing transaction for a repeated request ID", async () => {
    const requestId = web3local.utils.keccak256("payment-request-123");
    const payloadHash = web3local.utils.keccak256("payment-payload-123");
    const beforeCount = Number(await tlInstance.getTotalTransactions());

    const first = await tlInstance.logTransactionWithId(
      requestId, 42, initiator, recipient, 250,
      1, "EMI repayment", payloadHash, { from: owner }
    );
    const second = await tlInstance.logTransactionWithId(
      requestId, 42, initiator, recipient, 250,
      1, "EMI repayment", payloadHash, { from: owner }
    );

    const firstIndex = Number(first.logs.find((log) => log.event === "TransactionLoggedWithRequest").args.txIndex);
    const reusedEvent = second.logs.find((log) => log.event === "TransactionRequestReused");
    assert.ok(reusedEvent, "A repeated request should emit its reuse event");
    assert.equal(Number(reusedEvent.args.txIndex), firstIndex);
    assert.equal(Number(await tlInstance.getTotalTransactions()), beforeCount + 1);
    assert.equal(Number(await tlInstance.requestIndexPlusOne(requestId)), firstIndex + 1);
  });

  it("rejects reusing a request ID with a different payload", async () => {
    const requestId = web3local.utils.keccak256("payment-request-mismatch");
    const originalHash = web3local.utils.keccak256("original");
    const changedHash = web3local.utils.keccak256("changed");

    await tlInstance.logTransactionWithId(
      requestId, 43, initiator, recipient, 250,
      1, "EMI repayment", originalHash, { from: owner }
    );

    try {
      await tlInstance.logTransactionWithId(
        requestId, 43, initiator, recipient, 300,
        1, "EMI repayment", changedHash, { from: owner }
      );
      assert.fail("Expected request ID payload mismatch to revert");
    } catch (error) {
      assert.include(error.message, "request ID payload mismatch");
    }
  });
});
