import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../state/useToast";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast("Enter your email and password to continue.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post("http://localhost:5001/api/auth/login", {
        email,
        password,
      });

      const user = res.data.user || { isAdmin: false };
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("fintrix-auth-changed"));
      showToast("Login successful.", "success");
      navigate(user.isAdmin ? "/admin" : "/dashboard");
    } catch (err) {
      showToast(err.response?.data?.message || "Login failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__brand">
          <div className="auth-card__mark">F</div>
          <h1 className="auth-card__title">FintrixAI</h1>
        </div>

        <p className="auth-card__subtitle">
          AI-powered financial risk and blockchain loan management platform.
        </p>

        <div className="auth-form">
          <label className="field">
            <span className="field__label">Email</span>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button type="button" className="button button--primary button--wide" onClick={handleLogin} disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
        </div>

        <p className="auth-card__footer">
          Don’t have an account? <span className="auth-card__link" onClick={() => navigate("/register")}>Sign up</span>
        </p>
      </div>
    </div>
  );
}

export default Login;