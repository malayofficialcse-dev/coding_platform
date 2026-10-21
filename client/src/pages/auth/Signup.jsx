import React, { useState, useContext } from "react";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", college: "", degree: "", accountType: "student", expertise: "", experienceYears: 0, bio: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { accountType, expertise, experienceYears, bio, ...account } = form;
      let authResponse;
      try {
        authResponse = await api.post("/auth/register", account);
      } catch (registerError) {
        // A previous attempt may have created the account before the mentor service
        // was available. Let the same person continue only after their password is
        // verified by the normal login endpoint.
        const alreadyRegistered = registerError.response?.status === 400 &&
          /user already exists/i.test(registerError.response?.data?.message || "");
        if (!alreadyRegistered) throw registerError;
        authResponse = await api.post("/auth/login", { email: account.email, password: account.password });
      }

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
      toast.error(error.response?.data?.error || error.response?.data?.message || error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light py-4">
      <div className="col-md-7 col-lg-6 col-12">
        <div className="card shadow-lg border-0 rounded-4"><div className="card-body p-4 p-md-5">
          <h2 className="fw-bold text-center mb-2 text-primary">Create your Code Campus account</h2>
          <p className="text-center text-secondary mb-4">Students can learn. Mentor applicants can host sessions after approval.</p>
          <form onSubmit={submit}>
            <div className="mb-3"><label className="form-label fw-semibold">I want to join as</label>
              <select className="form-select form-select-lg" value={form.accountType} onChange={set("accountType")} disabled={loading}>
                <option value="student">Student</option><option value="mentor">Apply as a mentor</option>
              </select>
            </div>
            <div className="mb-3"><label className="form-label fw-semibold">Full name</label><input className="form-control form-control-lg" value={form.name} onChange={set("name")} required maxLength="100" disabled={loading} /></div>
            <div className="mb-3"><label className="form-label fw-semibold">Email</label><input type="email" className="form-control form-control-lg" value={form.email} onChange={set("email")} required disabled={loading} /></div>
            <div className="mb-3"><label className="form-label fw-semibold">Password</label><input type="password" className="form-control form-control-lg" value={form.password} onChange={set("password")} required minLength="8" disabled={loading} /></div>
            <div className="row"><div className="col-sm-6 mb-3"><label className="form-label fw-semibold">College (optional)</label><input className="form-control" value={form.college} onChange={set("college")} disabled={loading} /></div>
              <div className="col-sm-6 mb-3"><label className="form-label fw-semibold">Degree (optional)</label><input className="form-control" value={form.degree} onChange={set("degree")} disabled={loading} /></div></div>
            {form.accountType === "mentor" && <section className="p-3 rounded-3 border bg-light mb-3">
              <h3 className="h6 fw-bold">Mentor application</h3>
              <p className="small text-secondary">Your account starts with student access. A super admin reviews this information before mentor features are enabled.</p>
              <div className="mb-3"><label className="form-label fw-semibold">Topics or skills you can teach</label><input className="form-control" value={form.expertise} onChange={set("expertise")} placeholder="React, Python, interview preparation" required disabled={loading} /></div>
              <div className="mb-3"><label className="form-label fw-semibold">Years of relevant experience</label><input type="number" min="0" max="60" className="form-control" value={form.experienceYears} onChange={set("experienceYears")} required disabled={loading} /></div>
              <div><label className="form-label fw-semibold">Introduction and teaching experience</label><textarea className="form-control" rows="4" minLength="30" maxLength="3000" value={form.bio} onChange={set("bio")} placeholder="Tell students and the review team about your experience and how you teach." required disabled={loading} /></div>
            </section>}
            <button type="submit" className="btn btn-success btn-lg w-100 mt-2" disabled={loading}>{loading ? "Creating account…" : form.accountType === "mentor" ? "Create account and apply" : "Create student account"}</button>
          </form>
          <p className="text-center mt-3 mb-0">Already have an account? <Link to="/login">Login here</Link></p>
        </div></div>
      </div>
    </div>
  );
}
