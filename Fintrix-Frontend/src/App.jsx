import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LoanApplication from "./pages/LoanApplication";
import RiskResult from "./pages/RiskResult";
import AdminDashboard from "./pages/AdminDashboard";

import Transactions from "./pages/Transactions";
import Blockchain from "./pages/Blockchain";
import Profile from "./pages/Profile";

import AdminUsers from "./pages/AdminUsers";
import AdminTransactions from "./pages/AdminTransactions";
import AdminLoans from "./pages/AdminLoans";
import { LoanProvider } from "./state/LoanContext.jsx";
import ToastProvider from "./components/ToastProvider";

function getStoredAuth() {
  const token = localStorage.getItem("token");
  const rawUser = localStorage.getItem("user");

  if (!token) {
    return { authenticated: false, isAdmin: false };
  }

  try {
    const user = rawUser ? JSON.parse(rawUser) : null;
    return { authenticated: true, isAdmin: Boolean(user?.isAdmin) };
  } catch {
    return { authenticated: false, isAdmin: false };
  }
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { authenticated, isAdmin } = getStoredAuth();

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <LoanProvider>
          <Routes>

            {/* Authentication */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User Pages */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/loan" element={<ProtectedRoute><LoanApplication /></ProtectedRoute>} />
            <Route path="/risk" element={<ProtectedRoute><RiskResult /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/blockchain" element={<ProtectedRoute><Blockchain /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/loans" element={<ProtectedRoute adminOnly><AdminLoans /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/transactions" element={<ProtectedRoute adminOnly><AdminTransactions /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </LoanProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;