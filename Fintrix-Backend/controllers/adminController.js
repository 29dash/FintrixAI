const User = require("../models/User");
const Loan = require("../models/Loan");
const Transaction = require("../models/Transaction");
const axios = require("axios");
const { assessLoanRisk, normalizeLegacyLoan } = require("../utils/riskAssessment");

const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || "http://127.0.0.1:3001";

const LOAN_SORT_FIELDS = new Set([
    "createdAt",
    "amount",
    "riskScore",
    "interestRate",
    "status"
]);

function getLoanStatusFilter(status) {
    if (!status) {
        return undefined;
    }

    if (status === "closed") {
        return { $in: ["paid", "overdue"] };
    }

    return status;
}

const EMPTY_MONTHS = 6;

function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getLastMonths(count) {
    const months = [];
    const now = new Date();

    for (let offset = count - 1; offset >= 0; offset -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        months.push({
            key: getMonthKey(date),
            label: date.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
            count: 0
        });
    }

    return months;
}


// Get global metrics for the admin overview.
exports.getOverview = async (req, res) => {
    try {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - (EMPTY_MONTHS - 1), 1);
        monthStart.setHours(0, 0, 0, 0);

        const [loanSummary, riskSummary, monthlyLoans, totalUsers] = await Promise.all([
            Loan.aggregate([
                {
                    $group: {
                        _id: null,
                        totalLoans: { $sum: 1 },
                        totalDisbursed: {
                            $sum: {
                                $cond: [
                                    { $ne: ["$status", "rejected"] },
                                    { $ifNull: ["$amount", 0] },
                                    0
                                ]
                            }
                        },
                        activeLoans: {
                            $sum: {
                                $cond: [{ $in: ["$status", ["approved", "paid", "overdue"]] }, 1, 0]
                            }
                        },
                        pendingLoans: {
                            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                        },
                        rejectedLoans: {
                            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
                        },
                        averageRiskScore: { $avg: "$riskScore" }
                    }
                }
            ]),
            Loan.aggregate([
                { $match: { riskLevel: { $ne: null } } },
                {
                    $group: {
                        _id: { $toLower: "$riskLevel" },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Loan.aggregate([
                { $match: { createdAt: { $gte: monthStart } } },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]),
            User.countDocuments()
        ]);

        const summary = loanSummary[0] || {};
        const riskLevels = { low: 0, medium: 0, high: 0 };
        riskSummary.forEach(({ _id, count }) => {
            if (_id in riskLevels) {
                riskLevels[_id] = count;
            }
        });

        const volume = getLastMonths(EMPTY_MONTHS);
        monthlyLoans.forEach(({ _id, count }) => {
            const key = `${_id.year}-${String(_id.month).padStart(2, "0")}`;
            const month = volume.find((item) => item.key === key);
            if (month) {
                month.count = count;
            }
        });

        res.status(200).json({
            metrics: {
                totalLoans: summary.totalLoans || 0,
                totalDisbursed: summary.totalDisbursed || 0,
                activeLoans: summary.activeLoans || 0,
                pendingLoans: summary.pendingLoans || 0,
                rejectedLoans: summary.rejectedLoans || 0,
                averageRiskScore: Number((summary.averageRiskScore || 0).toFixed(1)),
                totalUsers
            },
            volume,
            riskLevels
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching admin overview",
            error: error.message
        });
    }
};

exports.getAdminLoans = async (req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const pageSize = Math.min(Math.max(Number.parseInt(req.query.pageSize, 10) || 10, 1), 100);
        const sortBy = LOAN_SORT_FIELDS.has(req.query.sortBy) ? req.query.sortBy : "createdAt";
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
        const filter = {};

        const statusFilter = getLoanStatusFilter(req.query.status);
        if (statusFilter) {
            filter.status = statusFilter;
        }
        if (req.query.riskLevel) {
            filter.riskLevel = new RegExp(`^${String(req.query.riskLevel).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
        }

        if (req.query.search) {
            const search = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            const matchingUsers = await User.find({ $or: [{ name: search }, { email: search }] }).select("_id");
            filter.userId = { $in: matchingUsers.map((user) => user._id) };
        }

        const [loans, total] = await Promise.all([
            Loan.find(filter)
                .populate("userId", "name email")
                .sort({ [sortBy]: sortOrder, _id: sortOrder })
                .skip((page - 1) * pageSize)
                .limit(pageSize),
            Loan.countDocuments(filter)
        ]);

        res.status(200).json({
            loans,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching admin loans", error: error.message });
    }
};

exports.getAdminLoanDetails = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id).populate("userId", "name email");
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }

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

        return res.status(200).json({ loan, blockchain });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching admin loan details", error: error.message });
    }
};

exports.reassessAdminLoan = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }

        const normalizedLoan = normalizeLegacyLoan(loan.toObject());
        Object.assign(loan, {
            grade: normalizedLoan.grade,
            employmentLength: normalizedLoan.employmentLength,
            homeOwnership: normalizedLoan.homeOwnership,
            verificationStatus: normalizedLoan.verificationStatus,
            riskAssessmentStatus: "pending",
            riskAssessmentError: ""
        });

        try {
            const riskData = await assessLoanRisk(loan);
            loan.riskScore = riskData.riskScore;
            loan.riskLevel = riskData.riskLevel;
            loan.defaultProbability = riskData.defaultProbability;
            loan.riskExplanations = riskData.explanations;
            loan.riskAssessmentStatus = "assessed";
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
        return res.status(500).json({ message: "Error reassessing loan", error: error.message });
    }
};

// Get All Users
exports.getAllUsers = async (req, res) => {

    try {

        const users = await User.find().select("-password");

        res.status(200).json(users);

    } catch (error) {

        res.status(500).json({
            message: "Error fetching users",
            error: error.message
        });

    }
};


// Get All Loans
exports.getAllLoans = async (req, res) => {

    try {

        const loans = await Loan.find().populate("userId");

        res.status(200).json(loans);

    } catch (error) {

        res.status(500).json({
            message: "Error fetching loans",
            error: error.message
        });

    }
};


exports.getAdminTransactions = async (req, res) => {
    try {
        const search = String(req.query.search || "").trim();
        const filter = {};

        if (search) {
            const userQuery = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            const matchingUsers = await User.find({
                $or: [
                    { name: userQuery },
                    { email: userQuery }
                ]
            }).select("_id");

            filter.userId = { $in: matchingUsers.map((user) => user._id) };
        }

        const transactions = await Transaction.find(filter)
            .populate("userId", "name email")
            .populate("loanId", "_id remainingBalance status")
            .sort({ paymentDate: -1, _id: -1 });

        const enrichedTransactions = transactions.map((transaction) => ({
            ...transaction.toObject(),
            loanId: transaction.loanId?._id || transaction.loanId || null,
            remainingBalance: transaction.remainingBalance ?? transaction.loanId?.remainingBalance ?? null,
            userId: transaction.userId || null
        }));

        return res.status(200).json(enrichedTransactions);
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching admin transactions",
            error: error.message
        });
    }
};

// Get All Transactions
exports.getAllTransactions = async (req, res) => {

    try {

        const transactions = await Transaction.find()
            .populate("userId")
            .populate("loanId");

        res.status(200).json(transactions);

    } catch (error) {

        res.status(500).json({
            message: "Error fetching transactions",
            error: error.message
        });

    }
};