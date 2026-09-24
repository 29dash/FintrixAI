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

    cibilScore: {
        type: Number
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

    grade: {
        type: String,
        required: true
    },

    emi: {
        type: Number,
        default: 0
    },

    totalInterest: {
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
        default: null
    },

    riskLevel: {
        type: String,
        default: null
    },

    riskAssessmentStatus: {
        type: String,
        enum: ["assessed", "pending", "failed"],
        default: "pending"
    },

    riskAssessmentError: {
        type: String,
        default: ""
    },

    defaultProbability: {
        type: Number,
        default: null
    },

    riskExplanations: {
        type: [String],
        default: []
    },

    blockchainHash: {
        type: String,
        default: ""
    },

    blockchainLoanId: {
        type: Number,
        default: null
    },

    blockchainBlockNumber: {
        type: Number,
        default: null
    },

    blockchainPayloadHash: {
        type: String,
        default: ""
    },

    blockchainTimestamp: {
        type: Date
    },

    blockchainVerificationStatus: {
        type: String,
        default: "Pending"
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

    decisionComment: {
        type: String,
        default: ""
    },

    decisionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    decisionAt: {
        type: Date
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