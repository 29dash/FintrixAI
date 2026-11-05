import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../state/useToast";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      showToast("Name, email, and password are required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("http://localhost:5001/api/auth/register", {
        name,
        email,
        password,
      });

      showToast("Registration successful. You can now log in.", "success");
      navigate("/");
    } catch (err) {
      showToast(err.response?.data?.message || "Registration failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__brand">
          <div className="auth-card__mark">F</div>
          <h1 className="auth-card__title">Create Account</h1>
        </div>

        <p className="auth-card__subtitle">
          Register to access FintrixAI services and evaluate your loan profile.
        </p>

        <div className="auth-form">
          <label className="field">
            <span className="field__label">Full Name</span>
            <input
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Email</span>
            <input
              type="email"
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Phone Number</span>
            <input
              type="text"
              placeholder="+1 555 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button type="button" className="button button--primary button--wide" onClick={handleRegister} disabled={submitting}>
            {submitting ? "Creating account..." : "Register"}
          </button>
        </div>

        <p className="auth-card__footer">
          Already have an account? <span className="auth-card__link" onClick={() => navigate("/")}>Login</span>
        </p>
      </div>
    </div>
  );
}

export default Register;