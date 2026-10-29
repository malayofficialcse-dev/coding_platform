import React, { useState, useContext } from "react";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import AuthLayout from "./AuthLayout";
import OAuthButtons from "./OAuthButtons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { login } = useContext(AuthContext);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (!email || !password) {
      const message = "Please fill in all fields";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.accessToken, res.data.user);
      toast.success("Login successful!");

      const role = res.data.user?.role;
      if (role === "super_admin") {
        nav("/admin/rbac");
      } else if (role === "admin") {
        nav("/admin");
      } else if (["exam_coordinator", "course_coordinator", "feed_coordinator"].includes(role)) {
        nav("/coordinator");
      } else {
        nav("/");
      }
    } catch (err) {
      const responseMessage = err.response?.data?.message || err.response?.data?.error;
      const message = /invalid credentials/i.test(responseMessage || "")
        ? "Incorrect email or password. Please try again."
        : responseMessage || "Login failed";
      setErrorMessage(message);
      toast.error(message);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="cc-auth-form">
        <div className="cc-auth-form-header">
          <p className="cc-auth-eyebrow">YOUR LEARNING SPACE</p>
          <h2>Welcome back</h2>
          <p>Sign in to continue learning, coding, and growing.</p>
        </div>

        <form onSubmit={submit}>
          {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
          <div className="mb-3">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage("");
              }}
              autoComplete="email"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage("");
              }}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn cc-auth-submit w-100" disabled={loading}>
            {loading ? "Logging in..." : "Sign in"}
          </button>
        </form>

        <OAuthButtons actionText="Sign in" />

        <p className="cc-auth-switch">
          Don&apos;t have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
