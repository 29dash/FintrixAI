import { useEffect, useState } from "react";

function Transactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:5000/api/payment/history",
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
          <h3 className="mb-4">FintrixAI</h3>

          <a href="/dashboard">Dashboard</a>
          <a href="/loan">Apply Loan</a>
          <a href="/transactions">Transactions</a>
          <a href="/blockchain">Blockchain</a>
          <a href="/profile">Profile</a>
        </div>

        <div className="col-md-10 page-container">

          <div className="dashboard-header">
            <h2>Transaction History</h2>
            <p>
              View all EMI payments and loan transactions
            </p>
          </div>

          <div className="card-soft p-4">

            {transactions.length === 0 ? (

              <div className="text-center py-5">
                <h5>No Transactions Found</h5>
                <p className="text-muted">
                  Your payment history will appear here.
                </p>
              </div>

            ) : (

              <table className="table">

                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Loan ID</th>
                    <th>Blockchain Hash</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {transactions.map((tx) => (

                    <tr key={tx._id}>

                      <td>
                        {new Date(
                          tx.createdAt
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        ₹{Number(tx.amount).toLocaleString()}
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
                        <span className="success-badge">
                          Success
                        </span>
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

export default Transactions;