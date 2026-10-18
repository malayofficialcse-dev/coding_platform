import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import PostCard from "../components/PostCard";
import PostFormModal from "../components/PostFormModal";
import ConnectionBadge from "../components/ConnectionBadge";
import UsersLogo from "../assets/users-solid-full.svg";
import UserPlus from "../assets/user-plus-regular-full.svg";
import UserMinus from "../assets/user-minus-solid-full.svg";
import { FaAlignLeft, FaCode, FaImage, FaUserFriends, FaCompass, FaMagic } from "react-icons/fa";
import { formatDateTime } from "../utils/formatDateTime";

/* ─────────────────────────────────────────────────────────────────────
   GLOBAL PALETTE  (4 colours, used everywhere)
   • Primary   #4f46e5  indigo-600   → brand, buttons, accent
   • Secondary #0ea5e9  sky-500      → links, badges, tags
   • Surface   #f8faff               → page background, subtle fills
   • Ink       #0f172a  slate-900    → headings, text
───────────────────────────────────────────────────────────────────────*/
const C = {
  primary: "var(--cc-primary, #0078d4)",
  secondary: "var(--cc-secondary, #50e6ff)",
  surface: "var(--cc-background, #f3f6f8)",
  ink: "var(--cc-text, #1b1b1b)",

  // derived tints
  primaryLight: "var(--cc-primary-soft, #e6f2fb)",
  primaryMid: "var(--cc-primary-dark, #b7d9f2)",
  secondaryLight: "#e8f6f8",
  inkMuted: "var(--cc-muted, #5f6b7a)",
  inkSoft: "var(--cc-text-soft, #7a8694)",
  white: "var(--cc-surface, #ffffff)",
  surfaceMuted: "var(--cc-surface-muted, #f5f7fa)",
  border: "var(--cc-border, #d6dbe1)",
};

/* shared card style */
const card = {
  background: C.white,
  borderRadius: "4px",
  border: `1px solid ${C.border}`,
  boxShadow: "0 2px 8px rgba(27, 45, 66, 0.10)",
};

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [sidebarTab, setSidebarTab] = useState("recommended");
  const [showPostModal, setShowPostModal] = useState(false);
  const [search, setSearch] = useState("");
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const { user } = useContext(AuthContext);
  const activeGroup = "General Feed";

  useEffect(() => {
    api.get("/users").then((res) => setUsers(res.data)).catch(() => {});
    api.get("/social/recommendations").then((res) => setRecommendations(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingPosts(true);
    api.get("/posts", { params: { group: activeGroup, page: 1, limit: 20 } })
      .then((res) => {
        if (cancelled) return;
        setPosts(res.data || []);
        setPostsPage(1);
        setHasMorePosts(res.headers["x-has-more"] === "true");
      })
      .finally(() => { if (!cancelled) setLoadingPosts(false); });
    return () => { cancelled = true; };
  }, [activeGroup]);

  const handleNewPost = () => {
    api.get("/posts", { params: { group: activeGroup, page: 1, limit: 20 } }).then((r) => {
      setPosts(r.data || []);
      setPostsPage(1);
      setHasMorePosts(r.headers["x-has-more"] === "true");
    });
    setShowPostModal(false);
  };

  const loadMorePosts = async () => {
    const nextPage = postsPage + 1;
    setLoadingPosts(true);
    try {
      const res = await api.get("/posts", { params: { group: activeGroup, page: nextPage, limit: 20 } });
      setPosts((current) => [...current, ...(res.data || [])]);
      setPostsPage(nextPage);
      setHasMorePosts(res.headers["x-has-more"] === "true");
    } finally {
      setLoadingPosts(false);
    }
  };
  const handleUpdatePost = (up) => setPosts((prev) => prev.map((p) => (p._id === up._id ? up : p)));
  const handleDeletePost = (postId) => setPosts((prev) => prev.filter((p) => p._id !== postId));

  const currentUserId = user?._id || user?.id;

  const handleFollow = async (id) => {
    try {
      await api.post(`/users/follow/${id}`);
      setUsers((prev) =>
        prev.map((u) => {
          const uid = u._id || u.id;
          return String(uid) === String(id)
            ? { ...u, followers: [...(u.followers || []), currentUserId], isFollowing: true }
            : u;
        })
      );
      setRecommendations((prev) =>
        prev.map((u) => {
          const uid = u._id || u.id;
          return String(uid) === String(id)
            ? { ...u, followers: [...(u.followers || []), currentUserId], isFollowing: true }
            : u;
        })
      );
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const handleUnfollow = async (id) => {
    try {
      await api.post(`/users/unfollow/${id}`);
      setUsers((prev) =>
        prev.map((u) => {
          const uid = u._id || u.id;
          return String(uid) === String(id)
            ? { ...u, followers: (u.followers || []).filter((f) => String(f) !== String(currentUserId)), isFollowing: false }
            : u;
        })
      );
      setRecommendations((prev) =>
        prev.map((u) => {
          const uid = u._id || u.id;
          return String(uid) === String(id)
            ? { ...u, followers: (u.followers || []).filter((f) => String(f) !== String(currentUserId)), isFollowing: false }
            : u;
        })
      );
    } catch (err) {
      console.error("Unfollow error:", err);
    }
  };

  const filteredUsers = users.filter(
    (u) => {
      const uId = u._id || u.id;
      const isSelf = uId === currentUserId || (user?.email && u.email?.toLowerCase() === user.email.toLowerCase());
      return !isSelf && (u.name || u.username || "").toLowerCase().includes(search.trim().toLowerCase());
    }
  );

  const renderPost = (post) => {
    const originalPost = post.repostedPost || (
      post.repostedFrom && typeof post.repostedFrom === "object"
        ? post.repostedFrom
        : null
    );

    if (originalPost) {
      return (
        <div style={{
          ...card,
          marginBottom: 0,
          overflow: "hidden",
          borderLeft: `3px solid ${C.primary}`,
        }}>
          <div style={{ padding: "16px 16px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <img
                src={post.author?.profileImage || DEFAULT_AVA}
                alt="Profile"
                style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.primaryMid}` }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: C.ink, fontSize: "0.9rem" }}>{post.author?.name || post.author?.username}</span>
                  <span style={{ color: C.inkMuted, fontSize: "0.78rem" }}>reposted</span>
                </div>
                <div style={{ color: C.inkSoft, fontSize: "0.74rem" }}>
                  <span>Shared with the community</span>
                  <time
                    className="d-block"
                    dateTime={post.createdAt || undefined}
                  >
                    {formatDateTime(post.createdAt)}
                  </time>
                </div>
              </div>
            </div>
            <div style={{
              border: `1px solid ${C.border}`,
              borderRadius: "4px",
              background: C.white,
              overflow: "hidden",
            }}>
              <PostCard
                post={originalPost}
                user={user}
                onUpdate={handleUpdatePost}
                onDelete={handleDeletePost}
                embedded
              />
            </div>
          </div>
        </div>
      );
    }
    return (
      <PostCard
        post={post}
        user={user}
        onUpdate={handleUpdatePost}
        onDelete={handleDeletePost}
        fullWidth={post.codeBlocks?.length > 0 && post.codeBlocks.some((cb) => cb.code?.length > 200)}
      />
    );
  };

  const DEFAULT_AVA = "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png";

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: "'Segoe UI', Inter, Arial, sans-serif", color: C.ink }}>

      {/* scrollbar style */}
      <style>{`
        .cc-scroll::-webkit-scrollbar { width: 5px; }
        .cc-scroll::-webkit-scrollbar-thumb { background: ${C.primaryMid}; border-radius: 99px; }
        .cc-composer-btn:hover { background: ${C.primaryLight} !important; color: ${C.primary} !important; }
        .cc-people-row:hover { background: ${C.surface} !important; }
        @media (max-width: 1100px) {
          .cc-right-aside { display: none !important; }
          .cc-grid { grid-template-columns: 24% 1fr !important; }
        }
        @media (max-width: 768px) {
          .cc-left-aside { display: none !important; }
          .cc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 1800, margin: "0 auto", padding: "1.5rem 1.25rem" }}>
        <div className="cc-grid" style={{ display: "grid", gridTemplateColumns: "minmax(260px, 20%) minmax(0, 1fr) minmax(260px, 20%)", gap: "1.25rem", alignItems: "start" }}>

          {/* ══════════════════════════ LEFT SIDEBAR ══════════════════════════ */}
          <aside className="cc-left-aside" style={{ position: "sticky", top: 90 }}>
            {/* Profile card */}
            <div style={{ ...card, overflow: "hidden", marginBottom: "1rem" }}>
              {/* Cover gradient */}
              <div style={{
                height: 110,
                background: user?.bannerImage
                  ? `url(${user.bannerImage}) center / cover no-repeat`
                  : `linear-gradient(110deg, ${C.primary} 0%, #50e6ff 100%)`,
              }} />
              <div style={{ padding: "0 1.25rem 1.25rem", textAlign: "center" }}>
                <img
                  src={user?.profileImage || DEFAULT_AVA}
                  alt="profile"
                  style={{
                    width: 80, height: 80, borderRadius: "50%", objectFit: "cover",
                    border: `3px solid ${C.white}`, marginTop: -40,
                    boxShadow: "0 4px 16px rgba(79,70,229,0.2)",
                  }}
                />
                <div style={{ fontWeight: 800, color: C.ink, fontSize: "1rem", marginTop: 8 }}>
                  {user?.name || user?.username}
                </div>
                <div style={{ color: C.inkMuted, fontSize: "0.8rem" }}>@{user?.username}</div>
                <div style={{ color: C.inkSoft, fontSize: "0.75rem", marginTop: 2 }}>{user?.email}</div>

                <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "12px 0" }}>
                  <span style={{
                    background: C.primaryLight, color: C.primary,
                    borderRadius: "4px", padding: "4px 12px", fontSize: "0.75rem", fontWeight: 700,
                  }}>{user?.role || "User"}</span>
                  <span style={{
                    background: C.secondaryLight, color: C.secondary,
                    borderRadius: "4px", padding: "4px 12px", fontSize: "0.75rem", fontWeight: 700,
                  }}>{(user?.followers || []).length} Followers</span>
                </div>

                <a
                  href={`/profile/${user?._id}`}
                  style={{
                    display: "block", width: "100%",
                    background: C.primary,
                    color: C.white, borderRadius: "4px", padding: "0.55rem 0",
                    fontWeight: 700, fontSize: "0.85rem", textDecoration: "none",
                    boxShadow: "0 3px 8px rgba(0,120,212,0.22)",
                    transition: "opacity 0.2s",
                  }}
                >
                  View Profile
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div style={{ ...card, padding: "1rem 1.25rem" }}>
              <div style={{ fontWeight: 700, color: C.ink, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.65rem" }}>
                Quick Links
              </div>
              {[
                { emoji: "📚", label: "Courses", href: "/courses" },
                { emoji: "📝", label: "Exams", href: "/exams" },
                { emoji: "💻", label: "Coding Problems", href: "/code" },
                { emoji: "👤", label: "My Profile", href: `/profile/${user?._id}` },
              ].map(({ label, href }) => (
                <a key={label} href={href} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "0.55rem 0.6rem", borderRadius: "4px",
                  textDecoration: "none", color: C.inkMuted, fontSize: "0.875rem", fontWeight: 500,
                  transition: "all 0.15s",
                  marginBottom: 2,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.primaryLight; e.currentTarget.style.color = C.primary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.inkMuted; }}
                >
                  {/* <span>{emoji}</span> */}
                  <span>{label}</span>
                </a>
              ))}
            </div>

          </aside>

          {/* ══════════════════════════ CENTER FEED ═══════════════════════════ */}
          <main style={{ minWidth: 0 }}>
            {/* Composer bar */}
            <div style={{ ...card, padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={user?.profileImage || DEFAULT_AVA}
                  alt="me"
                  style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.primaryMid}`, flexShrink: 0 }}
                />
                <div
                  onClick={() => setShowPostModal(true)}
                  style={{
                    flex: 1, borderRadius: "4px", padding: "11px 18px",
                    background: C.surface, border: `1.5px solid ${C.border}`,
                    cursor: "pointer", color: C.inkSoft, fontSize: "0.9rem",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.primary)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
                >
                  Share something with the community…
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                {[
                  { icon: "⌨️", label: "Code" },
                  { icon: "🖼️", label: "Image" },
                  { icon: "📝", label: "Text" },
                ].map(({ label }) => (
                  <button
                    key={label}
                    className="cc-composer-btn"
                    onClick={() => setShowPostModal(true)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      border: `1px solid ${C.border}`, borderRadius: "4px", padding: "0.5rem 0",
                      background: C.white, color: C.inkMuted, fontSize: "0.82rem", fontWeight: 600,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {label === "Code" && <FaCode size={13} />}
                    {label === "Image" && <FaImage size={13} />}
                    {label === "Text" && <FaAlignLeft size={13} />}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Feed */}
            {posts.length === 0 && (
              <div style={{
                ...card, textAlign: "center", padding: "3rem 1rem",
                color: C.inkMuted, fontSize: "0.95rem",
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🏕️</div>
                No posts yet. Be the first to share something!
              </div>
            )}
            {posts.map((post) => (
              <div key={post._id} style={{ marginBottom: "1.1rem" }}>
                {renderPost(post)}
              </div>
            ))}
            {hasMorePosts && (
              <button
                type="button"
                className="cc-btn cc-btn-secondary"
                onClick={loadMorePosts}
                disabled={loadingPosts}
                style={{ width: "100%", marginBottom: "1rem" }}
              >
                {loadingPosts ? "Loading…" : "Load more posts"}
              </button>
            )}
          </main>

          {/* ══════════════════════════ RIGHT SIDEBAR ═════════════════════════ */}
          <aside className="cc-right-aside" style={{ position: "sticky", top: 90 }}>
            <div style={{ ...card, overflow: "hidden" }}>
              {/* Header Tabs */}
              <div style={{
                padding: "0.6rem 0.8rem 0.4rem",
                borderBottom: `1px solid ${C.border}`,
                display: "flex", gap: "6px",
                background: C.surfaceMuted,
              }}>
                <button
                  type="button"
                  onClick={() => setSidebarTab("recommended")}
                  style={{
                    flex: 1, padding: "6px 8px", fontSize: "0.78rem", fontWeight: 700,
                    borderRadius: "6px", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                    background: sidebarTab === "recommended" ? C.primary : "transparent",
                    color: sidebarTab === "recommended" ? "#fff" : C.inkMuted,
                    transition: "all 0.15s ease",
                  }}
                >
                  <FaMagic size={11} /> Suggested
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab("all")}
                  style={{
                    flex: 1, padding: "6px 8px", fontSize: "0.78rem", fontWeight: 700,
                    borderRadius: "6px", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                    background: sidebarTab === "all" ? C.primary : "transparent",
                    color: sidebarTab === "all" ? "#fff" : C.inkMuted,
                    transition: "all 0.15s ease",
                  }}
                >
                  <FaUserFriends size={12} /> Explore
                </button>
              </div>

              {/* Search (when in Explore tab) */}
              {sidebarTab === "all" && (
                <div style={{ padding: "0.6rem 0.8rem 0.3rem" }}>
                  <input
                    type="text"
                    placeholder="Search campus peers…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: "100%", border: `1px solid ${C.border}`, borderRadius: "4px",
                      padding: "0.45rem 0.85rem", fontSize: "0.82rem", outline: "none",
                      background: C.surface, color: C.ink,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = C.primary)}
                    onBlur={(e) => (e.target.style.borderColor = C.border)}
                  />
                </div>
              )}

              {/* List */}
              <div
                className="cc-scroll"
                style={{ maxHeight: 480, overflowY: "auto", padding: "0.5rem 0.6rem 0.75rem" }}
              >
                {sidebarTab === "recommended" ? (
                  recommendations.length === 0 ? (
                    <div style={{ textAlign: "center", color: C.inkSoft, padding: "1.5rem 0", fontSize: "0.82rem" }}>
                      No new graph recommendations right now.
                    </div>
                  ) : (
                    recommendations.map((person) => {
                      const personId = person._id || person.id;
                      const isFollowing = (person.followers || []).map(String).includes(String(currentUserId)) || person.isFollowing === true;
                      return (
                        <div
                          key={personId}
                          className="cc-people-row"
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "0.5rem 0.4rem", borderRadius: "8px", marginBottom: 6,
                            transition: "background 0.15s", background: C.surfaceMuted,
                            border: `1px solid ${C.border}`,
                          }}
                        >
                          <Link
                            to={`/profile/${personId}`}
                            style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, textDecoration: "none", flex: 1 }}
                          >
                            <img
                              src={person.profileImage || DEFAULT_AVA}
                              alt="Profile"
                              style={{
                                width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0,
                                border: `2px solid ${isFollowing ? C.primaryMid : C.border}`,
                              }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <span style={{
                                  fontWeight: 700, color: C.ink, fontSize: "0.82rem",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                                }}>
                                  {person.name || person.username}
                                </span>
                                {person.degree && (
                                  <ConnectionBadge degree={person.degree} size="xs" />
                                )}
                              </div>
                              <div style={{ color: C.primary, fontSize: "0.69rem", fontWeight: 600 }}>
                                {person.recommendationReason || `@${person.username}`}
                              </div>
                            </div>
                          </Link>

                          {isFollowing ? (
                            <button
                              onClick={() => handleUnfollow(personId)}
                              title="Unfollow"
                              style={{
                                background: C.primaryLight, border: `1px solid ${C.primaryMid}`,
                                borderRadius: "6px", padding: "4px 8px", cursor: "pointer", flexShrink: 0,
                                display: "flex", alignItems: "center",
                              }}
                            >
                              <img src={UserMinus} alt="Unfollow" style={{ height: 13, width: 13 }} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFollow(personId)}
                              title="Follow"
                              style={{
                                background: C.primary,
                                border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", flexShrink: 0,
                                display: "flex", alignItems: "center",
                                boxShadow: "0 2px 6px rgba(79,70,229,0.25)",
                              }}
                            >
                              <img src={UserPlus} alt="Follow" style={{ height: 13, width: 13, filter: "brightness(10)" }} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )
                ) : (
                  filteredUsers.length === 0 ? (
                    <div style={{ textAlign: "center", color: C.inkSoft, padding: "1.5rem 0", fontSize: "0.85rem" }}>
                      No users found.
                    </div>
                  ) : (
                    filteredUsers.map((person) => {
                      const personId = person._id || person.id;
                      const isFollowing = (person.followers || []).map(String).includes(String(currentUserId)) || person.isFollowing === true;
                      return (
                        <div
                          key={personId}
                          className="cc-people-row"
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "0.5rem 0.4rem", borderRadius: "8px", marginBottom: 4,
                            cursor: "pointer", transition: "background 0.15s",
                          }}
                        >
                          <Link
                            to={`/profile/${personId}`}
                            style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, textDecoration: "none", flex: 1 }}
                          >
                            <img
                              src={person.profileImage || DEFAULT_AVA}
                              alt="Profile"
                              style={{
                                width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0,
                                border: `2px solid ${isFollowing ? C.primaryMid : C.border}`,
                              }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontWeight: 700, color: C.ink, fontSize: "0.82rem",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                              }}>
                                {person.name || person.username}
                              </div>
                              <div style={{ color: C.inkSoft, fontSize: "0.72rem" }}>@{person.username}</div>
                            </div>
                          </Link>

                          {isFollowing ? (
                            <button
                              onClick={() => handleUnfollow(personId)}
                              title="Unfollow"
                              style={{
                                background: C.primaryLight, border: `1px solid ${C.primaryMid}`,
                                borderRadius: "4px", padding: "4px 8px", cursor: "pointer", flexShrink: 0,
                                display: "flex", alignItems: "center",
                              }}
                            >
                              <img src={UserMinus} alt="Unfollow" style={{ height: 13, width: 13 }} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFollow(personId)}
                              title="Follow"
                              style={{
                                background: C.primary,
                                border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", flexShrink: 0,
                                display: "flex", alignItems: "center",
                                boxShadow: "0 2px 8px rgba(79,70,229,0.3)",
                              }}
                            >
                              <img src={UserPlus} alt="Follow" style={{ height: 13, width: 13, filter: "brightness(10)" }} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Post modal */}
      <PostFormModal
        show={showPostModal}
        onClose={() => setShowPostModal(false)}
        onPost={handleNewPost}
      />

      {/* Mobile people FAB */}
      <div className="d-lg-none position-fixed" style={{ bottom: 16, right: 16, zIndex: 200 }}>
        <button
          style={{
            background: C.primary,
            border: "none", borderRadius: "4px", width: 52, height: 52,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(79,70,229,0.45)", cursor: "pointer",
          }}
          data-bs-toggle="offcanvas" data-bs-target="#userSidebar"
        >
          <img src={UsersLogo} alt="users" style={{ height: 20, width: 20, filter: "brightness(10)" }} />
        </button>

        <div className="offcanvas offcanvas-end" tabIndex="-1" id="userSidebar">
          <div className="offcanvas-header" style={{ borderBottom: `1px solid ${C.border}` }}>
            <h5 style={{ fontWeight: 800, color: C.ink }}>Suggested Network</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" />
          </div>
          <div className="offcanvas-body" style={{ background: C.surface }}>
            {recommendations.map((person) => {
              const personId = person._id || person.id;
              const isFollowing = (person.followers || []).includes(currentUserId);
              return (
                <div key={personId} className="d-flex align-items-center mb-3" style={{
                  background: C.white, borderRadius: "8px", padding: "10px 12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${C.border}`,
                }}>
                  <Link to={`/profile/${personId}`} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, textDecoration: "none" }}>
                    <img src={person.profileImage || DEFAULT_AVA} alt="Profile"
                      className="rounded-circle me-2" style={{ width: 38, height: 38, objectFit: "cover" }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
                        {person.name || person.username}
                        {person.degree && <ConnectionBadge degree={person.degree} size="xs" />}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: C.primary, fontWeight: 600 }}>
                        {person.recommendationReason || `@${person.username}`}
                      </div>
                    </div>
                  </Link>
                  {isFollowing ? (
                    <button onClick={() => handleUnfollow(personId)} style={{
                      background: C.primaryLight, border: `1px solid ${C.primaryMid}`,
                      borderRadius: "0.5rem", padding: "4px 8px", cursor: "pointer",
                    }}>
                      <img src={UserMinus} alt="Unfollow" style={{ height: 14 }} />
                    </button>
                  ) : (
                    <button onClick={() => handleFollow(personId)} style={{
                      background: C.primary,
                      border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer",
                    }}>
                      <img src={UserPlus} alt="Follow" style={{ height: 14, filter: "brightness(10)" }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
