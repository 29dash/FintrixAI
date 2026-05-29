const Loan = require("../models/Loan");
const Transaction = require("../models/Transaction");


// Pay EMI
exports.payEMI = async (req, res) => {

    try {

        const { loanId, amount } = req.body;

        // Find Loan
        const loan = await Loan.findById(loanId);

        if (!loan) {
            return res.status(404).json({
                message: "Loan not found"
            });
        }

        // Update Loan Payment Details
        loan.amountPaid += amount;

        loan.remainingBalance -= amount;

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

            amount,

            transactionHash: "0x45ab123"

        });

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