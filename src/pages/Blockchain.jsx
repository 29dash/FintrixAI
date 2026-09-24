import { useEffect, useState } from "react";
import { FiCheckCircle, FiClock, FiShield } from "react-icons/fi";

import AppLayout from "../components/AppLayout";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import { getLoanDetails } from "../api";
import { useLoans } from "../state/useLoans";
import { formatCurrency, hasRiskScore, riskLabel } from "../utils/loan";

const steps = [
  { key: "created", label: "Loan Created" },
  { key: "risk", label: "Risk Analysis Completed" },
  { key: "approved", label: "Loan Approved" },
  { key: "recorded", label: "Blockchain Recorded" },
  { key: "verified", label: "Transaction Verified" },
];

function Blockchain() {
  const { selectedLoan: loan } = useLoans();
  const [details, setDetails] = useState(null);
  const [loadedLoanId, setLoadedLoanId] = useState(null);
  const [error, setError] = useState("");
  const loading = Boolean(loan?._id && loadedLoanId !== loan._id);

  useEffect(() => {
    if (!loan?._id) {
      return;
    }

    let cancelled = false;
    getLoanDetails(loan._id)
      .then((data) => { if (!cancelled) { setDetails(data); setLoadedLoanId(loan._id); } })
      .catch((requestError) => { if (!cancelled) { setError(requestError.message); setLoadedLoanId(loan._id); } })

    return () => { cancelled = true; };
  }, [loan?._id]);

  if (!loan) {
    return (
      <AppLayout sidebarVariant="user" title="Blockchain Verification" subtitle="Verify immutable loan records and audit history.">
        <div className="empty-state-panel"><EmptyState title="No loan to verify" description="Apply for a loan before viewing its blockchain audit trail." icon={<FiShield />} /></div>
      </AppLayout>
    );
  }

  if (loading) return <AppLayout sidebarVariant="user"><LoadingState label="Loading blockchain records..." /></AppLayout>;

  const currentDetails = details?.loan?._id === loan._id ? details : null;
  const blockchain = currentDetails?.blockchain || { audit_trail: [] };
  const auditEntries = blockchain.audit_trail || [];
  const isVerified = Boolean(loan.blockchainHash || blockchain.verification_status === "Verified");
  const riskComplete = hasRiskScore(loan);
  const approved = ["approved", "paid"].includes(loan.status);
  const recorded = Boolean(loan.blockchainHash || loan.blockchainVerificationStatus === "Verified");
  const completed = { created: true, risk: riskComplete, approved, recorded, verified: isVerified };
  const hash = loan.blockchainHash || "Awaiting block confirmation";
  const entryFor = (key) => auditEntries.find((entry) => (key === "approved" && entry.actionType === 2) || ((key === "recorded" || key === "verified") && entry.actionType === 4));

  return (
    <AppLayout sidebarVariant="user" title="Blockchain Verification" subtitle="Verify immutable loan records and audit history.">
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="content-grid content-grid--two">
        <div className="verification-panel">
          <div className="verification-panel__header">
            <div><div className="kv-label">Verification Status</div><div className="verification-panel__status">{isVerified ? "Verified" : "Pending"}</div></div>
            {isVerified ? <FiCheckCircle className="verification-panel__icon verification-panel__icon--success" /> : <FiClock className="verification-panel__icon verification-panel__icon--warning" />}
          </div>
          <div className="kv-label">Transaction Hash</div>
          <div className="hash-box">{hash}</div>
          {isVerified && loan.blockchainExplorerUrl && <a className="hash-link" href={loan.blockchainExplorerUrl} target="_blank" rel="noreferrer">View on testnet explorer</a>}
          <div className="verification-panel__message">{isVerified ? "Transaction confirmed and recorded on-chain." : "Awaiting blockchain confirmation."}</div>
        </div>

        <div className="section-card section-card--nested">
          <div className="section-card__header"><h2 className="section-card__title">Blockchain Details</h2></div>
          <div className="info-grid">
            <div className="detail-item"><span className="kv-label">Loan Status</span><span className="kv-value">{loan.status || "Pending"}</span></div>
            <div className="detail-item"><span className="kv-label">Loan Amount</span><span className="kv-value">{formatCurrency(loan.amount)}</span></div>
            <div className="detail-item"><span className="kv-label">Risk Score</span><span className="kv-value">{riskComplete ? `${Math.round(loan.riskScore)}% · ${riskLabel(loan.riskScore)}` : "Not yet calculated"}</span></div>
            <div className="detail-item"><span className="kv-label">Interest Rate</span><span className="kv-value">{loan.interestRate ? `${loan.interestRate}%` : "—"}</span></div>
            <div className="detail-item"><span className="kv-label">Duration</span><span className="kv-value">{loan.duration ? `${loan.duration} months` : "—"}</span></div>
            <div className="detail-item"><span className="kv-label">Recorded On</span><span className="kv-value">{loan.blockchainTimestamp ? new Date(loan.blockchainTimestamp).toLocaleString() : "Not yet recorded"}</span></div>
          </div>
        </div>
      </div>

      <div className="timeline-card">
        <div className="section-card__header"><h2 className="section-card__title">Audit Trail</h2></div>
        <div className="timeline">
          {steps.map((step, index) => {
            const entry = entryFor(step.key);
            return <div key={step.key} className={`timeline__item ${index === steps.length - 1 ? "timeline__item--last" : ""} ${completed[step.key] ? "timeline__item--complete" : "timeline__item--pending"}`}>
              <span className="timeline__dot">{completed[step.key] && <FiCheckCircle />}</span>
              <span>{step.label}</span>
              <small>{entry?.timestamp ? new Date(entry.timestamp).toLocaleString() : completed[step.key] && step.key === "created" && loan.createdAt ? new Date(loan.createdAt).toLocaleString() : completed[step.key] ? "Confirmed" : "Pending"}</small>
            </div>;
          })}
        </div>
      </div>
      <div className="security-note"><FiShield /><span>Immutable records, transparent verification, and tamper-resistant audit history.</span></div>
    </AppLayout>
  );
}

export default Blockchain;
