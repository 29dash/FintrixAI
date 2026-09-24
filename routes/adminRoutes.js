const express = require("express");

const router = express.Router();

const {
    getOverview,
    getAdminLoans,
    getAdminLoanDetails,
    reassessAdminLoan,
    getAllUsers,
    getAllLoans,
    getAdminTransactions,
    getAllTransactions
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");

const adminMiddleware = require("../middleware/adminMiddleware");

router.get(
    "/overview",
    authMiddleware,
    adminMiddleware,
    getOverview
);

router.get(
    "/loans",
    authMiddleware,
    adminMiddleware,
    getAdminLoans
);

router.get(
    "/loans/:id",
    authMiddleware,
    adminMiddleware,
    getAdminLoanDetails
);

router.post(
    "/loans/:id/reassess",
    authMiddleware,
    adminMiddleware,
    reassessAdminLoan
);

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
    "/transactions",
    authMiddleware,
    adminMiddleware,
    getAdminTransactions
);

router.get(
    "/all-transactions",
    authMiddleware,
    adminMiddleware,
    getAllTransactions
);

module.exports = router;