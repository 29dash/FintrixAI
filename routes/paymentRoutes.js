const express = require("express");

const router = express.Router();

const {
    payEMI,
    getPaymentHistory
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");


// Pay EMI
router.post("/pay", authMiddleware, payEMI);

// Payment History
router.get("/history", authMiddleware, getPaymentHistory);

module.exports = router;