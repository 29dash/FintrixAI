/**
 * TestLoanRecord.js
 * Truffle test for the LoanRecord smart contract.
 * Run with: truffle test
 */
const LoanRecord = artifacts.require("LoanRecord");

contract("LoanRecord", (accounts) => {
  const owner     = accounts[0];
  const applicant = accounts[1];
  let loanInstance;

  before(async () => { loanInstance = await LoanRecord.deployed(); });

  it("deploys and sets owner correctly", async () => {
    const contractOwner = await loanInstance.owner();
    assert.equal(contractOwner, owner, "Owner is not the deployer");
  });

  it("records a new loan", async () => {
    const tx = await loanInstance.recordLoan(
      1, applicant, "Alice Sharma", 500000, 850, 36, "APPROVED", { from: owner }
    );
    assert.ok(tx.receipt.status, "Transaction failed");
    const loan = await loanInstance.getLoan(1);
    assert.equal(loan.status, "APPROVED", "Status mismatch");
    assert.equal(loan.applicantName, "Alice Sharma", "Name mismatch");
  });

  it("confirms loanRecordExists = true for recorded loan", async () => {
    const exists = await loanInstance.loanRecordExists(1);
    assert.equal(exists, true);
  });

  it("returns false for non-existent loan", async () => {
    const exists = await loanInstance.loanRecordExists(9999);
    assert.equal(exists, false);
  });

  it("rejects duplicate loan IDs", async () => {
    try {
      await loanInstance.recordLoan(1, applicant, "Bob", 100000, 900, 12, "PENDING", { from: owner });
      assert.fail("Should have thrown on duplicate loanId");
    } catch (err) {
      assert.include(err.message, "already recorded");
    }
  });

  it("updates loan status", async () => {
    await loanInstance.updateLoanStatus(1, "DISBURSED", { from: owner });
    const loan = await loanInstance.getLoan(1);
    assert.equal(loan.status, "DISBURSED");
  });

  it("rejects non-owner from recording", async () => {
    try {
      await loanInstance.recordLoan(2, accounts[2], "Eve", 200000, 700, 24, "APPROVED", { from: accounts[2] });
      assert.fail("Should have thrown: not owner");
    } catch (err) {
      assert.include(err.message, "not the owner");
    }
  });
});
