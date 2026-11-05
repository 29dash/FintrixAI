const express = require("express");

const router = express.Router();

const {
    payEMI,
    getPaymentHistory,
    retryPaymentConfirmation
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");


// Pay EMI
router.post("/pay", authMiddleware, payEMI);
router.post("/:transactionId/retry", authMiddleware, retryPaymentConfirmation);

// Payment History
router.get("/history", authMiddleware, getPaymentHistory);

module.exports = router;