function RiskResult() {
    return (
      <div className="fintrix-bg min-vh-100 d-flex align-items-center justify-content-center">
        <div className="form-card text-center">
          <h2 className="mb-4">AI Risk Analysis Complete</h2>
  
          <h1 className="text-warning mb-3">67%</h1>
  
          <h4 className="mb-3">Medium Risk</h4>
  
          <div className="alert-risk mb-4">
            High loan amount + moderate credit score detected
          </div>
  
          <button className="btn btn-primary w-100">
            Proceed with Application
          </button>
        </div>
      </div>
    );
  }
  
  export default RiskResult;