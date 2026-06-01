import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoanApplication() {

  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [duration, setDuration] = useState("");

  const [interestRate, setInterestRate] = useState("");
  const [grade, setGrade] = useState("");

  const [annualIncome, setAnnualIncome] = useState("");
  const [employmentLength, setEmploymentLength] = useState("");
  const [homeOwnership, setHomeOwnership] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [dti, setDti] = useState("");
  const [ficoScore, setFicoScore] = useState("");
  const [openAccounts, setOpenAccounts] = useState("");
  const [revolvingBalance, setRevolvingBalance] = useState("");
  const [revolvingUtilization, setRevolvingUtilization] = useState("");
  const [totalAccounts, setTotalAccounts] = useState("");

  const handleSubmit = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/loan/apply",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            amount: Number(amount),
            purpose,
            duration: Number(duration),

            interestRate: Number(interestRate),
            grade,

            annualIncome: Number(annualIncome),
            employmentLength,
            homeOwnership,
            verificationStatus,

            dti: Number(dti),
            ficoScore: Number(ficoScore),

            openAccounts: Number(openAccounts),
            revolvingBalance: Number(revolvingBalance),
            revolvingUtilization: Number(revolvingUtilization),
            totalAccounts: Number(totalAccounts)
          })
        }
      );

      const data = await response.json();

      console.log(data);

      if (response.ok) {

        localStorage.setItem(
          "loanResult",
          JSON.stringify(data)
        );

        alert(
          "Loan Application Submitted Successfully"
        );

        navigate("/risk");

      } else {

        alert(
          data.message || "Application Failed"
        );

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
          placeholder="Loan Term (Months)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Interest Rate"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
        />

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Grade (A-G)"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Employment Length"
          value={employmentLength}
          onChange={(e) => setEmploymentLength(e.target.value)}
        />

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Home Ownership"
          value={homeOwnership}
          onChange={(e) => setHomeOwnership(e.target.value)}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Annual Income"
          value={annualIncome}
          onChange={(e) => setAnnualIncome(e.target.value)}
        />

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Verification Status"
          value={verificationStatus}
          onChange={(e) => setVerificationStatus(e.target.value)}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Debt To Income Ratio (DTI)"
          value={dti}
          onChange={(e) => setDti(e.target.value)}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="FICO Score"
          value={ficoScore}
          onChange={(e) => setFicoScore(e.target.value)}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Open Accounts"
          value={openAccounts}
          onChange={(e) => setOpenAccounts(e.target.value)}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Revolving Balance"
          value={revolvingBalance}
          onChange={(e) => setRevolvingBalance(e.target.value)}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Revolving Utilization (%)"
          value={revolvingUtilization}
          onChange={(e) => setRevolvingUtilization(e.target.value)}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Total Accounts"
          value={totalAccounts}
          onChange={(e) => setTotalAccounts(e.target.value)}
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