import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminTransactions() {

  const [transactions, setTransactions] = useState([]);

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {

    try {

      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:5000/api/admin/all-transactions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setTransactions(data);

    } catch (error) {
      console.error(error);
    }
  };

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
              Transaction Monitoring
            </h2>

            <p>
              Monitor all user payments,
              blockchain transactions and
              financial activity.
            </p>

          </div>

          <div className="row mb-4">

            <div className="col-md-3">

              <div className="stat-card">

                <h6>Total Transactions</h6>

                <h3>
                  {transactions.length}
                </h3>

              </div>

            </div>

          </div>

          <div className="card-soft p-4">

            {transactions.length === 0 ? (

              <div className="text-center py-5">

                <h4>
                  No Transactions Found
                </h4>

                <p className="text-muted">
                  Completed payments will appear here.
                </p>

              </div>

            ) : (

              <table className="table">

                <thead>

                  <tr>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Loan</th>
                    <th>Hash</th>
                    <th>Date</th>
                  </tr>

                </thead>

                <tbody>

                  {transactions.map((tx) => (

                    <tr key={tx._id}>

                      <td>
                        {tx.userId?.name || "N/A"}
                      </td>

                      <td>
                        ₹{Number(
                          tx.amount
                        ).toLocaleString()}
                      </td>

                      <td>
                        {tx.loanId?._id?.slice(-8)}
                      </td>

                      <td>

                        {tx.transactionHash
                          ? `${tx.transactionHash.slice(
                              0,
                              10
                            )}...`
                          : "N/A"}

                      </td>

                      <td>
                        {new Date(
                          tx.createdAt
                        ).toLocaleDateString()}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminTransactions;