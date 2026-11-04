import { useEffect, useState } from "react";
import { FiCheckCircle, FiClock, FiShield } from "react-icons/fi";

import AppLayout from "../components/AppLayout";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import { getLoanDetails } from "../api";
import { useLoans } from "../state/useLoans";
import { formatCurrency, hasRiskScore, riskLabel } from "../utils/loan";

const steps = [
  { key: "created", label: "Loan Created" },
  { key: "risk", label: "Risk Analysis Completed" },
  { key: "approved", label: "Loan Approved" },
  { key: "recorded", label: "Blockchain Recorded" },
];

function getLoanRecordStatus(loan, blockchain) {
  if (blockchain?.error) return "Unavailable";

  const verificationStatus = String(blockchain?.verification_status || "").toLowerCase();
  if (verificationStatus === "verified") return "Verified";
  if (verificationStatus === "not found") return "Not found";

  const storedStatus = String(loan?.blockchainVerificationStatus || "").toLowerCase();
  if (storedStatus === "failed") return "Failed";
  if (storedStatus === "verified") return "Verified";
  return "Pending";
}

function getPaymentChainStatus(transaction) {
  if (transaction.blockchainStatus === "recorded" || transaction.transactionHash) return "Recorded";
  if (transaction.blockchainStatus === "failed") return "Failed";
  return "Unknown";
}

function getPaymentStatusClass(status) {
  if (status === "Recorded") return "status-badge status-badge--success";
  if (status === "Failed") return "status-badge status-badge--danger";
  return "status-badge status-badge--warning";
}

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
    const fetchDetails = () => {
      getLoanDetails(loan._id)
        .then((data) => { if (!cancelled) { setDetails(data); setLoadedLoanId(loan._id); setError(""); } })
        .catch((requestError) => { if (!cancelled) { setError(requestError.message); setLoadedLoanId(loan._id); } });
    };
    fetchDetails();

    const handleRefresh = (event) => {
      const targetLoanId = event.detail?.loanId;
      if (!targetLoanId || targetLoanId === loan._id) fetchDetails();
    };
    window.addEventListener("fintrix-transactions-refresh", handleRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener("fintrix-transactions-refresh", handleRefresh);
    };
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
  const paymentTransactions = currentDetails?.transactions || [];
  const loanRecordStatus = getLoanRecordStatus(loan, blockchain);
  const isVerified = loanRecordStatus === "Verified";
  const riskComplete = hasRiskScore(loan);
  const approved = ["approved", "paid"].includes(loan.status);
  const recorded = isVerified;
  const completed = { created: true, risk: riskComplete, approved, recorded };
  const hash = loan.blockchainHash || "No loan-record hash";
  const entryFor = (key) => {
    if (key === "approved" || key === "recorded") return auditEntries.find((entry) => entry.actionType === 2);
    return null;
  };
  const loanRecordMessage = {
    Verified: "Loan record verified on-chain.",
    "Not found": "No loan record was found on-chain.",
    Failed: "Loan record logging failed.",
    Unavailable: "Blockchain verification is currently unavailable.",
    Pending: "Awaiting loan-record verification.",
  }[loanRecordStatus];

  return (
    <AppLayout sidebarVariant="user" title="Blockchain Verification" subtitle="Verify immutable loan records and audit history.">
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="content-grid content-grid--two">
        <div className="verification-panel">
          <div className="verification-panel__header">
            <div><div className="kv-label">Loan Record Status</div><div className="verification-panel__status">{loanRecordStatus}</div></div>
            {isVerified ? <FiCheckCircle className="verification-panel__icon verification-panel__icon--success" /> : <FiClock className="verification-panel__icon verification-panel__icon--warning" />}
          </div>
          <div className="kv-label">Loan Record Hash</div>
          <div className="hash-box">{hash}</div>
          {isVerified && loan.blockchainExplorerUrl && <a className="hash-link" href={loan.blockchainExplorerUrl} target="_blank" rel="noreferrer">View on testnet explorer</a>}
          <div className="verification-panel__message">{loanRecordMessage}</div>
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
        <div className="section-card__header"><h2 className="section-card__title">Loan Record Progress</h2></div>
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
      <SectionCard title="Payment Records" subtitle="Payment outcome and blockchain recording status">
        {paymentTransactions.length === 0 ? (
          <p className="muted-copy">No payments have been recorded for this loan.</p>
        ) : (
          <div className="table-card table-responsive">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Amount</th><th>Payment Status</th><th>Chain Status</th><th>Transaction Hash</th></tr></thead>
              <tbody>{paymentTransactions.map((transaction) => {
                const chainStatus = getPaymentChainStatus(transaction);
                return <tr key={transaction._id}>
                  <td>{transaction.paymentDate ? new Date(transaction.paymentDate).toLocaleString() : "N/A"}</td>
                  <td>{formatCurrency(transaction.amount)}</td>
                  <td>{(transaction.status || "success") === "success" ? "Successful" : transaction.status === "failed" ? "Failed" : "Pending"}</td>
                  <td>
                    <span className={getPaymentStatusClass(chainStatus)}>{chainStatus}</span>
                  </td>
                  <td>{transaction.transactionHash || "No hash returned"}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </SectionCard>
      <SectionCard title="Audit Trail" subtitle="On-chain audit entries for this loan">
        {auditEntries.length === 0 ? (
          <p className="muted-copy">No audit entries are available.</p>
        ) : (
          <div className="table-card table-responsive">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Action Type</th><th>Entry</th><th>Block</th></tr></thead>
              <tbody>{auditEntries.map((entry) => (
                <tr key={entry.entryId}>
                  <td>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "N/A"}</td>
                  <td>{entry.actionType}</td>
                  <td>{entry.note || "Audit entry"}</td>
                  <td>{entry.blockNumber ?? "N/A"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </SectionCard>
      <div className="security-note"><FiShield /><span>Immutable records, transparent verification, and tamper-resistant audit history.</span></div>
    </AppLayout>
  );
}

export default Blockchain;
