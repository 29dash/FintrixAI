import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/dashboard");
  };

  return (
    <div className="fintrix-bg min-vh-100 d-flex align-items-center justify-content-center">
      
      <div className="form-card">

        <div className="text-center mb-5">
          <h1 className="fw-bold text-dark">
            FintrixAI
          </h1>

          <p className="text-muted mt-3">
            AI-Blockchain Financial Risk & Loan Management System
          </p>
        </div>

        <input
          type="email"
          className="form-control form-control-lg mb-4"
          placeholder="Email Address"
        />

        <input
          type="password"
          className="form-control form-control-lg mb-4"
          placeholder="Password"
        />

        <button
          className="btn btn-primary btn-lg w-100"
          onClick={handleLogin}
        >
          Login
        </button>

        <p className="text-center mt-4 text-muted">
          Don’t have an account?{" "}
          
          <span
            style={{ color: "#4f46e5", cursor: "pointer", fontWeight: "600" }}
            onClick={() => navigate("/register")}
          >
            Sign Up
          </span>

        </p>

      </div>

    </div>
  );
}

export default Login;