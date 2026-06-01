import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Profile() {

  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {

    const fetchProfile = async () => {

      try {

        const token = localStorage.getItem("token");

        const res = await fetch(
          "http://localhost:5000/api/auth/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        setUser(data);

      } catch (error) {
        console.error(error);
      }

    };

    fetchProfile();

  }, []);

  if (!user) {
    return (
      <div className="container mt-5">
        <h3>Loading Profile...</h3>
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
              User Profile
            </h2>

            <p>
              Manage your FintrixAI account
              information and preferences.
            </p>

          </div>

          <div className="card-soft p-5">

            <div className="text-center mb-5">

              <div className="profile-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>

              <h3 className="profile-title">
                {user.name}
              </h3>

              <p className="profile-subtitle">
                {user.email}
              </p>

            </div>

            <div className="row">

              <div className="col-md-6 mb-4">

                <div className="profile-section-title">
                  Full Name
                </div>

                <div className="profile-box">
                  {user.name}
                </div>

              </div>

              <div className="col-md-6 mb-4">

                <div className="profile-section-title">
                  Email Address
                </div>

                <div className="profile-box">
                  {user.email}
                </div>

              </div>

              <div className="col-md-6 mb-4">

                <div className="profile-section-title">
                  User ID
                </div>

                <div className="profile-box">
                  {user._id}
                </div>

              </div>

              <div className="col-md-6 mb-4">

                <div className="profile-section-title">
                  Account Type
                </div>

                <div className="profile-box">
                  {user.isAdmin
                    ? "Administrator"
                    : "Customer"}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Profile;