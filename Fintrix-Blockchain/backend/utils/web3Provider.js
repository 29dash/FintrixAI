/**
 * web3Provider.js
 * Initialises and exports the Web3 instance connected to Ganache.
 * This is the single source of truth for the blockchain connection.
 */

const { Web3 } = require("web3");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const RPC_URL = process.env.GANACHE_RPC_URL || "http://127.0.0.1:7545";

let web3Instance = null;

/**
 * Returns a singleton Web3 instance.
 * Throws if Ganache is not reachable.
 */
async function getWeb3() {
  if (web3Instance) return web3Instance;

  web3Instance = new Web3(new Web3.providers.HttpProvider(RPC_URL));

  // Verify connection
  try {
    const blockNumber = await web3Instance.eth.getBlockNumber();
    console.log(`[Web3] Connected to Ganache at ${RPC_URL} | Latest block: ${blockNumber}`);
  } catch (err) {
    throw new Error(
      `[Web3] Cannot connect to Ganache at ${RPC_URL}. Is Ganache running?\n${err.message}`
    );
  }

  return web3Instance;
}

/**
 * Returns the deployer/admin account (Account[0] from Ganache).
 * This account must be the owner of all deployed contracts.
 */
async function getOwnerAccount() {
  const web3 = await getWeb3();
  const accounts = await web3.eth.getAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error("[Web3] No accounts found in Ganache.");
  }
  return accounts[0]; // Account[0] is the contract owner
}

module.exports = { getWeb3, getOwnerAccount };
