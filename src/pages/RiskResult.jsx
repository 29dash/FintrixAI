function RiskResult() {
  const result = JSON.parse(localStorage.getItem("loanResult"));

  const riskScore =
    result?.loan?.riskScore ||
    result?.risk_score ||
    0;

  const riskLevel =
    result?.loan?.riskLevel ||
    result?.risk_level ||
    "Unknown";

  const reason =
    result?.risk_assessment?.reason ||
    result?.reason ||
    "No explanation available";

  return (
    <div className="fintrix-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="form-card text-center">
        <h2 className="mb-4">AI Risk Analysis Complete</h2>

        <h1 className="text-warning mb-3">
          {riskScore}%
        </h1>

        <h4 className="mb-3">
          {riskLevel} Risk
        </h4>

        <div className="alert-risk mb-4">
          {reason}
        </div>

        <button className="btn btn-primary w-100">
          Proceed with Application
        </button>
      </div>
    </div>
  );
}

export default RiskResult;