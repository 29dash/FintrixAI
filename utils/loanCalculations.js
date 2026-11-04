const crypto = require("crypto");

function calculateEmi(principal, annualInterestRate, durationMonths) {
    const amount = Number(principal);
    const rate = Number(annualInterestRate);
    const months = Number(durationMonths);

    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(months) || months <= 0) {
        return null;
    }

    if (!Number.isFinite(rate) || rate < 0) {
        return null;
    }

    if (rate === 0) {
        const emi = amount / months;
        return {
            emi,
            totalAmount: amount,
            totalInterest: 0,
        };
    }

    const monthlyRate = rate / 12 / 100;
    const growth = Math.pow(1 + monthlyRate, months);
    const emi = (amount * monthlyRate * growth) / (growth - 1);
    const totalAmount = emi * months;

    return {
        emi,
        totalAmount,
        totalInterest: totalAmount - amount,
    };
}

function normalizeCibilToFico(cibilScore) {
    const score = Number(cibilScore);
    if (!Number.isFinite(score)) {
        return null;
    }

    return 300 + ((score - 300) * 550) / 600;
}

function getRiskLevel(score) {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) {
        return null;
    }

    if (numericScore >= 80) return "High";
    if (numericScore >= 50) return "Medium";
    return "Low";
}

function getBlockchainLoanId(loanId) {
    const digest = crypto.createHash("sha256").update(String(loanId)).digest();
    return digest.readUInt32BE(0) % 2147483647;
}

module.exports = {
    calculateEmi,
    normalizeCibilToFico,
    getRiskLevel,
    getBlockchainLoanId,
};
