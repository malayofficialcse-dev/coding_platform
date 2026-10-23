import React, { createContext, useContext, useEffect, useState } from "react";
import api, { refreshSession, resetRefreshSessionState } from "../api/api";
import { clearAccessToken, setAccessToken } from "../api/accessToken";
import { initSocket, disconnectSocket } from "../socket";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleRefresh = (event) => {
      if (!event.detail) return;
      setUser(event.detail);
      localStorage.setItem("user", JSON.stringify(event.detail));
    };
    window.addEventListener("code-campus:session-refreshed", handleRefresh);
    let active = true;
    const checkAuth = async () => {
      try {
        const { accessToken, user: userData } = await refreshSession();
        if (!active) return;
        setAccessToken(accessToken);
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        if (userData?._id) {
          initSocket(userData._id);
        }
      } catch {
        if (!active) return;
        clearAccessToken();
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    checkAuth();
    return () => {
      active = false;
      window.removeEventListener("code-campus:session-refreshed", handleRefresh);
    };
  }, []);

  const login = (accessToken, userObj) => {
    resetRefreshSessionState();
    setAccessToken(accessToken);
    localStorage.setItem("user", JSON.stringify(userObj));
    setUser(userObj);
    if (userObj?._id) {
      initSocket(userObj._id);
    }
    return true;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Could not revoke the server session:", error);
    }
    clearAccessToken();
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
