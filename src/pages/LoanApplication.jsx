import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoanApplication() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [duration, setDuration] = useState("");

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/loan/apply",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: Number(amount),
            purpose,
            duration: Number(duration),
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      if (response.ok) {
        localStorage.setItem(
          "loanResult",
          JSON.stringify(data)
        );

        alert("Loan Application Submitted Successfully");
        navigate("/risk");
      } else {
        alert(data.message || "Application Failed");
      }
    } catch (error) {
      console.error(error);
      alert("Server Error");
    }
  };

  return (
    <div className="fintrix-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="form-card">
        <h2 className="text-center mb-4">
          Loan Application
        </h2>

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Loan Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Loan Purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Duration (Months)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
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