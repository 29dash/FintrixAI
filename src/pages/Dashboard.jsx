import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiLoader,
  FiShield,
} from "react-icons/fi";

import AppLayout from "../components/AppLayout";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import RiskScoreCard from "../components/RiskScoreCard";
import RetryAssessmentButton from "../components/RetryAssessmentButton";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import { payLoan } from "../api";
import { useLoans } from "../state/useLoans";
import { useToast } from "../state/useToast";
import { calculateEmi, formatCurrency, hasRiskScore, riskLabel } from "../utils/loan";

function Dashboard() {
  const { selectedLoan: loan, user, loading, error, refreshLoans } = useLoans();
  const { showToast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const isAdmin = Boolean(user?.isAdmin);
  const riskValue = hasRiskScore(loan) ? Number(loan.riskScore) : null;
  const riskLevelText = riskValue === null ? "Not yet calculated" : riskLabel(riskValue);
  const calculatedEmi = calculateEmi(loan?.amount, loan?.interestRate, loan?.duration);
  const monthlyEmi = Number.isFinite(Number(loan?.emi)) && Number(loan.emi) > 0 ? loan.emi : calculatedEmi;
  const estimatedInterest = monthlyEmi && loan?.duration ? (Number(monthlyEmi) * Number(loan.duration)) - Number(loan.amount) : null;
  const hasAssessmentFailure = loan?.riskAssessmentStatus === "failed";
  const needsAssessment = ["failed", "pending"].includes(loan?.riskAssessmentStatus);
  const isActiveLoan = ["approved", "overdue"].includes(loan?.status);
  const defaultPaymentAmount = !isAdmin && isActiveLoan && loan ? String(Number(monthlyEmi || 0)) : "";
  const riskDescription =
    hasAssessmentFailure
      ? "Risk assessment could not be completed. Please try again when the model service is available."
      : riskValue === null
        ? "Your risk assessment is pending. We’ll update this once the model analysis completes."
        : `Your application is currently classified as ${riskLabel(riskValue).toLowerCase()}.`;

  const handlePayEMI = async () => {
    if (!loan?._id) return;

    const parsedAmount = Number(paymentAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showToast("Enter a valid EMI amount to pay.", "error");
      return;
    }

    setSubmittingPayment(true);

    try {
      const response = await payLoan(loan._id, parsedAmount);
      setPaymentAmount("");
      showToast(response?.message || "Payment successful.", "success");
      window.dispatchEvent(new CustomEvent("fintrix-transactions-refresh", { detail: { loanId: loan._id } }));
      await refreshLoans();
    } catch (requestError) {
      showToast(requestError.message || "Payment failed.", "error");
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <AppLayout sidebarVariant="user">
        <LoadingState label="Loading your dashboard..." />
      </AppLayout>
    );
  }

  if (!loan) {
    return (
      <AppLayout sidebarVariant="user" title="Dashboard" subtitle="Welcome back. Here’s an overview of your loan activity.">
        <div className="empty-state-panel">
          <EmptyState
            title="No loans found"
            description="Apply for a loan to unlock your dashboard insights, risk analysis, and payment history."
            icon={<FiCreditCard />}
            action={
              <Link to="/loan" className="button button--primary">
                Apply Loan
              </Link>
            }
          />
        </div>
      </AppLayout>
    );
  }

  const greeting =
    new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const displayName = user?.name ? `, ${user.name}` : "";

  return (
    <AppLayout
      sidebarVariant="user"
      title="Dashboard"
      subtitle={`${greeting}${displayName}. Here’s an overview of your loan activity.`}
    >
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="stats-grid stats-grid--four">
        <StatCard label="Loan Amount" value={formatCurrency(loan.amount)} hint="Current facility" icon={FiDollarSign} />
        <StatCard label="Monthly EMI" value={monthlyEmi === null ? "—" : formatCurrency(monthlyEmi)} hint={loan.emi ? "Approved repayment" : "Calculated preview"} icon={FiCreditCard} />
        <StatCard label="Risk Score" value={riskValue === null ? "Not yet calculated" : `${Math.round(riskValue)}%`} hint={riskLevelText} icon={FiActivity} />
        <StatCard
          label="Loan Status"
          value={String(loan.status || "Pending").replace(/\b\w/g, (c) => c.toUpperCase())}
          tone={loan.status === "approved" ? "success" : loan.status === "rejected" ? "danger" : "warning"}
          hint={loan.status === "approved" ? "Approved" : "Under review"}
          icon={FiCheckCircle}
        />
      </div>

      <div className="content-grid content-grid--two">
        <SectionCard title="Risk Overview" subtitle="AI-powered assessment summary">
          <RiskScoreCard
            value={riskValue}
            label={riskLevelText}
            description={riskDescription}
          />
          {needsAssessment && <div className="assessment-retry"><p className="assessment-error">{loan.riskAssessmentError || (hasAssessmentFailure ? "The ML service did not return a usable response." : "This loan is waiting for risk analysis.")}</p><RetryAssessmentButton loan={loan} /></div>}
        </SectionCard>

        <SectionCard title="Loan Overview" subtitle="Application details and balance summary">
          <div className="info-grid">
            <div className="detail-item">
              <span className="kv-label">Purpose</span>
              <span className="kv-value">{loan.purpose || "Not provided"}</span>
            </div>

            <div className="detail-item">
              <span className="kv-label">Duration</span>
              <span className="kv-value">{loan.duration ? `${loan.duration} months` : "Not provided"}</span>
            </div>

            <div className="detail-item">
              <span className="kv-label">Interest Rate</span>
              <span className="kv-value">{loan.interestRate ? `${loan.interestRate}%` : "Not provided"}</span>
            </div>

            <div className="detail-item">
              <span className="kv-label">Loan Amount</span>
              <span className="kv-value">{formatCurrency(loan.amount)}</span>
            </div>

            <div className="detail-item">
              <span className="kv-label">EMI</span>
              <span className="kv-value">{monthlyEmi !== null && Number.isFinite(Number(monthlyEmi)) ? formatCurrency(monthlyEmi) : "Not yet calculated"}</span>
            </div>

            <div className="detail-item">
              <span className="kv-label">Remaining Balance</span>
              <span className="kv-value">{["approved", "paid", "overdue"].includes(loan.status) && loan.remainingBalance !== null && loan.remainingBalance !== undefined ? formatCurrency(loan.remainingBalance) : "Not yet calculated"}</span>
            </div>

            <div className="detail-item">
              <span className="kv-label">Principal</span>
              <span className="kv-value">{formatCurrency(loan.amount)}</span>
            </div>

            <div className="detail-item">
              <span className="kv-label">Total Interest</span>
              <span className="kv-value">{loan.totalInterest > 0 ? formatCurrency(loan.totalInterest) : estimatedInterest !== null ? formatCurrency(estimatedInterest) : "Not yet calculated"}</span>
            </div>

            <div className="detail-item">
              <span className="kv-label">Created On</span>
              <span className="kv-value">
                {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : "Not available"}
              </span>
            </div>
          </div>

          {!isAdmin && isActiveLoan && (
            <div className="payment-form" style={{ marginTop: "1.25rem" }}>
              <div className="detail-item" style={{ width: "100%" }}>
                <span className="kv-label">Pay EMI</span>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  <input
                    key={`${loan?._id || "loan"}-${loan?.status || "status"}`}
                    type="number"
                    min="0"
                    step="100"
                    value={paymentAmount || defaultPaymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder="EMI amount"
                    style={{ flex: 1, minWidth: 160, padding: "0.7rem 0.9rem", borderRadius: 8, border: "1px solid #d1d5db" }}
                  />
                  <button
                    type="button"
                    className="button button--primary"
                    disabled={submittingPayment}
                    onClick={handlePayEMI}
                  >
                    {submittingPayment ? <><FiLoader style={{ marginRight: 6, animation: "spin 1s linear infinite" }} /> Processing...</> : "Pay EMI"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="summary-callout">
        <div>
          <div className="kv-label">Security status</div>
          <div className="summary-callout__value">{loan.blockchainHash ? "Verified on blockchain" : "Awaiting blockchain verification"}</div>
        </div>
        <div className="summary-callout__meta">
          <FiShield />
        </div>
      </div>
      <SectionCard title="Why this score" subtitle="Top factors from the risk model">
        {loan.riskExplanations?.length > 0 ? (
          <ul className="explanation-list">
            {loan.riskExplanations.slice(0, 3).map((factor) => <li key={factor}>{factor}</li>)}
          </ul>
        ) : <p className="muted-copy">{hasAssessmentFailure ? "No factors are available because the assessment failed." : "Factors will appear after risk analysis completes."}</p>}
      </SectionCard>
    </AppLayout>
  );
}

export default Dashboard;