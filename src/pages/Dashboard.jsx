import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Dashboard() {
  const [loan, setLoan] = useState(null);

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          "http://localhost:5000/api/loan/my-loans",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (data.length > 0) {
          setLoan(data[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchLoans();
  }, []);

  if (!loan) {
    return (
      <div className="container mt-5">
        <h3>Loading Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">

        <div className="col-md-2 sidebar">

          <h3 className="mb-4">
            FintrixAI
          </h3>

          <Link to="/dashboard">
            Dashboard
          </Link>

          <Link to="/loan">
            Apply Loan
          </Link>

          <Link to="/transactions">
            Transactions
          </Link>

          <Link to="/blockchain">
            Blockchain
          </Link>

          <Link to="/profile">
            Profile
          </Link>

          <button
            className="btn btn-danger w-100 mt-4"
            onClick={logout}
          >
            Logout
          </button>
          
        </div>

        <div className="col-md-10 page-container">

          <div className="dashboard-header">
            <h2>Welcome Back 👋</h2>
            <p>
              AI-Powered Financial Risk &
              Blockchain Loan Management Platform
            </p>
          </div>

          <div className="row g-4 mb-4">

            <div className="col-md-3">
              <div className="stat-card">
                <h6>Loan Amount</h6>
                <h3>
                  ₹{Number(loan.amount).toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="col-md-3">
              <div className="stat-card">
                <h6>EMI</h6>
                <h3>
                  ₹{Number(loan.emi).toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="col-md-3">
              <div className="stat-card">
                <h6>Risk Score</h6>
                <h3>{loan.riskScore}%</h3>
              </div>
            </div>

            <div className="col-md-3">
              <div className="stat-card">
                <h6>Status</h6>

                <h3>
                  <span
                    className={
                      loan.status === "approved"
                        ? "success-badge"
                        : "warning-badge"
                    }
                  >
                    {loan.status.toUpperCase()}
                  </span>
                </h3>

              </div>
            </div>

          </div>

          <div className="row">

            <div className="col-md-4">

              <div className="card-soft p-4">

                <h5 className="mb-4">
                  AI Risk Meter
                </h5>

                <CircularProgressbar
                  value={loan.riskScore}
                  text={`${loan.riskScore}%`}
                  styles={{
                    path: {
                      stroke:
                        loan.riskLevel === "High"
                          ? "#dc3545"
                          : loan.riskLevel === "Medium"
                          ? "#ffc107"
                          : "#198754",
                    },
                  }}
                />

                <div className="text-center mt-4">

                  <h5
                    className={
                      loan.riskLevel === "High"
                        ? "high-risk"
                        : loan.riskLevel === "Medium"
                        ? "medium-risk"
                        : "low-risk"
                    }
                  >
                    {loan.riskLevel} Risk
                  </h5>

                </div>

              </div>

            </div>

            <div className="col-md-8">

              <div className="card-soft p-4">

                <h4 className="mb-4">
                  Loan Analytics
                </h4>

                <div className="row">

                  <div className="col-md-6 mb-4">
                    <strong>Purpose</strong>
                    <br />
                    {loan.purpose}
                  </div>

                  <div className="col-md-6 mb-4">
                    <strong>Duration</strong>
                    <br />
                    {loan.duration} Months
                  </div>

                  <div className="col-md-6 mb-4">
                    <strong>Interest Rate</strong>
                    <br />
                    {loan.interestRate}%
                  </div>

                  <div className="col-md-6 mb-4">
                    <strong>Total Amount</strong>
                    <br />
                    ₹{Number(loan.totalAmount).toLocaleString()}
                  </div>

                  <div className="col-md-6 mb-4">
                    <strong>Remaining Balance</strong>
                    <br />
                    ₹{Number(loan.remainingBalance).toLocaleString()}
                  </div>

                  <div className="col-md-6 mb-4">
                    <strong>Created On</strong>
                    <br />
                    {new Date(
                      loan.createdAt
                    ).toLocaleDateString()}
                  </div>

                </div>

              </div>

            </div>

          </div>

          <div className="row mt-4">

            <div className="col-md-6">

              <div className="blockchain-card">

                <h4>
                  Blockchain Verification
                </h4>

                <p className="mt-3">
                  Transaction Hash
                </p>

                <div className="hash-box">

                  {loan.blockchainHash
                    ? `${loan.blockchainHash.slice(
                        0,
                        15
                      )}...${loan.blockchainHash.slice(
                        -10
                      )}`
                    : "Pending"}

                </div>

                <div className="mt-3">

                  {loan.blockchainHash ? (
                    <span className="success-badge">
                      ✓ Verified On-Chain
                    </span>
                  ) : (
                    <span className="warning-badge">
                      ⏳ Blockchain Record Pending
                    </span>
                  )}

                </div>  

              </div>

            </div>

            <div className="col-md-6">

              <div className="card-soft p-4">

                <h4 className="mb-4">
                  Loan Timeline
                </h4>

                <div className="timeline-item">
                  Loan Submitted
                </div>

                <div className="timeline-item">
                  AI Risk Analysis Completed
                </div>

                <div className="timeline-item">
                  Loan Approved
                </div>

                <div className="timeline-item">
                  Blockchain Record Created
                </div>

              </div>

            </div>

          </div>

          <div className="card-soft p-4 mt-4">

            <h4 className="mb-3">
              AI Recommendation
            </h4>

            <div className="alert-risk">

              <strong>
                Risk Level:
              </strong>{" "}
              {loan.riskLevel}

              <br />

              {loan.riskLevel === "High"
                ? "Manual review recommended before loan disbursement."
                : loan.riskLevel === "Medium"
                ? "Additional verification suggested."
                : "Safe for automated approval."}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;