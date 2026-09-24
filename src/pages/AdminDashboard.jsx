import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";

import AppLayout from "../components/AppLayout";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { getAdminOverview } from "../api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const EMPTY_OVERVIEW = {
  metrics: {
    totalLoans: 0,
    totalDisbursed: 0,
    activeLoans: 0,
    pendingLoans: 0,
    rejectedLoans: 0,
    averageRiskScore: 0,
    totalUsers: 0,
  },
  volume: [],
  riskLevels: { low: 0, medium: 0, high: 0 },
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function AdminDashboard() {
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOverview = async () => {
    setLoading(true);
    setError("");

    try {
      setOverview(await getAdminOverview());
    } catch (requestError) {
      setError(requestError.message || "Unable to load the admin overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    getAdminOverview()
      .then((data) => {
        if (!cancelled) {
          setOverview(data);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "Unable to load the admin overview.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { metrics, volume, riskLevels } = overview;
  const hasData = metrics.totalLoans > 0 || metrics.totalUsers > 0;
  const chartData = {
    labels: volume.map((month) => month.label),
    datasets: [
      {
        label: "Loan applications",
        data: volume.map((month) => month.count),
        backgroundColor: "rgba(79, 70, 229, 0.72)",
        borderRadius: 6,
        maxBarThickness: 42,
      },
    ],
  };

  return (
    <AppLayout
      sidebarVariant="admin"
      title="Admin Overview"
      subtitle="Monitor portfolio health, risk signals, and lending activity across FintrixAI."
    >
      {loading ? (
        <LoadingState label="Loading portfolio overview..." />
      ) : error ? (
        <SectionCard title="Overview unavailable" subtitle={error}>
          <button type="button" className="button button--secondary" onClick={fetchOverview}>
            <FiRefreshCw />
            Retry
          </button>
        </SectionCard>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="Total Loans Issued" value={metrics.totalLoans} icon={FiActivity} />
            <StatCard label="Value Disbursed" value={currency.format(metrics.totalDisbursed)} icon={FiDollarSign} />
            <StatCard label="Active Loans" value={metrics.activeLoans} tone="success" icon={FiCheckCircle} />
            <StatCard label="Pending Loans" value={metrics.pendingLoans} tone="warning" icon={FiClock} />
            <StatCard label="Rejected Loans" value={metrics.rejectedLoans} tone="danger" icon={FiAlertTriangle} />
            <StatCard label="Average Risk Score" value={`${metrics.averageRiskScore}%`} icon={FiActivity} />
            <StatCard label="Registered Users" value={metrics.totalUsers} icon={FiUsers} />
          </div>

          {!hasData && (
            <SectionCard title="No portfolio data yet" subtitle="Loan and user activity will appear here once records are created." />
          )}

          <div className="content-grid content-grid--two">
            <SectionCard title="Loan volume" subtitle="Applications created over the last six months">
              <div className="admin-chart" role="img" aria-label="Loan application volume over the last six months">
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { precision: 0 } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </SectionCard>

            <SectionCard title="Risk distribution" subtitle="Current loan portfolio by AI risk level">
              <div className="risk-breakdown">
                <div className="risk-breakdown__row">
                  <span><StatusBadge status="Low" /></span>
                  <strong>{riskLevels.low}</strong>
                </div>
                <div className="risk-breakdown__row">
                  <span><StatusBadge status="Medium" /></span>
                  <strong>{riskLevels.medium}</strong>
                </div>
                <div className="risk-breakdown__row">
                  <span><StatusBadge status="High" /></span>
                  <strong>{riskLevels.high}</strong>
                </div>
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </AppLayout>
  );
}

export default AdminDashboard;