import React, { useState, useContext } from "react";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import AuthLayout from "./AuthLayout";
import OAuthButtons from "./OAuthButtons";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", college: "", degree: "", accountType: "student", expertise: "", experienceYears: 0, bio: "" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);
    try {
      const { accountType, expertise, experienceYears, bio, ...account } = form;
      const authResponse = await api.post("/auth/register", account);

      if (!authResponse.data.accessToken || !authResponse.data.user) throw new Error("Signup did not return an account session.");
      const loggedIn = await login(authResponse.data.accessToken, authResponse.data.user);
      if (!loggedIn) return;
      if (accountType === "mentor") {
        try {
          await api.post("/mentor/applications", {
            expertise: expertise.split(",").map((item) => item.trim()).filter(Boolean),
            experienceYears: Number(experienceYears), bio,
          });
        } catch (applicationError) {
          const status = applicationError.response?.status;
          if (status === 404 || status === 503 || !applicationError.response) {
            throw new Error("Your account is ready, but the mentor application service is not running. Start/restart the backend, then submit this form again with the same email and password; it will continue the application without creating another account.");
          }
          throw applicationError;
        }
        toast.success("Account created. Your mentor application is waiting for super admin review.");
        navigate("/mentorship");
      } else {
        toast.success("Student account created.");
        navigate("/");
      }
    } catch (error) {
      const responseMessage = error.response?.data?.error || error.response?.data?.message;
      const message = /user already exists/i.test(responseMessage || "")
        ? "User already exists. Please sign in instead."
        : responseMessage || error.message || "Signup failed";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (event) => {
    setErrorMessage("");
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };
  return (
    <AuthLayout variant="signup">
      <div className="cc-auth-form">
        <div className="cc-auth-form-header">
          <p className="cc-auth-eyebrow">JOIN THE COMMUNITY</p>
          <h2>Create your account</h2>
          <p>Learn new skills or apply to share your expertise as a mentor.</p>
        </div>

        <form onSubmit={submit}>
          {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
          <div className="mb-3">
            <label className="form-label" htmlFor="signup-account-type">I want to join as</label>
            <select id="signup-account-type" className="form-select" value={form.accountType} onChange={set("accountType")} disabled={loading}>
              <option value="student">Student</option>
              <option value="mentor">Apply as a mentor</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="signup-name">Full name</label>
            <input id="signup-name" className="form-control" value={form.name} onChange={set("name")} autoComplete="name" required maxLength="100" disabled={loading} />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="signup-email">Email address</label>
            <input id="signup-email" type="email" className="form-control" value={form.email} onChange={set("email")} autoComplete="email" required disabled={loading} />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input id="signup-password" type="password" className="form-control" value={form.password} onChange={set("password")} autoComplete="new-password" required minLength="8" disabled={loading} />
          </div>
          <div className="row">
            <div className="col-sm-6 mb-3">
              <label className="form-label" htmlFor="signup-college">College <span className="fw-normal text-secondary">(optional)</span></label>
              <input id="signup-college" className="form-control" value={form.college} onChange={set("college")} disabled={loading} />
            </div>
            <div className="col-sm-6 mb-3">
              <label className="form-label" htmlFor="signup-degree">Degree <span className="fw-normal text-secondary">(optional)</span></label>
              <input id="signup-degree" className="form-control" value={form.degree} onChange={set("degree")} disabled={loading} />
            </div>
          </div>
          {form.accountType === "mentor" && (
            <section className="cc-auth-mentor-section">
              <h3>Mentor application</h3>
              <p>Your account starts with student access. A super admin reviews your application before mentor features are enabled.</p>
              <div className="mb-3">
                <label className="form-label" htmlFor="signup-expertise">Topics or skills you can teach</label>
                <input id="signup-expertise" className="form-control" value={form.expertise} onChange={set("expertise")} placeholder="React, Python, interview preparation" required disabled={loading} />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="signup-experience">Years of relevant experience</label>
                <input id="signup-experience" type="number" min="0" max="60" className="form-control" value={form.experienceYears} onChange={set("experienceYears")} required disabled={loading} />
              </div>
              <div>
                <label className="form-label" htmlFor="signup-bio">Introduction and teaching experience</label>
                <textarea id="signup-bio" className="form-control" rows="4" minLength="30" maxLength="3000" value={form.bio} onChange={set("bio")} placeholder="Tell students and the review team about your experience and how you teach." required disabled={loading} />
              </div>
            </section>
          )}
          <button type="submit" className="btn cc-auth-submit w-100" disabled={loading}>
            {loading ? "Creating account…" : form.accountType === "mentor" ? "Create account and apply" : "Create student account"}
          </button>
        </form>

        <OAuthButtons actionText="Sign up" />

        <p className="cc-auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </AuthLayout>
  );
}
