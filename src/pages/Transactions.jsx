import { useEffect, useState } from "react";
import { FiFileText, FiInbox } from "react-icons/fi";

import AppLayout from "../components/AppLayout";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import { getLoanDetails } from "../api";
import { useLoans } from "../state/useLoans";
import { formatCurrency } from "../utils/loan";

function Transactions() {
  const { selectedLoan: loan } = useLoans();
  const [transactions, setTransactions] = useState([]);
  const [loadedLoanId, setLoadedLoanId] = useState(null);
  const [error, setError] = useState("");
  const loading = Boolean(loan?._id && loadedLoanId !== loan._id);

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
            <thead><tr><th>Transaction ID</th><th>Date</th><th>Amount</th><th>Status</th><th>Hash</th><th>Actions</th></tr></thead>
            <tbody>{transactions.map((tx) => <tr key={tx._id}>
              <td>{tx._id?.slice(-8) || "N/A"}</td>
              <td>{tx.paymentDate ? new Date(tx.paymentDate).toLocaleDateString() : "N/A"}</td>
              <td>{formatCurrency(tx.amount)}</td>
              <td><StatusBadge status={tx.status || "Paid"} /></td>
              <td>{tx.transactionHash || "Awaiting confirmation"}</td>
              <td><button type="button" className="button button--tiny button--secondary"><FiFileText /><span>View</span></button></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}

export default Transactions;
