const Loan = require("../models/Loan");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const axios = require("axios");
const { getBlockchainLoanId } = require("../utils/loanCalculations");

const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || "http://127.0.0.1:3001";


// Pay EMI
exports.payEMI = async (req, res) => {

    try {

        const { loanId, amount } = req.body;

        const user = await User.findById(req.user.id).select("isAdmin");
        if (user?.isAdmin) {
            return res.status(403).json({
                message: "Admins are not permitted to make payments"
            });
        }

        // Find Loan
        const loan = await Loan.findOne({ _id: loanId, userId: req.user.id });

        if (!loan) {
            return res.status(404).json({
                message: "Loan not found"
            });
        }

        if (!['approved', 'overdue'].includes(loan.status)) {
            return res.status(400).json({
                message: "Payments are available only for active loans."
            });
        }

        const requestedAmount = Number(amount);
        if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
            return res.status(400).json({
                message: "Payment amount must be a positive number."
            });
        }

        const paymentAmount = Math.min(requestedAmount, loan.remainingBalance);

        // Update Loan Payment Details
        loan.amountPaid += paymentAmount;

        loan.remainingBalance = Math.max(loan.remainingBalance - paymentAmount, 0);

        // Mark Loan as Paid
        if (loan.remainingBalance <= 0) {

            loan.status = "paid";

            loan.remainingBalance = 0;
        }

        await loan.save();

        // Save Transaction
        const transaction = new Transaction({

            loanId: loan._id,

            userId: req.user.id,

            amount: paymentAmount,

            remainingBalance: loan.remainingBalance,

            transactionHash: ""

        });

        try {
            const blockchainResponse = await axios.post(
                `${BLOCKCHAIN_API_URL}/api/blockchain/transactions/log`,
                {
                    loanId: loan.blockchainLoanId || getBlockchainLoanId(loan._id),
                    initiator: "0xD65f293334F5B6f11fB52547200f1c5d49a958d8",
                    amount: paymentAmount,
                    txType: 1,
                    description: `EMI repayment for loan ${loan._id}`
                },
                { timeout: 10000 }
            );
            transaction.transactionHash = blockchainResponse.data.transaction_hash || "";
        } catch (blockchainError) {
            console.warn("Blockchain payment logging failed:", blockchainError.message);
        }

        await transaction.save();

        res.status(200).json({

            message: "Payment successful",

            loan,

            transaction

        });

    } catch (error) {

        res.status(500).json({

            message: "Payment failed",

            error: error.message

        });

    }
};


// Get Payment History
exports.getPaymentHistory = async (req, res) => {

    try {

        const transactions = await Transaction.find({
            userId: req.user.id
        }).populate("loanId");

        res.status(200).json(transactions);

    } catch (error) {

        res.status(500).json({

            message: "Error fetching payment history",

            error: error.message

        });

    }
};