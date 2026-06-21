/**
 * loanRoutes.js
 * REST API endpoints for blockchain loan record operations.
 * Base path: /api/blockchain/loans
 */

const express = require("express");
const router  = express.Router();
const {
  logLoanRecord,
  verifyLoanRecord,
  getAuditTrailForLoan,
} = require("../utils/blockchainLogger");

// ─── POST /api/blockchain/loans/record ───────────────────────
// Called by the backend when a loan is approved or rejected.
// Body: { loanId, applicantAddress, applicantName, loanAmount,
//         interestRate, tenureMonths, status }
router.post("/record", async (req, res) => {
  try {
    const {
      loanId, applicantAddress, applicantName,
      loanAmount, interestRate, tenureMonths, status,
    } = req.body;

    // Basic input validation
    if (!loanId || !applicantAddress || !status) {
      return res.status(400).json({
        error: "Missing required fields: loanId, applicantAddress, status",
      });
    }
    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const result = await logLoanRecord({
      loanId:           Number(loanId),
      applicantAddress,
      applicantName:    applicantName || "Unknown",
      loanAmount:       Number(loanAmount) || 0,
      interestRate:     Math.round((Number(interestRate) || 0) * 100), // store as int
      tenureMonths:     Number(tenureMonths) || 0,
      status,
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error("[loanRoutes] /record error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/blockchain/loans/verify/:loanId ─────────────────
// Retrieves and verifies a loan record from the blockchain.
router.get("/verify/:loanId", async (req, res) => {
  try {
    const loanId = Number(req.params.loanId);
    if (isNaN(loanId)) return res.status(400).json({ error: "Invalid loanId" });

    const result = await verifyLoanRecord(loanId);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[loanRoutes] /verify error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/blockchain/loans/audit/:loanId ──────────────────
// Returns the complete on-chain audit trail for a loan.
router.get("/audit/:loanId", async (req, res) => {
  try {
    const loanId = Number(req.params.loanId);
    if (isNaN(loanId)) return res.status(400).json({ error: "Invalid loanId" });

    const trail = await getAuditTrailForLoan(loanId);
    return res.status(200).json({
      loanId,
      total_entries: trail.length,
      audit_trail:   trail,
    });
  } catch (err) {
    console.error("[loanRoutes] /audit error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
