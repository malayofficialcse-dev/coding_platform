import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/api";
import { toast } from "react-toastify";
import AuthLayout from "./AuthLayout";

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [statusMessage, setStatusMessage] = useState("Completing secure authentication...");

  useEffect(() => {
    let active = true;

    const completeOAuth = async () => {
      const error = params.get("error");
      if (error) {
        toast.error(decodeURIComponent(error) || "Social sign-in was cancelled or failed.");
        navigate("/login");
        return;
      }

      const token = params.get("token");
      if (!token) {
        toast.error("Authentication token was not returned.");
        navigate("/login");
        return;
      }

      // Immediately sanitize URL so the access token doesn't persist in browser history
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        // ignore
      }

      try {
        setStatusMessage("Fetching user profile...");
        // Fetch current authenticated user with the newly received token
        const res = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!active) return;

        const userData = res.data?.user || res.data;
        login(token, userData);
        toast.success(`Welcome back, ${userData.name || "Coder"}!`);

        // Navigate based on user role
        const role = userData?.role;
        if (role === "super_admin") {
          navigate("/admin/rbac");
        } else if (role === "admin") {
          navigate("/admin");
        } else if (["exam_coordinator", "course_coordinator", "feed_coordinator"].includes(role)) {
          navigate("/coordinator");
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error("[OAuth Callback Error]:", err);
        if (active) {
          toast.error("Could not complete social sign-in. Please try again.");
          navigate("/login");
        }
      }
    };

    completeOAuth();

    return () => {
      active = false;
    };
  }, [params, navigate, login]);

  return (
    <AuthLayout>
      <div className="cc-auth-form text-center py-5">
        <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h4 className="fw-bold mb-2">Connecting to Code Campus</h4>
        <p className="text-muted">{statusMessage}</p>
      </div>
    </AuthLayout>
  );
}
