import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Dashboard() {
  return (
    <div className="container-fluid">
      <div className="row">

        <div className="col-md-2 sidebar">
          <h3 className="mb-4">FintrixAI</h3>

          <a href="/dashboard">Dashboard</a>
          <a href="/loan">Apply Loan</a>
          <a href="#">Transactions</a>
          <a href="#">Blockchain</a>
          <a href="#">Profile</a>

        </div>

        <div className="col-md-10 page-container">
          <h2 className="mb-4">User Dashboard</h2>

          <div className="row g-4">
            <div className="col-md-3">
              <div className="stat-card">
                <h5>Loan Status</h5>
                <h3>Approved</h3>
              </div>
            </div>

            <div className="col-md-3">
              <div className="stat-card">
                <h5>EMI Due</h5>
                <h3>₹8,500</h3>
              </div>
            </div>

            <div className="col-md-3">
              <div className="stat-card">
                <h5>Risk Score</h5>
                <h3>42</h3>
              </div>
            </div>

            <div className="col-md-3">
              <div className="stat-card">
                <h5>Credit Health</h5>
                <h3>Good</h3>
              </div>
            </div>
          </div>

          <div className="row mt-5">
            <div className="col-md-4">
              <div className="card-soft p-4">
                <h5 className="mb-3">Risk Meter</h5>
                <CircularProgressbar value={42} text={"42%"} />
              </div>
            </div>

            <div className="col-md-8">
              <div className="card-soft p-4">
                <h5>Recent Transactions</h5>

                <table className="table mt-3">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>12 May</td>
                      <td>₹12,000</td>
                      <td>Success</td>
                    </tr>

                    <tr>
                      <td>10 May</td>
                      <td>₹55,000</td>
                      <td className="text-danger">Flagged</td>
                    </tr>

                    <tr>
                      <td>8 May</td>
                      <td>₹6,500</td>
                      <td>Success</td>
                    </tr>
                  </tbody>
                </table>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;