function AdminDashboard() {
    return (
      <div className="container-fluid">
        <div className="row">
  
          <div className="col-md-2 sidebar">
            <h3 className="mb-4">Admin Panel</h3>
  
            <a href="/dashboard">User Dashboard</a>
            <a href="#">Risk Alerts</a>
            <a href="#">Transactions</a>
            <a href="#">Users</a>
            <a href="#">Reports</a>
          </div>
  
          <div className="col-md-10 page-container">
            <h2 className="mb-4">Admin Dashboard</h2>
  
            <div className="row g-4">
  
              <div className="col-md-3">
                <div className="stat-card">
                  <h5>Total Users</h5>
                  <h2>1,248</h2>
                </div>
              </div>
  
              <div className="col-md-3">
                <div className="stat-card">
                  <h5>Fraud Alerts</h5>
                  <h2 className="text-danger">18</h2>
                </div>
              </div>
  
              <div className="col-md-3">
                <div className="stat-card">
                  <h5>Active Loans</h5>
                  <h2>342</h2>
                </div>
              </div>
  
              <div className="col-md-3">
                <div className="stat-card">
                  <h5>Transactions</h5>
                  <h2>8,521</h2>
                </div>
              </div>
  
            </div>
  
            <div className="row mt-5">
  
              <div className="col-md-6">
                <div className="card-soft p-4">
                  <h4 className="mb-4">High Risk Users</h4>
  
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Risk</th>
                      </tr>
                    </thead>
  
                    <tbody>
                      <tr>
                        <td>Rahul Sharma</td>
                        <td className="text-danger">92%</td>
                      </tr>
  
                      <tr>
                        <td>Ankit Verma</td>
                        <td className="text-warning">74%</td>
                      </tr>
  
                      <tr>
                        <td>Priya Das</td>
                        <td className="text-danger">88%</td>
                      </tr>
                    </tbody>
                  </table>
  
                </div>
              </div>
  
              <div className="col-md-6">
                <div className="card-soft p-4">
                  <h4 className="mb-4">Recent Alerts</h4>
  
                  <div className="alert-risk mb-3">
                    Suspicious transaction detected
                  </div>
  
                  <div className="alert-risk mb-3">
                    Multiple failed login attempts
                  </div>
  
                  <div className="alert-risk">
                    High-value loan flagged for review
                  </div>
  
                </div>
              </div>
  
            </div>
  
          </div>
  
        </div>
      </div>
    );
  }
  
  export default AdminDashboard;