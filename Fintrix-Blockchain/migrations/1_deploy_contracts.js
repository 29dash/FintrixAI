/**
 * Truffle migration script — deploys all 4 contracts to Ganache.
 * Run with: truffle migrate --network development
 */

const LoanRecord    = artifacts.require("LoanRecord");
const TransactionLog = artifacts.require("TransactionLog");
const UserRecord    = artifacts.require("UserRecord");
const AuditTrail    = artifacts.require("AuditTrail");

module.exports = async function (deployer) {
  console.log("Deploying LoanRecord...");
  await deployer.deploy(LoanRecord);
  const lr = await LoanRecord.deployed();
  console.log("  LoanRecord deployed at:", lr.address);

  console.log("Deploying TransactionLog...");
  await deployer.deploy(TransactionLog);
  const tl = await TransactionLog.deployed();
  console.log("  TransactionLog deployed at:", tl.address);

  console.log("Deploying UserRecord...");
  await deployer.deploy(UserRecord);
  const ur = await UserRecord.deployed();
  console.log("  UserRecord deployed at:", ur.address);

  console.log("Deploying AuditTrail...");
  await deployer.deploy(AuditTrail);
  const at = await AuditTrail.deployed();
  console.log("  AuditTrail deployed at:", at.address);

  console.log("\n=== Deployment Complete ===");
  console.log("Copy these addresses into your .env file:");
  console.log("LOAN_RECORD_ADDRESS=" + lr.address);
  console.log("TX_LOG_ADDRESS=" + tl.address);
  console.log("USER_RECORD_ADDRESS=" + ur.address);
  console.log("AUDIT_TRAIL_ADDRESS=" + at.address);
};
