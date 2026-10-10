import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

/**
 * PrivateRoute
 *
 * Props:
 *   adminOnly        – allow only admin / super_admin (legacy)
 *   roles            – string[] of allowed roles (any match grants access)
 *   requirePerm      – { module, action } — must have that permission
 */
export default function PrivateRoute({ children, adminOnly, roles, requirePerm }) {
  const { user, loading, hasRole, hasPermission } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{
        display: "grid",
        minHeight: "60vh",
        placeItems: "center",
        color: "var(--cc-muted)",
        fontSize: "var(--cc-text-sm)",
      }}>
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Legacy adminOnly prop
  if (adminOnly && !["admin", "super_admin"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Role-based guard
  if (roles && !hasRole(...roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Permission-based guard
  if (requirePerm && !hasPermission(requirePerm.module, requirePerm.action)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}