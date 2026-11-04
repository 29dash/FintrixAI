import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function RiskScoreCard({ value, label, description }) {
  const score = Number.isFinite(Number(value)) ? Number(value) : 0;
  const safeValue = Math.max(0, Math.min(100, score));

  const tone =
    value === null || value === undefined || value === "" || Number.isNaN(Number(value))
      ? "neutral"
      : safeValue >= 80
      ? "danger"
      : safeValue >= 50
      ? "warning"
      : "success";

  const palette = {
    success: { path: "#16A34A", trail: "#E2E8F0", text: "#111827" },
    warning: { path: "#D97706", trail: "#E2E8F0", text: "#111827" },
    danger: { path: "#DC2626", trail: "#E2E8F0", text: "#111827" },
    neutral: { path: "#64748B", trail: "#E2E8F0", text: "#111827" },
  };

  const textValue = value === null || value === undefined || value === "" || Number.isNaN(Number(value))
    ? "—"
    : `${Math.round(safeValue)}%`;

  return (
    <div className="risk-score-card">
      <div className="risk-score-card__ring-wrap">
        <CircularProgressbar
          value={value === null || value === undefined || value === "" || Number.isNaN(Number(value)) ? 0 : safeValue}
          text={textValue}
          strokeWidth={10}
          styles={buildStyles({
            pathColor: palette[tone].path,
            trailColor: palette[tone].trail,
            textColor: palette[tone].text,
            textSize: "22px",
          })}
        />
      </div>

      <div className="risk-score-card__details">
        <div className="kv-label">Risk Score</div>
        <div className={`risk-score-card__score risk-score-card__score--${tone}`}>
          {value === null || value === undefined || value === "" || Number.isNaN(Number(value)) ? "Not yet calculated" : `${Math.round(safeValue)}%`}
        </div>
        <div className={`risk-score-card__label risk-score-card__label--${tone}`}>
          {value === null || value === undefined || value === "" || Number.isNaN(Number(value)) ? "Pending" : label || "Risk level"}
        </div>
        {description && <p className="risk-score-card__description">{description}</p>}
      </div>
    </div>
  );
}

export default RiskScoreCard;
