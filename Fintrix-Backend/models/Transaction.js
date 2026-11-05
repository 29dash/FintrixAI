const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({

    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Loan",
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    remainingBalance: {
        type: Number,
        required: false
    },

    paymentDate: {
        type: Date,
        default: Date.now
    },

    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "success"
    },

    transactionHash: {
        type: String,
        default: ""
    },

    blockchainStatus: {
        type: String,
        enum: ["pending", "recorded", "failed", "unknown"],
        default: "unknown"
    },

    blockchainError: {
        type: String,
        default: ""
    },

    blockchainTxIndex: {
        type: Number
    },

    blockchainPayloadHash: {
        type: String,
        default: ""
    }

});

transactionSchema.index(
    { loanId: 1, userId: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "pending" },
        name: "one_pending_payment_per_loan_user"
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);