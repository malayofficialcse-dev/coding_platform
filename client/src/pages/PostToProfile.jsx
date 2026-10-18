import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import PostCard from "../components/PostCard";
import FollowButton from "../components/FollowButton";
import ConnectionBadge from "../components/ConnectionBadge";
import ConnectionTrailModal from "../components/ConnectionTrailModal";
import MutualConnectionsModal from "../components/MutualConnectionsModal";
import { AuthContext } from "../contexts/AuthContext";
import { optimizedImageUrl } from "../utils/imageUrl";
import { FaRoute, FaUserFriends, FaNetworkWired, FaChartLine } from "react-icons/fa";
import "./PostToProfile.css";

const DEFAULT_AVATAR = "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png";

export default function PostToProfile() {
  const { id } = useParams(); // user id from URL
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Graph state
  const [trailData, setTrailData] = useState(null);
  const [networkStats, setNetworkStats] = useState(null);
  const [mutualData, setMutualData] = useState(null);
  const [showTrailModal, setShowTrailModal] = useState(false);
  const [showMutualModal, setShowMutualModal] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/posts/user/${id}`),
        ]);
        setProfile(profileRes.data);
        setPosts(postsRes.data);

        // Fetch Neo4j Graph Intelligence
        const currentUserId = currentUser?._id || currentUser?.id;
        if (currentUserId && String(currentUserId) !== String(id)) {
          Promise.allSettled([
            api.get(`/social/trail/${id}`),
            api.get(`/social/stats/${id}`),
            api.get(`/social/mutual/${id}`),
          ]).then(([trailRes, statsRes, mutualRes]) => {
            if (trailRes.status === "fulfilled") setTrailData(trailRes.value.data);
            if (statsRes.status === "fulfilled") setNetworkStats(statsRes.value.data);
            if (mutualRes.status === "fulfilled") setMutualData(mutualRes.value.data);
          });
        } else if (currentUserId && String(currentUserId) === String(id)) {
          api.get(`/social/stats/${id}`).then((res) => setNetworkStats(res.data)).catch(() => {});
        }

        const isOwnProfile = (currentUser?._id || currentUser?.id) === id;
        const canViewLearningData = isOwnProfile || currentUser?.role === "admin";
        if (!canViewLearningData) {
          setCourses([]);
          setExams([]);
          return;
        }

        const [enrollmentsRes, attemptsRes] = await Promise.all([
          api.get(isOwnProfile ? "/enrollments/my" : `/enrollments/user/${id}`),
          api.get(isOwnProfile ? "/attempts/my" : `/attempts/user/${id}`),
        ]);
        setCourses(enrollmentsRes.data.map((enrollment) => enrollment.course).filter(Boolean));
        setExams(attemptsRes.data.map((attempt) => attempt.exam).filter(Boolean));
      } catch (error) {
        console.error("Failed to load profile data:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id, currentUser]);

  const handleUpdatePost = (updatedPost) => {
    setPosts((prev) => prev.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
  };

  if (loading) return <div className="text-center py-5">Loading...</div>;
  if (!profile)
    return <div className="text-center py-5 text-danger">User not found</div>;

  const currentUserId = currentUser?._id || currentUser?.id;
  const isOwnProfile = currentUserId === (profile._id || profile.id);

  return (
    <div className="cc-public-profile-shell">
      <div className="cc-public-profile-card cc-public-profile-identity">
        <div className="cc-public-profile-cover" style={profile.bannerImage ? { backgroundImage: `url(${profile.bannerImage})` } : undefined} />
        <div className="cc-public-profile-identity-body">
          <img
            src={optimizedImageUrl(profile.profileImage || DEFAULT_AVATAR, 400)}
            alt="Profile"
            className="cc-public-profile-avatar"
          />
          <div className="cc-public-profile-details">
            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
              <h3 className="fw-bold mb-0">{profile.name || profile.username}</h3>
              {!isOwnProfile && trailData?.degree && (
                <ConnectionBadge
                  degree={trailData.degree}
                  size="md"
                  onClick={() => setShowTrailModal(true)}
                />
              )}
            </div>
            <span className="cc-public-profile-handle">@{profile.username}</span>

            {profile.college && (
              <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "2px" }}>
                🎓 {profile.college} {profile.degree ? `• ${profile.degree}` : ""}
              </div>
            )}

            {/* LinkedIn-style Relationship Path Banner */}
            {!isOwnProfile && trailData && trailData.trail && trailData.trail.length > 1 && (
              <div
                style={{
                  background: "#f1f5f9",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  marginTop: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.82rem",
                  color: "#334155",
                  border: "1px solid #e2e8f0",
                }}
              >
                <FaRoute color="#2563eb" />
                <span>
                  {trailData.degree === "1st"
                    ? "Direct 1st degree connection"
                    : `Connected via ${trailData.trail[1]?.name || "mutual network"} (${trailData.degree})`}
                </span>
                <button
                  onClick={() => setShowTrailModal(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  View path
                </button>
              </div>
            )}

            {/* Mutual Connections Preview */}
            {!isOwnProfile && mutualData && mutualData.count > 0 && (
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
                onClick={() => setShowMutualModal(true)}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  {mutualData.users.slice(0, 3).map((u, i) => (
                    <img
                      key={u.id || i}
                      src={u.profileImage || DEFAULT_AVATAR}
                      alt={u.name}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #fff",
                        marginLeft: i > 0 ? -6 : 0,
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 600 }}>
                  <FaUserFriends style={{ marginRight: 4, color: "#10b981" }} />
                  {mutualData.count} mutual connection{mutualData.count > 1 ? "s" : ""}
                  {mutualData.users[0] ? ` including ${mutualData.users[0].name || mutualData.users[0].username}` : ""}
                </span>
              </div>
            )}

            {/* Graph Network Stats Badge */}
            <div className="cc-public-profile-meta" style={{ marginTop: "12px" }}>
              <span className="cc-public-profile-role">{profile.role?.replace("_", " ")}</span>
              <span>
                Followers: <b>{networkStats?.followersCount ?? profile.followers?.length ?? 0}</b>
              </span>
              <span>
                Following: <b>{networkStats?.followingCount ?? profile.following?.length ?? 0}</b>
              </span>
              {networkStats && networkStats.secondDegreeReach > 0 && (
                <span title="Total people reachable through friends-of-friends">
                  <FaNetworkWired style={{ marginRight: 4, color: "#6366f1" }} />
                  2nd Degree Reach: <b>{networkStats.secondDegreeReach}</b>
                </span>
              )}
              {networkStats && networkStats.influenceScore > 0 && (
                <span title="Graph network centrality & influence rank">
                  <FaChartLine style={{ marginRight: 4, color: "#ec4899" }} />
                  Network Influence: <b>{networkStats.influenceScore}/100</b>
                </span>
              )}
            </div>

            {!isOwnProfile && (
              <div style={{ marginTop: "14px" }}>
                <FollowButton
                  userId={profile._id || profile.id}
                  isFollowing={
                    trailData?.degree === "1st" ||
                    (profile.followers || []).some((f) => String(f.id || f._id || f) === String(currentUserId))
                  }
                  onToggle={(nowFollowing) => {
                    setTrailData((prev) => prev ? { ...prev, degree: nowFollowing ? "1st" : "2nd" } : prev);
                    setNetworkStats((prev) => prev ? {
                      ...prev,
                      followersCount: Math.max(0, (prev.followersCount || 0) + (nowFollowing ? 1 : -1))
                    } : prev);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="cc-public-profile-section">
        <h4>Posts</h4>
        <div className="row g-4">
          {posts.length === 0 && (
            <div className="text-muted ms-2">No posts yet.</div>
          )}
          {posts.map((post) => (
            <div className="col-md-6 col-lg-4" key={post._id}>
              <PostCard
                post={post}
                user={currentUser}
                onUpdate={handleUpdatePost}
                onDelete={handleDeletePost}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Graph Modals */}
      <ConnectionTrailModal
        isOpen={showTrailModal}
        onClose={() => setShowTrailModal(false)}
        targetUser={profile}
        trail={trailData?.trail}
        degree={trailData?.degree}
        mutualCount={trailData?.mutualCount}
      />

      <MutualConnectionsModal
        isOpen={showMutualModal}
        onClose={() => setShowMutualModal(false)}
        targetUserName={profile.name || profile.username}
        mutualUsers={mutualData?.users || []}
      />
    </div>
  );
}
