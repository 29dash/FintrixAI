import { FiArrowUpRight } from "react-icons/fi";

function StatCard({ label, value, hint, tone = "default", icon, className = "" }) {
  const Icon = icon;

  return (
    <div className={`stat-card ${className} stat-card--${tone}`}>
      <div className="stat-card__topline">
        <div className="stat-card__label">{label}</div>
        {Icon && (
          <div className="stat-card__icon-wrap">
            <Icon className="stat-card__icon" />
          </div>
        )}
      </div>

      <div className="stat-card__value">{value}</div>

      {hint && (
        <div className="stat-card__hint">
          <FiArrowUpRight />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
