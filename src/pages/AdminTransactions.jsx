import { useEffect, useState } from "react";
import { FiFileText } from "react-icons/fi";

import { getAdminTransactions } from "../api";
import AppLayout from "../components/AppLayout";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { formatCurrency } from "../utils/loan";

function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchTransactions = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminTransactions({ search: searchTerm.trim() });
        if (!cancelled) {
          setTransactions(Array.isArray(data) ? data : []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setTransactions([]);
          setError(requestError.message || "Unable to load transactions.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTransactions();

    return () => {
      cancelled = true;
    };
  }, [searchTerm]);

  if (loading) {
    return (
      <AppLayout sidebarVariant="admin" title="Transaction Monitoring" subtitle="Review all payments and financial activity.">
        <LoadingState label="Loading transactions..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      sidebarVariant="admin"
      title="Transaction Monitoring"
      subtitle="Monitor user payments, blockchain transactions, and financial activity."
    >
      <div className="stats-grid stats-grid--four">
        <StatCard label="Total Transactions" value={String(transactions.length)} icon={FiFileText} />
      </div>

      <SectionCard title="Financial Activity" subtitle="Recorded transaction history across the platform">
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by user name or email"
            style={{ width: "100%", maxWidth: 360, padding: "0.7rem 0.9rem", borderRadius: 8, border: "1px solid #d1d5db" }}
          />
        </div>

        {error && <div className="form-error" role="alert">{error}</div>}

        {transactions.length === 0 ? (
          <div className="empty-state-panel empty-state-panel--compact">
            <EmptyState
              title="No transactions found"
              description="Completed payments and blockchain entries will appear here."
              icon={<FiFileText />}
            />
          </div>
        ) : (
          <div className="table-card table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Loan ID</th>
                  <th>Amount Paid</th>
                  <th>Date</th>
                  <th>Resulting Remaining Balance</th>
                  <th>Transaction Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>
                      <div>{tx.userId?.name || "N/A"}</div>
                      <small>{tx.userId?.email || "Unknown email"}</small>
                    </td>
                    <td>{tx.loanId ? String(tx.loanId).slice(-8) : "N/A"}</td>
                    <td>{formatCurrency(tx.amount || 0)}</td>
                    <td>{tx.paymentDate ? new Date(tx.paymentDate).toLocaleDateString() : "N/A"}</td>
                    <td>{tx.remainingBalance !== null && tx.remainingBalance !== undefined ? formatCurrency(tx.remainingBalance) : "N/A"}</td>
                    <td><StatusBadge status={tx.status || "success"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </AppLayout>
  );
}

export default AdminTransactions;