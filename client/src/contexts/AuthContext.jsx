import React, { createContext, useEffect, useState } from "react";
import api from "../api/api";
import { initSocket, disconnectSocket } from "../socket";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await api.get("/auth/me");
        setUser(res.data);

        // Initialize socket with user ID
        if (res.data?._id) {
          initSocket(res.data._id);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token, userObj) => {
    localStorage.setItem("token", token);
    setUser(userObj);
    
    // Initialize socket with user ID
    if (userObj?._id) {
      initSocket(userObj._id);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
}

