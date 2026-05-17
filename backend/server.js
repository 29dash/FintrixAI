/**
 * server.js
 * Express server — entry point for the Blockchain & Security Module backend.
 * Connects all routes together and starts the HTTP server.
 *
 * Run with: node backend/server.js
 */

const express      = require("express");
const cors         = require("cors");
const path         = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const requestLogger = require("./middleware/requestLogger");
const errorHandler  = require("./middleware/errorHandler");
const loanRoutes    = require("./routes/loanRoutes");
const txRoutes      = require("./routes/transactionRoutes");
const userRoutes    = require("./routes/userRoutes");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());                         // Allow cross-origin requests (for frontend team)
app.use(express.json());                 // Parse JSON request bodies
app.use(requestLogger);                  // Log every request

// ── Health Check ──────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    module:  "Blockchain & Security Module",
    status:  "running",
    routes: [
      "POST /api/blockchain/loans/record",
      "GET  /api/blockchain/loans/verify/:loanId",
      "GET  /api/blockchain/loans/audit/:loanId",
      "POST /api/blockchain/transactions/log",
      "POST /api/blockchain/transactions/verify",
      "POST /api/blockchain/users/register",
      "POST /api/blockchain/users/verify-kyc",
      "GET  /api/blockchain/users/:userId",
    ],
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use("/api/blockchain/loans",        loanRoutes);
app.use("/api/blockchain/transactions", txRoutes);
app.use("/api/blockchain/users",        userRoutes);

// ── Error Handler (must be last) ──────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("|-----------------------------------------------|");
  console.log("|Blockchain & Security Module                   |");
  console.log(`|   Server running on http://localhost:${PORT}  |`);
  console.log("|-----------------------------------------------|");
  console.log("\nMake sure Ganache is running and contracts are deployed.");
  console.log("Then set your contract addresses in the .env file.\n");
});

module.exports = app;
