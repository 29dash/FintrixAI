const User = require("../models/User");
const Loan = require("../models/Loan");
const Transaction = require("../models/Transaction");


// Get All Users
exports.getAllUsers = async (req, res) => {

    try {

        const users = await User.find().select("-password");

        res.status(200).json(users);

    } catch (error) {

        res.status(500).json({
            message: "Error fetching users",
            error: error.message
        });

    }
};


// Get All Loans
exports.getAllLoans = async (req, res) => {

    try {

        const loans = await Loan.find().populate("userId");

        res.status(200).json(loans);

    } catch (error) {

        res.status(500).json({
            message: "Error fetching loans",
            error: error.message
        });

    }
};


// Get All Transactions
exports.getAllTransactions = async (req, res) => {

    try {

        const transactions = await Transaction.find()
            .populate("userId")
            .populate("loanId");

        res.status(200).json(transactions);

    } catch (error) {

        res.status(500).json({
            message: "Error fetching transactions",
            error: error.message
        });

    }
};