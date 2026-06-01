import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminDashboard() {

  const [loans, setLoans] = useState([]);

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {

      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:5000/api/admin/all-loans",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setLoans(data);

    } catch (err) {
      console.error(err);
    }
  };

  const approveLoan = async (id) => {
    try {

      const token = localStorage.getItem("token");

      await fetch(
        `http://localhost:5000/api/loan/approve/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchLoans();

    } catch (err) {
      console.error(err);
    }
  };

  const rejectLoan = async (id) => {
    try {

      const token = localStorage.getItem("token");

      await fetch(
        `http://localhost:5000/api/loan/reject/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchLoans();

    } catch (err) {
      console.error(err);
    }
  };

  const highRiskLoans =
    loans.filter((loan) => loan.riskLevel === "High");

  const pendingLoans =
    loans.filter((loan) => loan.status === "pending");

  const approvedLoans =
    loans.filter((loan) => loan.status === "approved");

  return (
    <div className="container-fluid">

      <div className="row">

        <div className="col-md-2 sidebar">

          <h3 className="mb-4">
            Admin Panel
          </h3>

          <Link to="/admin">
            Dashboard
          </Link>

          <Link to="/admin/users">
            Users
          </Link>

          <Link to="/admin/transactions">
            Transactions
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
              AI Risk Monitoring & Loan Approval Center
            </h2>

            <p>
              Monitor AI-generated risk assessments
              and approve blockchain-backed loans.
            </p>
          </div>

          <div className="row g-4 mb-4">

            <div className="col-md-3">
              <div className="stat-card">
                <h6>Total Loans</h6>
                <h3>{loans.length}</h3>
              </div>
            </div>

            <div className="col-md-3">
              <div className="stat-card">
                <h6>High Risk Loans</h6>
                <h3 className="text-danger">
                  {highRiskLoans.length}
                </h3>
              </div>
            </div>

            <div className="col-md-3">
              <div className="stat-card">
                <h6>Pending Approval</h6>
                <h3 className="text-warning">
                  {pendingLoans.length}
                </h3>
              </div>
            </div>

            <div className="col-md-3">
              <div className="stat-card">
                <h6>Approved Loans</h6>
                <h3 className="text-success">
                  {approvedLoans.length}
                </h3>
              </div>
            </div>

          </div>

          <div className="card-soft p-4 mb-4">

            <h4 className="text-danger mb-4">
              🚨 High Risk Applications
            </h4>

            {highRiskLoans.length === 0 ? (

              <div className="text-success">
                No high-risk applications detected.
              </div>

            ) : (

              <table className="table">

                <thead>
                  <tr>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Risk Score</th>
                    <th>Risk Level</th>
                  </tr>
                </thead>

                <tbody>

                  {highRiskLoans.map((loan) => (

                    <tr key={loan._id}>

                      <td>
                        {loan.userId?.name}
                      </td>

                      <td>
                        ₹{Number(
                          loan.amount
                        ).toLocaleString()}
                      </td>

                      <td className="text-danger">
                        {loan.riskScore}%
                      </td>

                      <td>
                        {loan.riskLevel}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

          <div className="card-soft p-4">

            <h4 className="mb-4">
              All Loan Requests
            </h4>

            <table className="table">

              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Blockchain</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {loans.map((loan) => (

                  <tr key={loan._id}>

                    <td>
                      {loan.userId?.name}
                    </td>

                    <td>
                      ₹{Number(
                        loan.amount
                      ).toLocaleString()}
                    </td>

                    <td>

                      <span
                        className={
                          loan.riskLevel === "High"
                            ? "text-danger"
                            : loan.riskLevel === "Medium"
                            ? "text-warning"
                            : "text-success"
                        }
                      >
                        {loan.riskScore}%
                      </span>

                    </td>

                    <td>
                      {loan.status}
                    </td>

                    <td>

                      {loan.blockchainHash
                        ? "✅ Recorded"
                        : "⏳ Pending"}

                    </td>

                    <td>

                      {loan.status === "pending" && (

                        <>
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() =>
                              approveLoan(loan._id)
                            }
                          >
                            Approve
                          </button>

                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              rejectLoan(loan._id)
                            }
                          >
                            Reject
                          </button>
                        </>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;