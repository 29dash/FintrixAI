const Loan = require("../models/Loan");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const axios = require("axios");
const { getBlockchainLoanId } = require("../utils/loanCalculations");

const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || "http://127.0.0.1:3001";
const PAYMENT_INITIATOR = "0xD65f293334F5B6f11fB52547200f1c5d49a958d8";

async function applyConfirmedPayment(transaction, loan) {
    const paymentId = transaction._id;
    const applyResult = await Loan.updateOne(
        {
            _id: loan._id,
            userId: transaction.userId,
            remainingBalance: { $gte: transaction.amount },
            appliedPaymentIds: { $ne: paymentId }
        },
        [{
            $set: {
                amountPaid: { $add: [{ $ifNull: ["$amountPaid", 0] }, transaction.amount] },
                remainingBalance: {
                    $max: [{ $subtract: ["$remainingBalance", transaction.amount] }, 0]
                },
                appliedPaymentIds: {
                    $setUnion: [{ $ifNull: ["$appliedPaymentIds", []] }, [paymentId]]
                },
                status: {
                    $cond: [
                        { $lte: [{ $subtract: ["$remainingBalance", transaction.amount] }, 0] },
                        "paid",
                        "$status"
                    ]
                }
            }
        }]
    );

    if (applyResult.modifiedCount === 0) {
        const latestLoan = await Loan.findOne({ _id: loan._id, userId: transaction.userId });
        const alreadyApplied = latestLoan?.appliedPaymentIds?.some(
            (id) => id.toString() === paymentId.toString()
        );
        if (!alreadyApplied) {
            throw new Error("Blockchain payment was recorded, but the loan balance could not be updated.");
        }
    }

    const updatedLoan = await Loan.findById(loan._id);
    if (!updatedLoan) {
        throw new Error("Blockchain payment was recorded, but its loan could not be reloaded.");
    }

    transaction.status = "success";
    transaction.blockchainStatus = "recorded";
    transaction.remainingBalance = updatedLoan.remainingBalance;
    await transaction.save();

    return updatedLoan;
}

async function submitPendingPayment(transaction, loan) {
    let blockchainResponse;
    try {
        blockchainResponse = await axios.post(
            `${BLOCKCHAIN_API_URL}/api/blockchain/transactions/log`,
            {
                loanId: loan.blockchainLoanId || getBlockchainLoanId(loan._id),
                initiator: PAYMENT_INITIATOR,
                amount: Math.round(transaction.amount * 100),
                txType: 1,
                description: `EMI repayment of INR ${transaction.amount.toFixed(2)} for loan ${loan._id}`,
                requestId: transaction._id.toString()
            },
            { timeout: 10000 }
        );
    } catch (error) {
        console.warn("Blockchain payment confirmation failed:", error.message);
        const responseStatus = error.response?.status;
        const definitelyRejected = responseStatus >= 400 && responseStatus < 500;
        transaction.blockchainStatus = definitelyRejected ? "failed" : "unknown";
        transaction.status = definitelyRejected ? "failed" : "pending";
        transaction.blockchainError = error.response?.data?.error || error.message;
        await transaction.save();
        return { transaction, loan };
    }

    if (!blockchainResponse.data.transaction_hash) {
        transaction.blockchainStatus = "unknown";
        transaction.status = "pending";
        transaction.blockchainError = "Blockchain service returned no transaction hash.";
        await transaction.save();
        return { transaction, loan };
    }

    transaction.transactionHash = blockchainResponse.data.transaction_hash;
    transaction.blockchainTxIndex = blockchainResponse.data.tx_index;
    transaction.blockchainPayloadHash = blockchainResponse.data.payload_hash || "";
    transaction.blockchainError = blockchainResponse.data.audit_error || "";
    transaction.blockchainStatus = "recorded";
    await transaction.save();

    const updatedLoan = await applyConfirmedPayment(transaction, loan);
    return { transaction, loan: updatedLoan };
}

function respondWithPayment(res, result) {
    const { transaction, loan } = result;
    const confirmed = transaction.status === "success";
    const failed = transaction.status === "failed";

    return res.status(200).json({
        message: confirmed
            ? transaction.blockchainError
                ? "Payment confirmed and recorded on blockchain, but the audit trail could not be completed."
                : "Payment successful and confirmed on blockchain."
            : failed
                ? "Payment was not applied because blockchain logging was rejected."
                : "Payment is pending blockchain confirmation. Do not submit another payment.",
        blockchain: {
            status: transaction.blockchainStatus,
            error: transaction.blockchainError
        },
        loan,
        transaction
    });
}

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
        if (!Number.isFinite(Number(loan.remainingBalance)) || Number(loan.remainingBalance) <= 0) {
            return res.status(400).json({
                message: "This loan has no remaining balance to pay."
            });
        }

        const existingPending = await Transaction.findOne({
            loanId: loan._id,
            userId: req.user.id,
            status: "pending"
        });
        if (existingPending) {
            return res.status(409).json({
                message: "A payment is awaiting blockchain confirmation. Retry that payment instead of submitting another.",
                transactionId: existingPending._id
            });
        }

        const paymentAmount = Math.round(Math.min(requestedAmount, loan.remainingBalance) * 100) / 100;
        if (paymentAmount <= 0) {
            return res.status(400).json({
                message: "Payment amount must be at least ₹0.01."
            });
        }
        const transaction = new Transaction({
            loanId: loan._id,
            userId: req.user.id,
            amount: paymentAmount,
            transactionHash: "",
            status: "pending",
            blockchainStatus: "pending"
        });
        try {
            await transaction.save();
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    message: "A payment is already awaiting confirmation. Retry that payment instead of submitting another."
                });
            }
            throw error;
        }

        return respondWithPayment(res, await submitPendingPayment(transaction, loan));

    } catch (error) {
        return res.status(500).json({
            message: "Payment failed",
            error: error.message
        });
    }
};

exports.retryPaymentConfirmation = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.transactionId,
            userId: req.user.id
        });
        if (!transaction) {
            return res.status(404).json({ message: "Payment not found" });
        }
        if (transaction.status !== "pending") {
            const loan = await Loan.findById(transaction.loanId);
            return respondWithPayment(res, { transaction, loan });
        }

        const loan = await Loan.findOne({ _id: transaction.loanId, userId: req.user.id });
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }

        return respondWithPayment(res, await submitPendingPayment(transaction, loan));
    } catch (error) {
        return res.status(500).json({
            message: "Could not retry payment confirmation",
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