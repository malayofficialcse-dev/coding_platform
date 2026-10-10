import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import "./Unauthorized.css";

export default function Unauthorized() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const homeForRole = () => {
    if (!user) return "/login";
    const role = user.role;
    if (role === "super_admin" || role === "admin") return "/admin";
    if (["exam_coordinator", "course_coordinator", "feed_coordinator"].includes(role)) return "/coordinator";
    return "/";
  };

  return (
    <div className="unauth-wrap">
      <div className="unauth-card">
        <div className="unauth-icon">🔒</div>
        <h1 className="unauth-title">Access Denied</h1>
        <p className="unauth-desc">
          You don't have permission to access this page.
          {user && <> Your current role is <strong>{user.role?.replace(/_/g, " ")}</strong>.</>}
        </p>
        <div className="unauth-actions">
          <button className="unauth-btn unauth-btn-ghost" onClick={() => navigate(-1)}>← Go Back</button>
          <Link to={homeForRole()} className="unauth-btn unauth-btn-primary">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
