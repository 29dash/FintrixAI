/**
 * hashHelper.js
 * Utility functions for computing keccak256 hashes of off-chain payloads.
 * Used to create tamper-evident fingerprints stored on-chain.
 */

const { Web3 } = require("web3");

/**
 * Compute keccak256 hash of any JSON-serialisable object.
 * The same object must produce the same hash every time (sorted keys).
 *
 * @param {object} payload - The data object to hash
 * @returns {string} - 0x-prefixed 32-byte hex hash
 */
function hashPayload(payload) {
  // Sort keys for deterministic serialisation
  const sorted     = JSON.stringify(payload, Object.keys(payload).sort());
  const web3Local  = new Web3();
  return web3Local.utils.keccak256(sorted);
}

/**
 * Compute keccak256 hash of a plain string.
 * @param {string} str
 * @returns {string}
 */
function hashString(str) {
  const web3Local = new Web3();
  return web3Local.utils.keccak256(str);
}

/**
 * Convert a hex hash string to bytes32 (Buffer/Uint8Array) for Solidity.
 * Web3 contracts.methods expect bytes32 as a hex string beginning with 0x.
 */
function toBytes32(hexHash) {
  if (!hexHash.startsWith("0x")) hexHash = "0x" + hexHash;
  return hexHash.padEnd(66, "0"); // 0x + 64 hex chars = 66 chars
}

module.exports = { hashPayload, hashString, toBytes32 };
