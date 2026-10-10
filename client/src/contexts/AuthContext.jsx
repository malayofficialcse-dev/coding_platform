import React, { createContext, useEffect, useState } from "react";
import api from "../api/api";
import { initSocket, disconnectSocket } from "../socket";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem("token"));

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        if (localStorage.getItem("token") !== token) {
          return;
        }

        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));

        if (res.data?._id) {
          initSocket(res.data._id);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        // Only clear token if server responded with 401
        if (err.response?.status === 401) {
          if (localStorage.getItem("token") === token) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token, userObj) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userObj));
    setUser(userObj);
    if (userObj?._id) {
      initSocket(userObj._id);
    }
    return true;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    disconnectSocket();
  };

  // ── RBAC helpers ──────────────────────────────────────────────────────────
  const isSuperAdmin   = () => user?.role === "super_admin";
  const isAdmin        = () => ["admin", "super_admin"].includes(user?.role);
  const isCoordinator  = () => ["exam_coordinator", "course_coordinator", "feed_coordinator"].includes(user?.role);
  const isStudent      = () => user?.role === "student";
  const hasRole        = (...roles) => roles.includes(user?.role);

  /**
   * Check a module-level permission for the current user.
   * super_admin / admin always return true.
   */
  const hasPermission = (module, action = "view") => {
    if (!user) return false;
    if (isAdmin()) return true;
    return !!(user.permissions?.[module]?.[action]);
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, loading, logout, login,
      isSuperAdmin, isAdmin, isCoordinator, isStudent, hasRole, hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
