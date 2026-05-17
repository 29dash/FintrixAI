/**
 * deployAndLog.js
 * Helper script: After truffle migrate, this reads deployed addresses
 * from the build artifacts and prints a ready-to-copy .env block.
 *
 * Run: node scripts/deployAndLog.js
 */
const path = require("path");
const BUILD = path.resolve(__dirname, "../build/contracts");

function getAddress(contractName) {
  try {
    const artifact = require(`${BUILD}/${contractName}.json`);
    const networks = Object.values(artifact.networks);
    if (networks.length === 0) return "NOT DEPLOYED";
    return networks[networks.length - 1].address;
  } catch {
    return "BUILD NOT FOUND — run: truffle compile && truffle migrate";
  }
}

console.log("\n=== Deployed Contract Addresses ===\n");
const addresses = {
  LOAN_RECORD_ADDRESS:  getAddress("LoanRecord"),
  TX_LOG_ADDRESS:       getAddress("TransactionLog"),
  USER_RECORD_ADDRESS:  getAddress("UserRecord"),
  AUDIT_TRAIL_ADDRESS:  getAddress("AuditTrail"),
};

console.log("Add the following to your .env file:\n");
for (const [k, v] of Object.entries(addresses)) {
  console.log(`${k}=${v}`);
}
console.log();
