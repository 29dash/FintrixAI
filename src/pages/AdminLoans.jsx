import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiSearch, FiX } from "react-icons/fi";

import {
  getAdminLoanDetails,
  getAdminLoans,
  reassessAdminLoan,
  submitLoanDecision,
} from "../api";
import AppLayout from "../components/AppLayout";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../state/useToast";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const initialFilters = {
  page: 1,
  pageSize: 10,
  status: "",
  riskLevel: "",
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN") : "N/A";
}

function AdminLoans() {
  const [filters, setFilters] = useState(initialFilters);
  const [result, setResult] = useState({ loans: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [comment, setComment] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [reassessing, setReassessing] = useState(false);
  const { showToast } = useToast();

  const loadLoans = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      setResult(await getAdminLoans(nextFilters));
    } catch (requestError) {
      setError(requestError.message || "Unable to load loans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    getAdminLoans(initialFilters)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || "Unable to load loans.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateFilter = (key, value) => {
    const nextFilters = { ...filters, [key]: value, page: 1 };
    setFilters(nextFilters);
    loadLoans(nextFilters);
  };

  const openDetails = async (loanId) => {
    setSelectedLoan(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const data = await getAdminLoanDetails(loanId);
      setSelectedLoan(data);
      setComment(data.loan.decisionComment || "");
    } catch (requestError) {
      setDetailError(requestError.message || "Unable to load loan details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDecision = async (decision) => {
    if (!selectedLoan || selectedLoan.loan.status !== "pending") return;
    setDecisionLoading(true);
    try {
      const response = await submitLoanDecision(selectedLoan.loan._id, decision, comment);
      const blockchainMessage = response.blockchainStatus === "failed"
        ? " MongoDB updated, but blockchain confirmation failed."
        : response.blockchainStatus === "pending"
          ? " MongoDB updated; blockchain confirmation is pending."
          : " Blockchain confirmation completed.";
      showToast(`${response.message || `Loan ${decision} successfully.`}${blockchainMessage}`, response.blockchainStatus === "failed" ? "error" : "success");
      setSelectedLoan({ ...selectedLoan, loan: response.loan });
      await loadLoans();
    } catch (requestError) {
      showToast(requestError.message || "Unable to update loan decision.", "error");
    } finally {
      setDecisionLoading(false);
    }
  };

  const toggleSort = (sortBy) => {
    const nextFilters = {
      ...filters,
      page: 1,
      sortBy,
      sortOrder: filters.sortBy === sortBy && filters.sortOrder === "desc" ? "asc" : "desc",
    };
    setFilters(nextFilters);
    loadLoans(nextFilters);
  };

  const handleReassess = async () => {
    if (!selectedLoan) return;
    setReassessing(true);
    try {
      const response = await reassessAdminLoan(selectedLoan.loan._id);
      setSelectedLoan({ ...selectedLoan, loan: response.loan });
      await loadLoans();
      showToast("Risk assessment refreshed.", "success");
    } catch (requestError) {
      showToast(requestError.message || "Unable to reassess this loan.", "error");
    } finally {
      setReassessing(false);
    }
  };

  const changePage = (page) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    loadLoans(nextFilters);
  };

  return (
    <AppLayout
      sidebarVariant="admin"
      title="All Loans"
      subtitle="Review applications, inspect risk assessments, and make lending decisions."
    >
      <SectionCard title="Loan applications" subtitle={`${result.pagination.total} total records`}>
        <div className="admin-filters">
          <label className="admin-search">
            <FiSearch />
            <input
              value={filters.search}
              placeholder="Search applicant name or email"
              onChange={(event) => updateFilter("search", event.target.value)}
            />
          </label>
          <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
          </select>
          <select value={filters.riskLevel} onChange={(event) => updateFilter("riskLevel", event.target.value)}>
            <option value="">All risk levels</option>
            <option value="Low">Low risk</option>
            <option value="Medium">Medium risk</option>
            <option value="High">High risk</option>
          </select>
        </div>

        {loading ? (
          <LoadingState label="Loading loan applications..." />
        ) : error ? (
          <div className="inline-error">{error}</div>
        ) : result.loans.length === 0 ? (
          <EmptyState title="No loans found" description="Try changing the filters or search term." />
        ) : (
          <div className="table-card table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Applicant</th>
                  <th><button type="button" className="table-sort" onClick={() => toggleSort("amount")}>Amount</button></th>
                  <th>Purpose</th>
                  <th><button type="button" className="table-sort" onClick={() => toggleSort("status")}>Status</button></th>
                  <th><button type="button" className="table-sort" onClick={() => toggleSort("riskScore")}>Risk Score</button></th>
                  <th><button type="button" className="table-sort" onClick={() => toggleSort("interestRate")}>Interest</button></th>
                  <th><button type="button" className="table-sort" onClick={() => toggleSort("createdAt")}>Created</button></th>
                </tr>
              </thead>
              <tbody>
                {result.loans.map((loan) => (
                  <tr key={loan._id} className="table-row--clickable" onClick={() => openDetails(loan._id)}>
                    <td>{loan._id.slice(-8)}</td>
                    <td>
                      <strong>{loan.userId?.name || "Unknown"}</strong>
                      <span className="table-secondary">{loan.userId?.email || "N/A"}</span>
                    </td>
                    <td>{currency.format(loan.amount || 0)}</td>
                    <td>{loan.purpose || "N/A"}</td>
                    <td><StatusBadge status={loan.status} /></td>
                    <td>{loan.riskScore === null || loan.riskScore === undefined ? "N/A" : `${loan.riskScore}%`}</td>
                    <td>{loan.interestRate || 0}%</td>
                    <td>{formatDate(loan.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination-bar">
          <span>Page {result.pagination.page} of {Math.max(result.pagination.totalPages, 1)}</span>
          <div className="pagination-bar__actions">
            <button className="button button--tiny button--secondary" disabled={result.pagination.page <= 1} onClick={() => changePage(result.pagination.page - 1)}>
              <FiChevronLeft />
              Previous
            </button>
            <button className="button button--tiny button--secondary" disabled={result.pagination.page >= result.pagination.totalPages} onClick={() => changePage(result.pagination.page + 1)}>
              Next
              <FiChevronRight />
            </button>
          </div>
        </div>
      </SectionCard>

      {(detailLoading || selectedLoan || detailError) && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedLoan(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="loan-detail-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-card__header">
              <div>
                <h2 id="loan-detail-title">Loan review</h2>
                {selectedLoan && <p>{selectedLoan.loan._id}</p>}
              </div>
              <button type="button" className="icon-button" aria-label="Close loan details" onClick={() => setSelectedLoan(null)}><FiX /></button>
            </div>

            {detailLoading && <LoadingState label="Loading loan details..." />}
            {detailError && <div className="inline-error">{detailError}</div>}
            {selectedLoan && (
              <div className="modal-card__body">
                <div className="info-grid">
                  <div className="detail-item"><span className="kv-label">Applicant</span><span className="kv-value">{selectedLoan.loan.userId?.name} ({selectedLoan.loan.userId?.email})</span></div>
                  <div className="detail-item"><span className="kv-label">Amount</span><span className="kv-value">{currency.format(selectedLoan.loan.amount || 0)}</span></div>
                  <div className="detail-item"><span className="kv-label">Purpose</span><span className="kv-value">{selectedLoan.loan.purpose}</span></div>
                  <div className="detail-item"><span className="kv-label">Status</span><span className="kv-value"><StatusBadge status={selectedLoan.loan.status} /></span></div>
                  <div className="detail-item"><span className="kv-label">Risk assessment</span><span className="kv-value">{selectedLoan.loan.riskScore ?? "N/A"}% · {selectedLoan.loan.riskLevel || "Pending"}</span></div>
                  <div className="detail-item"><span className="kv-label">Interest rate</span><span className="kv-value">{selectedLoan.loan.interestRate}%</span></div>
                  <div className="detail-item"><span className="kv-label">Duration</span><span className="kv-value">{selectedLoan.loan.duration} months</span></div>
                  <div className="detail-item"><span className="kv-label">Blockchain</span><span className="kv-value">{selectedLoan.blockchain?.verification_status || "Pending"}</span></div>
                </div>

                <SectionCard title="Risk explanation" subtitle="Latest AI assessment">
                  {selectedLoan.loan.riskExplanations?.length ? <ul className="detail-list">{selectedLoan.loan.riskExplanations.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted-copy">No explanation available.</p>}
                </SectionCard>

                {selectedLoan.loan.status === "pending" && (
                  <div className="decision-panel">
                    <label className="field">
                      <span className="field__label">Decision comment (optional)</span>
                      <textarea value={comment} maxLength={500} placeholder="Add context for the applicant audit trail" onChange={(event) => setComment(event.target.value)} />
                    </label>
                    <div className="decision-panel__actions">
                      <button type="button" className="button button--primary" disabled={decisionLoading} onClick={() => handleDecision("approve")}>Approve loan</button>
                      <button type="button" className="button button--danger" disabled={decisionLoading} onClick={() => handleDecision("reject")}>Reject loan</button>
                    </div>
                  </div>
                )}

                <div className="modal-card__footer">
                  <button type="button" className="button button--secondary" disabled={reassessing} onClick={handleReassess}><FiRefreshCw />{reassessing ? "Reassessing..." : "Re-trigger risk assessment"}</button>
                  <span className="muted-copy">Audit entries: {selectedLoan.blockchain?.audit_trail?.length || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default AdminLoans;