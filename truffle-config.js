/**
 * truffle-config.js
 * Truffle configuration for local Ganache development.
 * Copy this to the blockchain-module root and rename to truffle-config.js
 */
module.exports = {
  networks: {
    development: {
      host:       "127.0.0.1",
      port:       7545,        // Ganache GUI; change to 8545 for ganache-cli
      network_id: "*",
      gas:        6721975,
      gasPrice:   20000000000
    },
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: { optimizer: { enabled: true, runs: 200 } }
    }
  }
};
