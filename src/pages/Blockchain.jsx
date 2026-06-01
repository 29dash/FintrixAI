import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Blockchain() {

  const [loan, setLoan] = useState(null);

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    fetchLoan();
  }, []);

  const fetchLoan = async () => {
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

    } catch (error) {
      console.error(error);
    }
  };

  if (!loan) {
    return (
      <div className="container mt-5">
        <h3>Loading Blockchain Records...</h3>
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

            <h2>
              Blockchain Verification Center
            </h2>

            <p>
              Immutable loan verification and
              audit trail powered by blockchain.
            </p>

          </div>

          <div className="row">

            <div className="col-md-6">

              <div className="blockchain-card">

                <h4>
                  Transaction Hash
                </h4>

                <div className="hash-box mt-3">

                  {loan.blockchainHash
                    ? loan.blockchainHash
                    : "Pending Approval"}

                </div>

                <div className="mt-4">

                  {loan.blockchainHash ? (

                    <span className="success-badge">
                      ✓ Verified On-Chain
                    </span>

                  ) : (

                    <span className="warning-badge">
                      ⏳ Awaiting Blockchain Recording
                    </span>

                  )}

                </div>

              </div>

            </div>

            <div className="col-md-6">

              <div className="card-soft p-4">

                <h4 className="mb-4">
                  Blockchain Details
                </h4>

                <div className="mb-3">
                  <strong>Loan Status</strong>
                  <br />
                  {loan.status}
                </div>

                <div className="mb-3">
                  <strong>Loan Amount</strong>
                  <br />
                  ₹{Number(
                    loan.amount
                  ).toLocaleString()}
                </div>

                <div className="mb-3">
                  <strong>Risk Level</strong>
                  <br />
                  {loan.riskLevel}
                </div>

                <div className="mb-3">
                  <strong>Interest Rate</strong>
                  <br />
                  {loan.interestRate}%
                </div>

                <div className="mb-3">
                  <strong>Duration</strong>
                  <br />
                  {loan.duration} Months
                </div>

                <div className="mb-3">
                  <strong>Recorded On</strong>
                  <br />
                  {new Date(
                    loan.createdAt
                  ).toLocaleString()}
                </div>

              </div>

            </div>

          </div>

          <div className="card-soft p-4 mt-4">

            <h4 className="mb-3">
              Blockchain Security Benefits
            </h4>

            <ul>
              <li>
                Tamper-proof loan records
              </li>

              <li>
                Immutable audit trail
              </li>

              <li>
                Transparent verification
              </li>

              <li>
                Decentralized record keeping
              </li>

              <li>
                Secure transaction history
              </li>
            </ul>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Blockchain;