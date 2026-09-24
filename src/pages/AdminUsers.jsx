import { useEffect, useState } from "react";
import { FiUsers } from "react-icons/fi";

import AppLayout from "../components/AppLayout";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5001/api/admin/all-users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!cancelled) {
          setUsers(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <AppLayout sidebarVariant="admin" title="User Management" subtitle="Review registered FintrixAI users.">
        <LoadingState label="Loading users..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      sidebarVariant="admin"
      title="User Management"
      subtitle="Review all registered FintrixAI users and account roles."
    >
      <div className="stats-grid stats-grid--four">
        <StatCard label="Total Users" value={String(users.length)} icon={FiUsers} />
      </div>

      <SectionCard title="Registered Accounts" subtitle="Customer and admin membership overview">
        {users.length === 0 ? (
          <div className="empty-state-panel empty-state-panel--compact">
            <EmptyState
              title="No users found"
              description="Registered users will appear here once accounts are created."
              icon={<FiUsers />}
            />
          </div>
        ) : (
          <div className="table-card table-responsive">
            <table className="data-table">
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
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <StatusBadge status={user.isAdmin ? "approved" : "pending"} />
                    </td>
                    <td>{user._id?.slice(-8) || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </AppLayout>
  );
}

export default AdminUsers;