import { BrowserRouter, Routes, Route } from "react-router-dom";

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

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/loan" element={<LoanApplication />} />
        <Route path="/risk" element={<RiskResult />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/blockchain" element={<Blockchain />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} /> 
        <Route path="/admin/transactions" element={<AdminTransactions />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;