const Loan = require("../models/Loan");
const axios = require("axios");
const {
    calculateEmi,
    normalizeCibilToFico,
    getBlockchainLoanId
} = require("../utils/loanCalculations");
const { assessLoanRisk, normalizeLegacyLoan } = require("../utils/riskAssessment");

const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || "http://127.0.0.1:3001";

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
            cibilScore,
            ficoScore,

            openAccounts,
            revolvingBalance,
            revolvingUtilization,
            totalAccounts

        } = req.body;

        const submittedCibilScore = cibilScore ?? ficoScore;
        const modelFicoScore = normalizeCibilToFico(submittedCibilScore);

        const numericFields = {
            amount,
            duration,
            interestRate,
            annualIncome,
            dti,
            cibilScore: submittedCibilScore,
            openAccounts,
            revolvingBalance,
            revolvingUtilization,
            totalAccounts
        };

        const missingFields = [
            "amount",
            "purpose",
            "duration",
            "interestRate",
            "grade",
            "employmentLength",
            "homeOwnership",
            "annualIncome",
            "verificationStatus",
            "dti",
            "cibilScore",
            "openAccounts",
            "revolvingBalance",
            "revolvingUtilization",
            "totalAccounts"
        ].filter((field) => {
            const value = req.body[field];
            return value === undefined || value === null || value === "";
        });

        const invalidNumbers = Object.entries(numericFields)
            .filter(([, value]) => !Number.isFinite(Number(value)))
            .map(([field]) => field);

        const rangeErrors = [];
        if (Number(amount) <= 0) rangeErrors.push("amount");
        if (![36, 60].includes(Number(duration))) rangeErrors.push("duration");
        if (Number(interestRate) <= 0 || Number(interestRate) > 100) rangeErrors.push("interestRate");
        if (Number(annualIncome) <= 0) rangeErrors.push("annualIncome");
        if (Number(submittedCibilScore) < 300 || Number(submittedCibilScore) > 900) rangeErrors.push("cibilScore");
        if (Number(dti) < 0 || Number(dti) > 100) rangeErrors.push("dti");
        if (Number(revolvingUtilization) < 0 || Number(revolvingUtilization) > 100) rangeErrors.push("revolvingUtilization");
        if ([openAccounts, revolvingBalance, totalAccounts].some((value) => Number(value) < 0)) rangeErrors.push("account values");

        if (missingFields.length || invalidNumbers.length || rangeErrors.length) {
            return res.status(400).json({
                message: "Please provide valid values for all loan fields.",
                missingFields,
                invalidNumbers,
                rangeErrors
            });
        }

        let riskData = null;
        let riskAssessmentStatus = "assessed";
        let riskAssessmentError = "";

        try {
            riskData = await assessLoanRisk({
                amount,
                duration,
                interestRate,
                grade,
                employmentLength,
                homeOwnership,
                annualIncome,
                verificationStatus,
                purpose,
                dti,
                ficoScore: modelFicoScore,
                cibilScore: submittedCibilScore,
                openAccounts,
                revolvingBalance,
                revolvingUtilization,
                totalAccounts,
            });
        } catch (err) {
            riskAssessmentStatus = "failed";
            riskAssessmentError = err.message;
            console.error("ML API Error:", riskAssessmentError);
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

            openAccounts,
            revolvingBalance,
            revolvingUtilization,
            totalAccounts,

            riskScore: riskAssessmentStatus === "assessed" ? riskData.riskScore : null,
            riskLevel: riskAssessmentStatus === "assessed" ? riskData.riskLevel : null,
            riskAssessmentStatus,
            riskAssessmentError,
            defaultProbability: riskAssessmentStatus === "assessed" ? riskData.defaultProbability : null,
            riskExplanations: riskAssessmentStatus === "assessed" ? riskData.explanations : [],
            cibilScore: Number(submittedCibilScore),
            ficoScore: modelFicoScore

        });

        await loan.save();

        res.status(201).json({

            message:
                "Loan application submitted successfully",

            loan,

            risk_assessment: riskData || {
                error: riskAssessmentError,
                status: riskAssessmentStatus
            }

        });

    } catch (error) {

        res.status(500).json({
            message: "Error applying loan",
            error: error.message
        });

    }
};

// Retry a failed or pending risk assessment without creating another loan.
exports.reassessLoan = async (req, res) => {
    try {
        const loan = await Loan.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }

        if (!["failed", "pending"].includes(loan.riskAssessmentStatus)) {
            return res.status(409).json({ message: "This loan already has a completed risk assessment." });
        }

        const normalizedLoan = normalizeLegacyLoan(loan.toObject());
        loan.grade = normalizedLoan.grade;
        loan.employmentLength = normalizedLoan.employmentLength;
        loan.homeOwnership = normalizedLoan.homeOwnership;
        loan.verificationStatus = normalizedLoan.verificationStatus;
        loan.riskAssessmentStatus = "pending";
        loan.riskAssessmentError = "";

        try {
            const riskData = await assessLoanRisk(loan);
            loan.riskScore = riskData.riskScore;
            loan.riskLevel = riskData.riskLevel;
            loan.defaultProbability = riskData.defaultProbability;
            loan.riskExplanations = riskData.explanations;
            loan.riskAssessmentStatus = "assessed";
            loan.riskAssessmentError = "";
        } catch (error) {
            loan.riskScore = null;
            loan.riskLevel = null;
            loan.defaultProbability = null;
            loan.riskExplanations = [];
            loan.riskAssessmentStatus = "failed";
            loan.riskAssessmentError = error.message;
        }

        await loan.save();
        return res.status(200).json({ loan });
    } catch (error) {
        return res.status(500).json({
            message: "Error reassessing loan",
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

        if (loan.status !== "pending") {
            return res.status(409).json({ message: "Only pending loans can be approved." });
        }

        const decisionComment = String(req.body?.comment || "").trim().slice(0, 500);

        const emiDetails = calculateEmi(loan.amount, loan.interestRate, loan.duration);
        if (!emiDetails) {
            return res.status(400).json({ message: "Loan terms are invalid for EMI calculation." });
        }

        loan.emi = Number(emiDetails.emi.toFixed(2));
        loan.totalAmount = Number(emiDetails.totalAmount.toFixed(2));
        loan.totalInterest = Number(emiDetails.totalInterest.toFixed(2));
        loan.remainingBalance = loan.totalAmount;

        loan.status = "approved";
        loan.decisionComment = decisionComment;
        loan.decisionBy = req.user.id;
        loan.decisionAt = new Date();

        const nextMonth = new Date();

        nextMonth.setMonth(nextMonth.getMonth() + 1);

        loan.nextDueDate = nextMonth;

        await loan.save();

        // Blockchain Integration
        let blockchainStatus = "pending";
        try {

            const blockchainResponse = await axios.post(
                `${BLOCKCHAIN_API_URL}/api/blockchain/loans/record`,
                {
                    loanId: loan.blockchainLoanId || getBlockchainLoanId(loan._id),
                    applicantAddress: "0xD65f293334F5B6f11fB52547200f1c5d49a958d8",
                    applicantName: "FintrixAI User",
                    loanAmount: loan.amount,
                    interestRate: loan.interestRate,
                    tenureMonths: loan.duration,
                    status: "APPROVED",
                    note: decisionComment
                },
                { timeout: 10000 }
            );

            loan.blockchainHash =
                blockchainResponse.data.transaction_hash || "";
            loan.blockchainLoanId = loan.blockchainLoanId || getBlockchainLoanId(loan._id);
            loan.blockchainBlockNumber = blockchainResponse.data.block_number ?? null;
            loan.blockchainPayloadHash = blockchainResponse.data.payload_hash || "";
            loan.blockchainTimestamp = blockchainResponse.data.timestamp
                ? new Date(blockchainResponse.data.timestamp)
                : new Date();
            loan.blockchainVerificationStatus = blockchainResponse.data.verification_status || "Verified";
            blockchainStatus = "confirmed";

            await loan.save();

            console.log(
                "Blockchain Record Created:",
                blockchainResponse.data.transaction_hash
            );

        } catch (blockchainError) {

            loan.blockchainVerificationStatus = "Failed";
            await loan.save();
            blockchainStatus = "failed";

            console.log(
                "Blockchain Logging Error:",
                blockchainError.response?.data ||
                blockchainError.message
            );

        }

        res.status(200).json({
            message: "Loan approved successfully",
            loan,
            blockchainStatus
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

        if (loan.status !== "pending") {
            return res.status(409).json({ message: "Only pending loans can be rejected." });
        }

        loan.status = "rejected";
        loan.decisionComment = String(req.body?.comment || "").trim().slice(0, 500);
        loan.decisionBy = req.user.id;
        loan.decisionAt = new Date();

        await loan.save();

        let blockchainStatus = "pending";
        try {
            const blockchainResponse = await axios.post(
                `${BLOCKCHAIN_API_URL}/api/blockchain/loans/record`,
                {
                    loanId: loan.blockchainLoanId || getBlockchainLoanId(loan._id),
                    applicantAddress: "0xD65f293334F5B6f11fB52547200f1c5d49a958d8",
                    applicantName: "FintrixAI User",
                    loanAmount: loan.amount,
                    interestRate: loan.interestRate,
                    tenureMonths: loan.duration,
                    status: "REJECTED",
                    note: loan.decisionComment
                },
                { timeout: 10000 }
            );

            loan.blockchainHash = blockchainResponse.data.transaction_hash || "";
            loan.blockchainLoanId = loan.blockchainLoanId || getBlockchainLoanId(loan._id);
            loan.blockchainBlockNumber = blockchainResponse.data.block_number ?? null;
            loan.blockchainPayloadHash = blockchainResponse.data.payload_hash || "";
            loan.blockchainTimestamp = blockchainResponse.data.timestamp
                ? new Date(blockchainResponse.data.timestamp)
                : new Date();
            loan.blockchainVerificationStatus = blockchainResponse.data.verification_status || "Verified";
            blockchainStatus = "confirmed";
            await loan.save();
        } catch (blockchainError) {
            loan.blockchainVerificationStatus = "Failed";
            await loan.save();
            console.log("Blockchain Logging Error:", blockchainError.response?.data || blockchainError.message);
            blockchainStatus = "failed";
        }

        res.status(200).json({
            message: "Loan rejected successfully",
            loan,
            blockchainStatus
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
        }).sort({ createdAt: -1, _id: -1 });

        res.status(200).json(loans);

    } catch (error) {

        res.status(500).json({
            message: "Error fetching loans",
            error: error.message
        });

    }
};

exports.getMyLoan = async (req, res) => {
    try {
        const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });

        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }

        res.status(200).json(loan);
    } catch (error) {
        res.status(500).json({ message: "Error fetching loan", error: error.message });
    }
};

exports.getMyLoanDetails = async (req, res) => {
    try {
        const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });

        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }

        const Transaction = require("../models/Transaction");
        const transactions = await Transaction.find({
            loanId: loan._id,
            userId: req.user.id
        }).sort({ paymentDate: -1, _id: -1 });

        let blockchain = { audit_trail: [] };
        if (loan.blockchainLoanId !== null && loan.blockchainLoanId !== undefined) {
            try {
                const [verificationResponse, auditResponse] = await Promise.all([
                    axios.get(`${BLOCKCHAIN_API_URL}/api/blockchain/loans/verify/${loan.blockchainLoanId}`, { timeout: 5000 }),
                    axios.get(`${BLOCKCHAIN_API_URL}/api/blockchain/loans/audit/${loan.blockchainLoanId}`, { timeout: 5000 })
                ]);
                blockchain = {
                    ...verificationResponse.data,
                    audit_trail: auditResponse.data.audit_trail || []
                };
            } catch (error) {
                blockchain = { audit_trail: [], error: "Blockchain service unavailable" };
            }
        }

        res.status(200).json({ loan, transactions, blockchain });
    } catch (error) {
        res.status(500).json({ message: "Error fetching loan details", error: error.message });
    }
};