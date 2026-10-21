import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

export default function FollowButton({ userId, isFollowing: initialFollowing, onToggle, className = "" }) {
  const { user } = useContext(AuthContext);
  const currentUserId = user?._id || user?.id;
  const [following, setFollowing] = useState(Boolean(initialFollowing));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialFollowing !== undefined) {
      setFollowing(Boolean(initialFollowing));
    }
  }, [initialFollowing]);

  // Autonomously check if currently following this user if not passed explicitly
  useEffect(() => {
    if (initialFollowing !== undefined || !userId || !currentUserId) return;
    if (String(userId) === String(currentUserId)) return;

    let cancelled = false;
    api.get(`/social/trail/${userId}`)
      .then((res) => {
        if (!cancelled && res.data?.degree === "1st") {
          setFollowing(true);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [userId, currentUserId, initialFollowing]);

  const handleFollow = async () => {
    if (loading || !user || !userId || String(userId) === String(currentUserId)) return;
    setLoading(true);
    try {
      await api.post(`/users/follow/${userId}`);
      setFollowing(true);
      onToggle?.(true);
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (loading || !user || !userId || String(userId) === String(currentUserId)) return;
    setLoading(true);
    try {
      await api.post(`/users/unfollow/${userId}`);
      setFollowing(false);
      onToggle?.(false);
    } catch (err) {
      console.error("Unfollow error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userId || String(userId) === String(currentUserId)) return null;

  if (following) {
    return (
      <button
        type="button"
        className={`btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-2 px-3 py-1 fw-semibold rounded-pill ${className}`}
        onClick={handleUnfollow}
        disabled={loading}
      >
        <span>Following</span>
        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>(Unfollow)</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`btn btn-sm btn-primary d-inline-flex align-items-center gap-2 px-3 py-1 fw-semibold rounded-pill shadow-sm ${className}`}
      onClick={handleFollow}
      disabled={loading}
    >
      <span>Follow</span>
    </button>
  );
}
