function StatusBadge({ status, className = "" }) {
  const normalized = String(status || "").trim().toLowerCase();

  const map = {
    paid: "status-badge status-badge--success",
    success: "status-badge status-badge--success",
    approved: "status-badge status-badge--success",
    recorded: "status-badge status-badge--success",
    low: "status-badge status-badge--success",
    verified: "status-badge status-badge--success",
    pending: "status-badge status-badge--warning",
    unknown: "status-badge status-badge--warning",
    medium: "status-badge status-badge--warning",
    failed: "status-badge status-badge--danger",
    rejected: "status-badge status-badge--danger",
    high: "status-badge status-badge--danger",
    default: "status-badge status-badge--neutral",
  };

  const label = status || "Unknown";

  return <span className={`${map[normalized] || map.default} ${className}`}>{label}</span>;
}

export default StatusBadge;
