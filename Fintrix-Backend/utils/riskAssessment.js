const axios = require("axios");

const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:8000";
const { normalizeCibilToFico, getRiskLevel } = require("./loanCalculations");

const categoryAliases = {
    homeOwnership: {
        any: "ANY",
        mortgage: "MORTGAGE",
        own: "OWN",
        rent: "RENT",
    },
    verificationStatus: {
        "not verified": "Not Verified",
        "source verified": "Source Verified",
        verified: "Verified",
    },
    employmentLength: {
        "< 1": "< 1 year",
        "< 1 year": "< 1 year",
        "1": "1 year",
        "2": "2 years",
        "3": "3 years",
        "4": "4 years",
        "5": "5 years",
        "6": "6 years",
        "7": "7 years",
        "8": "8 years",
        "9": "9 years",
        "10+": "10+ years",
    },
};

function aliasCategory(group, value) {
    const text = String(value || "").trim();
    return categoryAliases[group]?.[text.toLowerCase()] || text;
}

function normalizeLegacyLoan(loan) {
    const source = typeof loan?.toObject === "function" ? loan.toObject() : loan;
    return {
        ...source,
        // Older records predate the required Grade field; C is a transparent model proxy for reassessment only.
        grade: source.grade || "C",
        employmentLength: aliasCategory("employmentLength", source.employmentLength),
        homeOwnership: aliasCategory("homeOwnership", source.homeOwnership),
        verificationStatus: aliasCategory("verificationStatus", source.verificationStatus),
    };
}

function buildPredictionPayload(loan) {
    const normalizedLoan = normalizeLegacyLoan(loan);
    return {
        loan_amnt: Number(normalizedLoan.amount),
        term: Number(normalizedLoan.duration),
        int_rate: Number(normalizedLoan.interestRate),
        grade: normalizedLoan.grade,
        emp_length: normalizedLoan.employmentLength,
        home_ownership: normalizedLoan.homeOwnership,
        annual_inc: Number(normalizedLoan.annualIncome),
        verification_status: normalizedLoan.verificationStatus,
        purpose: normalizedLoan.purpose,
        dti: Number(normalizedLoan.dti),
        fico_score: Number(normalizedLoan.ficoScore) || normalizeCibilToFico(normalizedLoan.cibilScore),
        open_acc: Number(normalizedLoan.openAccounts),
        revol_bal: Number(normalizedLoan.revolvingBalance),
        revol_util: Number(normalizedLoan.revolvingUtilization),
        total_acc: Number(normalizedLoan.totalAccounts),
    };
}

function validateRiskResponse(data) {
    if (data?.risk_score === null || data?.risk_score === undefined || data?.default_probability === null || data?.default_probability === undefined) {
        throw new Error("ML service returned an incomplete risk assessment.");
    }

    const score = Number(data?.risk_score);
    const probability = Number(data?.default_probability);
    const level = getRiskLevel(score);

    if (!Number.isFinite(score) || score < 0 || score > 100) {
        throw new Error("ML service returned an invalid risk score.");
    }

    if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
        throw new Error("ML service returned an invalid default probability.");
    }

    if (!level) {
        throw new Error("ML service returned an invalid risk level.");
    }

    return {
        riskScore: score,
        riskLevel: level,
        defaultProbability: probability,
        explanations: Array.isArray(data.explanation) ? data.explanation.slice(0, 3) : [],
    };
}

async function assessLoanRisk(loan) {
    try {
        const response = await axios.post(
            `${ML_API_URL}/predict`,
            buildPredictionPayload(loan),
            { timeout: 10000 }
        );

        return validateRiskResponse(response.data);
    } catch (error) {
        const detail = error.response?.data?.detail;
        const message = Array.isArray(detail)
            ? detail.map((item) => item.msg).join("; ")
            : detail || error.message;
        const assessmentError = new Error(message || "Risk assessment failed.");
        assessmentError.cause = error;
        throw assessmentError;
    }
}

module.exports = {
    assessLoanRisk,
    buildPredictionPayload,
    normalizeLegacyLoan,
    validateRiskResponse,
};
