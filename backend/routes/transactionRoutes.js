/**
 * transactionRoutes.js
 * REST API endpoints for blockchain transaction log operations.
 * Base path: /api/blockchain/transactions
 */

const express = require("express");
const router  = express.Router();
const { logTransaction, verifyTransactionIntegrity } = require("../utils/blockchainLogger");

// ─── POST /api/blockchain/transactions/log ────────────────────
// Logs any financial transaction to the immutable TransactionLog.
// Body: { loanId, initiator, recipient, amount, txType, description }
// txType values: 0=DISBURSEMENT, 1=REPAYMENT, 2=APPLICATION, 3=STATUS_CHANGE, 4=AUDIT
router.post("/log", async (req, res) => {
  try {
    const { loanId, initiator, recipient, amount, txType, description } = req.body;

    if (initiator === undefined || txType === undefined) {
      return res.status(400).json({ error: "Missing required fields: initiator, txType" });
    }
    if (txType < 0 || txType > 4) {
      return res.status(400).json({ error: "txType must be 0–4" });
    }

    const txData = {
      loanId:      Number(loanId)    || 0,
      initiator:   initiator,
      recipient:   recipient         || "0x0000000000000000000000000000000000000000",
      amount:      Number(amount)    || 0,
      txType:      Number(txType),
      description: description       || "",
    };

    const result = await logTransaction(txData);
    return res.status(201).json(result);
  } catch (err) {
    console.error("[transactionRoutes] /log error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/blockchain/transactions/verify ─────────────────
// Verifies a previously logged transaction has not been tampered.
// Body: { txIndex, originalPayload }
router.post("/verify", async (req, res) => {
  try {
    const { txIndex, originalPayload } = req.body;

    if (txIndex === undefined || !originalPayload) {
      return res.status(400).json({ error: "Missing required fields: txIndex, originalPayload" });
    }

    const result = await verifyTransactionIntegrity(Number(txIndex), originalPayload);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[transactionRoutes] /verify error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
