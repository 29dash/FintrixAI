const Loan = require("../models/Loan");


// Apply Loan
exports.applyLoan = async (req, res) => {

    try {

        const { amount, purpose, duration } = req.body;

        const loan = new Loan({
            userId: req.user.id,
            amount,
            purpose,
            duration
        });

        await loan.save();

        res.status(201).json({
            message: "Loan application submitted successfully",
            loan
        });

    } catch (error) {

        res.status(500).json({
            message: "Error applying loan",
            error: error.message
        });

    }
};


// Approve Loan
exports.approveLoan = async (req, res) => {

    try {

        const loan = await Loan.findById(req.params.id);

        if (!loan) {
            return res.status(404).json({
                message: "Loan not found"
            });
        }

        // EMI Calculation

        const P = loan.amount;

        const annualInterest = loan.interestRate;

        const N = loan.duration;

        const R = annualInterest / 12 / 100;

        const EMI =
            (P * R * Math.pow(1 + R, N)) /
            (Math.pow(1 + R, N) - 1);

        const totalAmount = EMI * N;

        loan.emi = EMI.toFixed(2);

        loan.totalAmount = totalAmount.toFixed(2);

        loan.remainingBalance = totalAmount.toFixed(2);

        loan.status = "approved";

        const nextMonth = new Date();

        nextMonth.setMonth(nextMonth.getMonth() + 1);

        loan.nextDueDate = nextMonth;

        await loan.save();

        res.status(200).json({
            message: "Loan approved successfully",
            loan
        });

    } catch (error) {

        res.status(500).json({
            message: "Error approving loan",
            error: error.message
        });

    }
};


// Reject Loan
exports.rejectLoan = async (req, res) => {

    try {

        const loan = await Loan.findById(req.params.id);

        if (!loan) {
            return res.status(404).json({
                message: "Loan not found"
            });
        }

        loan.status = "rejected";

        await loan.save();

        res.status(200).json({
            message: "Loan rejected successfully",
            loan
        });

    } catch (error) {

        res.status(500).json({
            message: "Error rejecting loan",
            error: error.message
        });

    }
};


// Get My Loans
exports.getMyLoans = async (req, res) => {

    try {

        const loans = await Loan.find({
            userId: req.user.id
        });

        res.status(200).json(loans);

    } catch (error) {

        res.status(500).json({
            message: "Error fetching loans",
            error: error.message
        });

    }
};