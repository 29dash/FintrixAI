import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LoanApplication from "./pages/LoanApplication";
import RiskResult from "./pages/RiskResult";
import AdminDashboard from "./pages/AdminDashboard";

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

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;