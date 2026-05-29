const express = require("express");

const router = express.Router();

const {
    applyLoan,
    approveLoan,
    rejectLoan,
    getMyLoans
} = require("../controllers/loanController");

const authMiddleware = require("../middleware/authMiddleware");

const adminMiddleware = require("../middleware/adminMiddleware");


// Apply Loan
router.post("/apply", authMiddleware, applyLoan);

// Get My Loans
router.get("/my-loans", authMiddleware, getMyLoans);

// Approve Loan
router.put("/approve/:id", authMiddleware, adminMiddleware, approveLoan);

// Reject Loan
router.put("/reject/:id", authMiddleware, adminMiddleware, rejectLoan);

module.exports = router;