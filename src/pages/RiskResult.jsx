import { Link } from "react-router-dom";
import { FiCreditCard } from "react-icons/fi";

import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import RetryAssessmentButton from "../components/RetryAssessmentButton";
import { useLoans } from "../state/useLoans";
import { hasRiskScore, riskLabel } from "../utils/loan";

function RiskResult() {
  const { selectedLoan: loan, loading } = useLoans();

  if (loading) return <div className="auth-shell auth-shell--compact"><LoadingState label="Loading risk assessment..." /></div>;

  if (!loan) {
    return <div className="auth-shell auth-shell--compact"><div className="empty-state-panel"><EmptyState title="No loan selected" description="Submit a loan application before viewing a risk assessment." icon={<FiCreditCard />} action={<Link className="button button--primary" to="/loan">Apply Loan</Link>} /></div></div>;
  }

  const assessed = hasRiskScore(loan);
  const failed = loan?.riskAssessmentStatus === "failed";
  const tone = assessed ? (loan.riskScore >= 80 ? "danger" : loan.riskScore >= 50 ? "warning" : "success") : "neutral";

  return (
    <div className="auth-shell auth-shell--compact">
      <div className="result-card">
        <div className="result-card__eyebrow">AI Risk Analysis</div>
        <h1 className="result-card__title">{assessed ? `${Math.round(loan.riskScore)}%` : "Not yet calculated"}</h1>
        <div className={`result-card__tag result-card__tag--${tone}`}>{assessed ? riskLabel(loan.riskScore) : failed ? "Assessment failed" : "Pending"}</div>
        <div className="result-card__section">
          <div className="kv-label">Risk assessment summary</div>
          <div className="result-card__summary">
            {failed ? <><p>Risk assessment could not be completed.</p><p className="assessment-error">{loan.riskAssessmentError || "The ML service did not return a usable response."}</p></> : assessed ? (loan.riskExplanations?.length ? loan.riskExplanations.slice(0, 3).map((item) => <p key={item}>{item}</p>) : <p>No explanation available.</p>) : "The risk model has not returned a score yet."}
          </div>
        </div>
        <div className="result-card__actions">
          <Link className="button button--primary" to="/dashboard">View Dashboard</Link>
          <RetryAssessmentButton loan={loan} />
          <Link className="button button--secondary" to="/loan">View Loan Details</Link>
        </div>
      </div>
    </div>
  );
}

export default RiskResult;
