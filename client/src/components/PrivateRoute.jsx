import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, adminOnly }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null; // Wait for auth check
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" />;
  return children;
}




// import React, { useContext } from "react";
// import { Navigate } from "react-router-dom";
// import { AuthContext } from "../contexts/AuthContext";

// export default function PrivateRoute({ children, adminOnly = false }) {
//   const { user, loading } = useContext(AuthContext);

//   // Show loading while checking auth
//   if (loading) {
//     return (
//       <div className="d-flex justify-content-center align-items-center min-vh-100">
//         <div className="spinner-border text-primary" role="status">
//           <span className="visually-hidden">Loading...</span>
//         </div>
//       </div>
//     );
//   }

//   // No user, redirect to login
//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   // Admin-only route but user is not admin
//   if (adminOnly && user.role !== "admin") {
//     return <Navigate to="/" replace />;
//   }

//   return children;
// }