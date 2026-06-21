import React, { useState, useContext } from "react";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    degree: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", form);

      if (res.data.token && res.data.user) {
        const success = await login(res.data.token, res.data.user);
        if (success) {
          toast.success("Signup successful!");
          setTimeout(() => {
            navigate("/");
          }, 500);
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Signup failed";
      toast.error(errorMsg);
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="col-md-6 col-12">
        <div className="card shadow-lg border-0 rounded-4">
          <div className="card-body p-4">
            <h2 className="fw-bold text-center mb-4 text-primary">Signup</h2>
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Full Name</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control form-control-lg"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Password</label>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  disabled={loading}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  College (Optional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Your college name"
                  value={form.college}
                  onChange={(e) =>
                    setForm({ ...form, college: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Degree (Optional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Your degree"
                  value={form.degree}
                  onChange={(e) =>
                    setForm({ ...form, degree: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              {/* <div className="mb-3">
                <label className="form-label fw-semibold">Role</label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${
                      form.role === "student"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setForm({ ...form, role: "student" })}
                    disabled={loading}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      form.role === "admin"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setForm({ ...form, role: "admin" })}
                    disabled={loading}
                  >
                    Admin
                  </button>
                </div>
              </div> */}
              <button
                type="submit"
                className="btn btn-success btn-lg w-100 mt-2"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Signup"}
              </button>
            </form>
            <p className="text-center mt-3">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}