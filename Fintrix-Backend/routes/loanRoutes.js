const express = require("express");

const router = express.Router();

const {
    applyLoan,
    approveLoan,
    rejectLoan,
    getMyLoans,
    getMyLoan,
    getMyLoanDetails,
    reassessLoan
} = require("../controllers/loanController");

const authMiddleware = require("../middleware/authMiddleware");

const adminMiddleware = require("../middleware/adminMiddleware");


// Apply Loan
router.post("/apply", authMiddleware, applyLoan);

// Get My Loans
router.get("/my-loans", authMiddleware, getMyLoans);

router.get("/my-loans/:id", authMiddleware, getMyLoan);

router.get("/my-loans/:id/details", authMiddleware, getMyLoanDetails);

router.post("/:id/reassess", authMiddleware, reassessLoan);

// Approve Loan
router.put("/approve/:id", authMiddleware, adminMiddleware, approveLoan);

// Reject Loan
router.put("/reject/:id", authMiddleware, adminMiddleware, rejectLoan);

module.exports = router;