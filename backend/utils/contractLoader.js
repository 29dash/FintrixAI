/**
 * contractLoader.js
 * Loads compiled contract ABIs from Truffle build artifacts and
 * returns ready-to-use Web3 contract instances.
 *
 * Prerequisites:
 *   - Run `truffle compile` to generate build/contracts/*.json
 *   - Run `truffle migrate` to get deployed addresses
 */

const path   = require("path");
const { getWeb3 } = require("./web3Provider");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Paths to Truffle-generated ABI files (after `truffle compile`)
const BUILD_DIR = path.resolve(__dirname, "../../build/contracts");

function loadABI(contractName) {
  try {
    const artifact = require(`${BUILD_DIR}/${contractName}.json`);
    return artifact.abi;
  } catch (err) {
    throw new Error(
      `[ContractLoader] Cannot load ABI for "${contractName}". ` +
      `Did you run "truffle compile"?\n${err.message}`
    );
  }
}

let contracts = {}; // Cache loaded instances

/**
 * Returns all four contract instances, initialised once.
 */
async function getContracts() {
  if (Object.keys(contracts).length > 0) return contracts;

  const web3 = await getWeb3();

  const addresses = {
    LoanRecord:     process.env.LOAN_RECORD_ADDRESS,
    TransactionLog: process.env.TX_LOG_ADDRESS,
    UserRecord:     process.env.USER_RECORD_ADDRESS,
    AuditTrail:     process.env.AUDIT_TRAIL_ADDRESS,
  };

  for (const [name, address] of Object.entries(addresses)) {
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      throw new Error(
        `[ContractLoader] Address for "${name}" is not set. ` +
        `Add it to your .env after running "truffle migrate".`
      );
    }
    const abi = loadABI(name);
    contracts[name] = new web3.eth.Contract(abi, address);
    console.log(`[ContractLoader] Loaded ${name} @ ${address}`);
  }

  return contracts;
}

module.exports = { getContracts };
