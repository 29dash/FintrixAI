import { useEffect, useState } from "react";

import AppLayout from "../components/AppLayout";
import LoadingState from "../components/LoadingState";

function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5001/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
      <AppLayout sidebarVariant="user">
        <LoadingState label="Loading profile..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      sidebarVariant="user"
      title="Profile"
      subtitle="Manage your account information and preferences."
    >
      <div className="profile-card">
        <div className="profile-card__header">
          <div className="profile-avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
          <span className="profile-role">{user.isAdmin ? "Administrator" : "Customer"}</span>
        </div>

        <div className="info-grid info-grid--profile">
          <div className="detail-item">
            <span className="kv-label">Full Name</span>
            <span className="kv-value kv-value--read-only">{user.name}</span>
          </div>

          <div className="detail-item">
            <span className="kv-label">Email Address</span>
            <span className="kv-value kv-value--read-only">{user.email}</span>
          </div>

          <div className="detail-item">
            <span className="kv-label">User ID</span>
            <span className="kv-value kv-value--read-only">{user._id}</span>
          </div>

          <div className="detail-item">
            <span className="kv-label">Account Type</span>
            <span className="kv-value kv-value--read-only">{user.isAdmin ? "Administrator" : "Customer"}</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default Profile;