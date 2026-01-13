import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const USERS = {
  admin: { email: "admin@puremedical.com", password: "admin123", role: "ADMIN" },
  marketing: { email: "marketing@puremedical.com", password: "marketing123", role: "MARKETING" },
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const user = Object.values(USERS).find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      setError("Invalid credentials");
      return;
    }

    navigate(user.role === "ADMIN" ? "/admin" : "/dashboard");
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Login</h2>

        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />

        {error && <p className="error">{error}</p>}

        <button onClick={handleLogin}>→</button>
      </div>
    </div>
  );
}
