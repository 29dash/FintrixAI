export function calculateEmi(principal, annualRate, durationMonths) {
  const amount = Number(principal);
  const rate = Number(annualRate);
  const months = Number(durationMonths);

  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(rate) || rate < 0 || !Number.isFinite(months) || months <= 0) {
    return null;
  }

  if (rate === 0) return amount / months;

  const monthlyRate = rate / 12 / 100;
  const growth = (1 + monthlyRate) ** months;
  return (amount * monthlyRate * growth) / (growth - 1);
}

export function hasRiskScore(loan) {
  return loan?.riskAssessmentStatus === "assessed" && Number.isFinite(Number(loan.riskScore));
}

export function riskLabel(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return "Not yet calculated";
  if (numericScore >= 80) return "High Risk";
  if (numericScore >= 50) return "Medium Risk";
  return "Low Risk";
}

export function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `₹${number.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "—";
}
