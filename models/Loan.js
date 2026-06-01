const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    purpose: {
        type: String,
        required: true
    },

    duration: {
        type: Number,
        required: true
    },

    annualIncome: {
        type: Number,
        required: true
    },

    employmentLength: {
        type: String,
        required: true
    },

    homeOwnership: {
        type: String,
        required: true
    },

    verificationStatus: {
        type: String,
        required: true
    },

    dti: {
        type: Number,
        required: true
    },

    ficoScore: {
        type: Number,
        required: true
    },

    openAccounts: {
        type: Number,
        required: true
    },

    revolvingBalance: {
        type: Number,
        required: true
    },

    revolvingUtilization: {
        type: Number,
        required: true
    },

    totalAccounts: {
        type: Number,
        required: true
    },

    interestRate: {
        type: Number,
        default: 12
    },

    emi: {
        type: Number,
        default: 0
    },

    totalAmount: {
        type: Number,
        default: 0
    },

    remainingBalance: {
        type: Number,
        default: 0
    },

    amountPaid: {
        type: Number,
        default: 0
    },

    riskScore: {
        type: Number,
        default: 0
    },

    riskLevel: {
        type: String,
        default: "Unknown"
    },

    blockchainHash: {
        type: String,
        default: ""
    },

    nextDueDate: {
        type: Date
    },

    status: {
        type: String,
        enum: [
            "pending",
            "approved",
            "rejected",
            "paid",
            "overdue"
        ],
        default: "pending"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model(
    "Loan",
    loanSchema
);