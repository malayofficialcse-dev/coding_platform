import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

export default function FollowButton({ userId }) {
  const { user } = useContext(AuthContext);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (user && user.following) {
      setFollowing(user.following.includes(userId));
    }
  }, [user, userId]);

  const handleFollow = async () => {
    await api.post(`/users/${userId}/follow`);
    setFollowing(true);
  };
  const handleUnfollow = async () => {
    await api.post(`/users/${userId}/unfollow`);
    setFollowing(false);
  };

  if (following) {
    return (
      <button className="btn btn-sm btn-warning" onClick={handleUnfollow}>
        Unfollow
      </button>
    );
  }
  return (
    <button className="btn btn-sm btn-outline-warning" onClick={handleFollow}>
      Follow
    </button>
  );
}
