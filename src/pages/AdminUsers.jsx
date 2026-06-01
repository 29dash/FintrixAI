import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminUsers() {

  const [users, setUsers] = useState([]);

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {

    try {

      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:5000/api/admin/all-users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setUsers(data);

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
              User Management
            </h2>

            <p>
              View and manage all registered
              FintrixAI users.
            </p>

          </div>

          <div className="row mb-4">

            <div className="col-md-3">

              <div className="stat-card">

                <h6>Total Users</h6>

                <h3>
                  {users.length}
                </h3>

              </div>

            </div>

          </div>

          <div className="card-soft p-4">

            {users.length === 0 ? (

              <div className="text-center py-5">

                <h4>
                  No Users Found
                </h4>

                <p className="text-muted">
                  Registered users will appear here.
                </p>

              </div>

            ) : (

              <table className="table">

                <thead>

                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>User ID</th>
                  </tr>

                </thead>

                <tbody>

                  {users.map((user) => (

                    <tr key={user._id}>

                      <td>
                        {user.name}
                      </td>

                      <td>
                        {user.email}
                      </td>

                      <td>

                        {user.isAdmin ? (

                          <span className="success-badge">
                            Admin
                          </span>

                        ) : (

                          <span className="warning-badge">
                            Customer
                          </span>

                        )}

                      </td>

                      <td>
                        {user._id.slice(-8)}
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

export default AdminUsers;