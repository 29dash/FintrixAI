import { useEffect, useState } from "react";
import { FiFileText, FiInbox, FiX } from "react-icons/fi";

import AppLayout from "../components/AppLayout";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import { getLoanDetails, retryPaymentConfirmation } from "../api";
import { useLoans } from "../state/useLoans";
import { useToast } from "../state/useToast";
import { formatCurrency } from "../utils/loan";

function Transactions() {
  const { selectedLoan: loan } = useLoans();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [retryingPaymentId, setRetryingPaymentId] = useState(null);
  const [loadedLoanId, setLoadedLoanId] = useState(null);
  const [error, setError] = useState("");
  const loading = Boolean(loan?._id && loadedLoanId !== loan._id);

  const retryConfirmation = async (transaction) => {
    setRetryingPaymentId(transaction._id);
    try {
      const response = await retryPaymentConfirmation(transaction._id);
      const status = response.transaction?.status;
      showToast(response.message, status === "success" ? "success" : "error");
      setSelectedTransaction(response.transaction || transaction);
      window.dispatchEvent(new CustomEvent("fintrix-transactions-refresh", { detail: { loanId: loan?._id } }));
    } catch (requestError) {
      showToast(requestError.message || "Could not retry payment confirmation.", "error");
    } finally {
      setRetryingPaymentId(null);
    }
  };

  useEffect(() => {
    if (!loan?._id) {
      return undefined;
    }

    let cancelled = false;

    const fetchTransactions = async () => {
      try {
        const data = await getLoanDetails(loan._id);
        if (!cancelled) {
          setTransactions(data.transactions || []);
          setLoadedLoanId(loan._id);
          setError("");
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
          setLoadedLoanId(loan._id);
        }
      }
    };

    fetchTransactions();

    const handleRefresh = (event) => {
      const targetLoanId = event.detail?.loanId;
      if (!targetLoanId || targetLoanId === loan._id) {
        fetchTransactions();
      }
    };

    window.addEventListener("fintrix-transactions-refresh", handleRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener("fintrix-transactions-refresh", handleRefresh);
    };
  }, [loan?._id]);

  if (loading) return <AppLayout sidebarVariant="user"><LoadingState label="Loading transactions..." /></AppLayout>;

  return (
    <AppLayout sidebarVariant="user" title="Transaction History" subtitle={loan ? `Payments for ${formatCurrency(loan.amount)} loan · ${loan.duration || "—"} months at ${loan.interestRate || "—"}%` : "View all EMI payments and loan transactions."}>
      {error && <div className="form-error" role="alert">{error}</div>}
      {!loan ? (
        <div className="empty-state-panel empty-state-panel--compact"><EmptyState title="No loan selected" description="Apply for a loan before viewing linked payments." icon={<FiInbox />} /></div>
      ) : transactions.length === 0 ? (
        <div className="empty-state-panel empty-state-panel--compact"><EmptyState title="No transactions yet" description="Payment history for this loan will appear here once you make a transaction." icon={<FiInbox />} /></div>
      ) : (
        <div className="table-card table-responsive">
          <table className="data-table">
            <thead><tr><th>Transaction ID</th><th>Date</th><th>Amount</th><th>Payment Status</th><th>Blockchain Status</th><th>Hash</th><th>Actions</th></tr></thead>
            <tbody>{transactions.map((tx) => <tr key={tx._id}>
              <td>{tx._id?.slice(-8) || "N/A"}</td>
              <td>{tx.paymentDate ? new Date(tx.paymentDate).toLocaleDateString() : "N/A"}</td>
              <td>{formatCurrency(tx.amount)}</td>
              <td><StatusBadge status={tx.status || "Paid"} /></td>
              <td>
                <StatusBadge status={
                  tx.blockchainStatus === "recorded" || tx.transactionHash
                    ? "Recorded"
                    : tx.blockchainStatus === "failed" ? "Failed" : "Unknown"
                } />
              </td>
              <td>{tx.transactionHash || "Not recorded"}</td>
              <td>
                <button
                  type="button"
                  className="button button--tiny button--secondary"
                  aria-label={`View transaction ${tx._id}`}
                  onClick={() => setSelectedTransaction(tx)}
                >
                  <FiFileText /><span>View</span>
                </button>
                {tx.status === "pending" && (
                  <button
                    type="button"
                    className="button button--tiny button--secondary"
                    disabled={retryingPaymentId === tx._id}
                    onClick={() => retryConfirmation(tx)}
                  >
                    {retryingPaymentId === tx._id ? "Checking..." : "Retry confirmation"}
                  </button>
                )}
              </td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
      {selectedTransaction && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedTransaction(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__header">
              <div>
                <h2 id="transaction-detail-title">Payment details</h2>
                <p>{selectedTransaction._id}</p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close transaction details"
                onClick={() => setSelectedTransaction(null)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-card__body">
              <div className="info-grid">
                <div className="detail-item"><span className="kv-label">Payment date</span><span className="kv-value">{selectedTransaction.paymentDate ? new Date(selectedTransaction.paymentDate).toLocaleString() : "N/A"}</span></div>
                <div className="detail-item"><span className="kv-label">Amount</span><span className="kv-value">{formatCurrency(selectedTransaction.amount || 0)}</span></div>
                <div className="detail-item"><span className="kv-label">Remaining balance</span><span className="kv-value">{selectedTransaction.remainingBalance !== null && selectedTransaction.remainingBalance !== undefined ? formatCurrency(selectedTransaction.remainingBalance) : "N/A"}</span></div>
                <div className="detail-item"><span className="kv-label">Payment status</span><span className="kv-value"><StatusBadge status={selectedTransaction.status || "success"} /></span></div>
                <div className="detail-item"><span className="kv-label">Blockchain status</span><span className="kv-value">{selectedTransaction.blockchainStatus === "recorded" || selectedTransaction.transactionHash ? "Recorded" : selectedTransaction.blockchainStatus === "failed" ? "Failed" : "Unknown"}</span></div>
                {selectedTransaction.blockchainTxIndex !== undefined && <div className="detail-item"><span className="kv-label">Blockchain transaction index</span><span className="kv-value">{selectedTransaction.blockchainTxIndex}</span></div>}
              </div>
              <div className="detail-item" style={{ marginTop: "1rem" }}>
                <span className="kv-label">Transaction hash</span>
                <div className="hash-box">{selectedTransaction.transactionHash || "Not recorded"}</div>
              </div>
              {selectedTransaction.status === "pending" && (
                <div className="modal-card__footer">
                  <button
                    type="button"
                    className="button button--primary"
                    disabled={retryingPaymentId === selectedTransaction._id}
                    onClick={() => retryConfirmation(selectedTransaction)}
                  >
                    {retryingPaymentId === selectedTransaction._id ? "Checking..." : "Retry confirmation"}
                  </button>
                </div>
              )}
              <div className="modal-card__footer">
                <button type="button" className="button button--secondary" onClick={() => setSelectedTransaction(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default Transactions;
