import { NavLink, useNavigate } from "react-router-dom";
import {
  FiLayout,
  FiFilePlus,
  FiFileText,
  FiShield,
  FiUser,
  FiLogOut,
  FiUsers,
  FiBarChart2,
} from "react-icons/fi";

const userItems = [
  { to: "/dashboard", label: "Dashboard", icon: FiLayout },
  { to: "/loan", label: "Apply Loan", icon: FiFilePlus },
  { to: "/transactions", label: "Transactions", icon: FiFileText },
  { to: "/blockchain", label: "Blockchain", icon: FiShield },
  { to: "/profile", label: "Profile", icon: FiUser },
];

const adminItems = [
  { to: "/admin", label: "Dashboard", icon: FiBarChart2 },
  { to: "/admin/loans", label: "Loans", icon: FiFilePlus },
  { to: "/admin/users", label: "Users", icon: FiUsers },
  { to: "/admin/transactions", label: "Transactions", icon: FiFileText },
];

function Sidebar({ variant = "user" }) {
  const navigate = useNavigate();
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const items = variant === "admin"
    ? adminItems
    : storedUser?.isAdmin
      ? [...userItems, { to: "/admin", label: "Admin", icon: FiBarChart2 }]
      : userItems;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("fintrix-auth-changed"));
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="brand-mark">F</div>
        <div>
          <div className="brand-name">FintrixAI</div>
          <div className="brand-subtitle">{variant === "admin" ? "Admin Console" : "Financial Risk"}</div>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Sidebar navigation">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__item ${isActive ? "sidebar__item--active" : ""}`
            }
            end={to === "/dashboard" || to === "/admin"}
          >
            <Icon className="sidebar__icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="sidebar__logout" onClick={handleLogout}>
        <FiLogOut className="sidebar__icon" />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;
