import { useNavigate } from "react-router-dom";

function LoanApplication() {
  const navigate = useNavigate();

  const handleSubmit = () => {
    navigate("/risk");
  };

  return (
    <div className="fintrix-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="form-card">
        <h2 className="text-center mb-4">Loan Application</h2>

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Loan Amount"
        />

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Loan Purpose"
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Monthly Income"
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Credit Score"
        />

        <button
          className="btn btn-primary w-100"
          onClick={handleSubmit}
        >
          Analyze Risk
        </button>
      </div>
    </div>
  );
}

export default LoanApplication;