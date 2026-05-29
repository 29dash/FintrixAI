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

    paymentDate: {
        type: Date,
        default: Date.now
    },

    status: {
        type: String,
        enum: ["success", "failed"],
        default: "success"
    },

    transactionHash: {
        type: String,
        default: ""
    }

});

module.exports = mongoose.model("Transaction", transactionSchema);