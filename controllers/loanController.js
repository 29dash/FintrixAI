const Loan = require("../models/Loan");
const axios = require("axios");

// Apply Loan
exports.applyLoan = async (req, res) => {

    try {

        const {
            amount,
            purpose,
            duration,

            interestRate,
            grade,

            annualIncome,
            employmentLength,
            homeOwnership,
            verificationStatus,

            dti,
            ficoScore,

            openAccounts,
            revolvingBalance,
            revolvingUtilization,
            totalAccounts

        } = req.body;

        let riskData = null;

        try {
        
            /*console.log("ML PAYLOAD:", {
                loan_amnt: amount,
                term: duration,
                int_rate: interestRate,
                grade: grade,
                emp_length: employmentLength,
                home_ownership: homeOwnership,
                annual_inc: annualIncome,
                verification_status: verificationStatus,
                purpose: purpose,
                dti: dti,
                fico_score: ficoScore,
                open_acc: openAccounts,
                revol_bal: revolvingBalance,
                revol_util: revolvingUtilization,
                total_acc: totalAccounts
            });*/
        
            const mlResponse = await axios.post(
                "http://localhost:8000/predict",
                {
                    loan_amnt: amount,
                    term: duration,
                    int_rate: interestRate,
                    grade: grade,
                    emp_length: employmentLength,
                    home_ownership: homeOwnership,
                    annual_inc: annualIncome,
                    verification_status: verificationStatus,
                    purpose: purpose,
                    dti: dti,
                    fico_score: ficoScore,
                    open_acc: openAccounts,
                    revol_bal: revolvingBalance,
                    revol_util: revolvingUtilization,
                    total_acc: totalAccounts
                }
            );

            riskData = mlResponse.data;

        } catch (err) {

            console.log(
                "ML API Error:",
                err.response?.data || err.message
            );

            riskData = {
                risk_score: 0,
                risk_level: "Unknown",
                default_probability: 0
            };
        }

        const loan = new Loan({

            userId: req.user.id,

            amount,
            purpose,
            duration,

            interestRate,
            grade,

            annualIncome,
            employmentLength,
            homeOwnership,
            verificationStatus,

            dti,
            ficoScore,

            openAccounts,
            revolvingBalance,
            revolvingUtilization,
            totalAccounts,

            riskScore: riskData.risk_score,
            riskLevel: riskData.risk_level

        });

        await loan.save();

        res.status(201).json({

            message:
                "Loan application submitted successfully",

            loan,

            risk_assessment: riskData

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

        // Blockchain Integration
        try {

            const blockchainResponse = await axios.post(
                "http://localhost:3001/api/blockchain/loans/record",
                {
                    loanId: Date.now(),
                    applicantAddress: "0xD65f293334F5B6f11fB52547200f1c5d49a958d8",
                    applicantName: "FintrixAI User",
                    loanAmount: loan.amount,
                    interestRate: loan.interestRate,
                    tenureMonths: loan.duration,
                    status: "APPROVED"
                }
            );

            loan.blockchainHash =
                blockchainResponse.data.transaction_hash || "";

            await loan.save();

            console.log(
                "Blockchain Record Created:",
                blockchainResponse.data.transaction_hash
            );

        } catch (blockchainError) {

            console.log(
                "Blockchain Logging Error:",
                blockchainError.response?.data ||
                blockchainError.message
            );

        }

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