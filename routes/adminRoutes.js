const express = require("express");

const router = express.Router();

const {
    getAllUsers,
    getAllLoans,
    getAllTransactions
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");

const adminMiddleware = require("../middleware/adminMiddleware");


// All Users
router.get(
    "/all-users",
    authMiddleware,
    adminMiddleware,
    getAllUsers
);

// All Loans
router.get(
    "/all-loans",
    authMiddleware,
    adminMiddleware,
    getAllLoans
);

// All Transactions
router.get(
    "/all-transactions",
    authMiddleware,
    adminMiddleware,
    getAllTransactions
);

module.exports = router;