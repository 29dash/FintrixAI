import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name,
          email,
          password,
        }
      );

      alert("Registration successful!");

      navigate("/");
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Registration failed"
      );
    }
  };

  return (
    <div className="fintrix-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="form-card">
        <div className="text-center mb-5">
          <h1 className="fw-bold text-dark">
            Create Account
          </h1>

          <p className="text-muted mt-3">
            Register to access FintrixAI services
          </p>
        </div>

        <input
          type="text"
          className="form-control form-control-lg mb-3"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          className="form-control form-control-lg mb-3"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="text"
          className="form-control form-control-lg mb-3"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          type="password"
          className="form-control form-control-lg mb-4"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="btn btn-primary btn-lg w-100"
          onClick={handleRegister}
        >
          Register
        </button>

        <p className="text-center mt-4 text-muted">
          Already have an account?{" "}
          <span
            style={{
              color: "#4f46e5",
              cursor: "pointer",
              fontWeight: "600",
            }}
            onClick={() => navigate("/")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;