import React, { useEffect, useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import PostCard from "../components/PostCard";
import PostFormModal from "../components/PostFormModal";
import UsersLogo from "../assets/users-solid-full.svg";
import UserPlus from "../assets/user-plus-regular-full.svg";
import UserMinus from "../assets/user-minus-solid-full.svg";

/* ─────────────────────────────────────────────────────────────────────
   GLOBAL PALETTE  (4 colours, used everywhere)
   • Primary   #4f46e5  indigo-600   → brand, buttons, accent
   • Secondary #0ea5e9  sky-500      → links, badges, tags
   • Surface   #f8faff               → page background, subtle fills
   • Ink       #0f172a  slate-900    → headings, text
───────────────────────────────────────────────────────────────────────*/
const C = {
  primary: "var(--cc-primary, #4f46e5)",
  secondary: "var(--cc-secondary, #0ea5e9)",
  surface: "var(--cc-background, #f8faff)",
  ink: "var(--cc-text, #0f172a)",

  // derived tints
  primaryLight: "var(--cc-primary-soft, #eef2ff)",
  primaryMid: "var(--cc-primary-dark, #c7d2fe)",
  secondaryLight: "var(--cc-primary-soft, #e0f2fe)",
  inkMuted: "var(--cc-muted, #64748b)",
  inkSoft: "var(--cc-muted, #94a3b8)",
  white: "var(--cc-surface, #ffffff)",
  border: "var(--cc-border, #e2e8f0)",
};

/* shared card style */
const card = {
  background: C.white,
  borderRadius: "1.15rem",
  border: `1px solid ${C.border}`,
  boxShadow: "0 2px 16px rgba(15,23,42,0.06)",
};

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [search, setSearch] = useState("");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api.get("/posts/all").then((res) => setPosts(res.data));
    api.get("/users/all").then((res) => setUsers(res.data));
  }, []);

  const handleNewPost = () => { api.get("/posts/all").then((r) => setPosts(r.data)); setShowPostModal(false); };
  const handleUpdatePost = (up) => setPosts((prev) => prev.map((p) => (p._id === up._id ? up : p)));

  const handleFollow = async (id) => {
    await api.post(`/users/${id}/follow`);
    setUsers((prev) => prev.map((u) => u._id === id ? { ...u, followers: [...(u.followers || []), user._id] } : u));
  };
  const handleUnfollow = async (id) => {
    await api.post(`/users/${id}/unfollow`);
    setUsers((prev) => prev.map((u) => u._id === id ? { ...u, followers: (u.followers || []).filter((f) => f !== user._id) } : u));
  };

  const filteredUsers = users.filter(
    (u) => (u.name || u.username).toLowerCase().includes(search.trim().toLowerCase()) && u._id !== user?._id
  );

  const renderPost = (post) => {
    if (post.repostedFrom && post.repostedFrom !== post._id && post.repostedPost) {
      return (
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ padding: "14px 16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <img
                src={post.author?.profileImage || DEFAULT_AVA}
                alt="Profile"
                style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.primaryMid}` }}
              />
              <span style={{ fontWeight: 700, color: C.ink, fontSize: "0.9rem" }}>{post.author?.name || post.author?.username}</span>
              <span style={{
                background: C.primaryLight, color: C.primary,
                borderRadius: "999px", padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700,
              }}>Reposted</span>
            </div>
            <PostCard post={post.repostedPost} user={user} onUpdate={handleUpdatePost} fullWidth />
          </div>
        </div>
      );
    }
    return (
      <PostCard
        post={post} user={user} onUpdate={handleUpdatePost}
        fullWidth={post.codeBlocks?.length > 0 && post.codeBlocks.some((cb) => cb.code?.length > 200)}
      />
    );
  };

  const DEFAULT_AVA = "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png";

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

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

      <div style={{ width: "100%", padding: "1.5rem 1.25rem" }}>
        <div className="cc-grid" style={{ display: "grid", gridTemplateColumns: "22% 1fr 22%", gap: "1.25rem", alignItems: "start" }}>

          {/* ══════════════════════════ LEFT SIDEBAR ══════════════════════════ */}
          <aside className="cc-left-aside" style={{ position: "sticky", top: 90 }}>
            {/* Profile card */}
            <div style={{ ...card, overflow: "hidden", marginBottom: "1rem" }}>
              {/* Cover gradient */}
              <div style={{
                height: 60,
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
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
                    borderRadius: "999px", padding: "4px 12px", fontSize: "0.75rem", fontWeight: 700,
                  }}>{user?.role || "User"}</span>
                  <span style={{
                    background: C.secondaryLight, color: C.secondary,
                    borderRadius: "999px", padding: "4px 12px", fontSize: "0.75rem", fontWeight: 700,
                  }}>{(user?.followers || []).length} Followers</span>
                </div>

                <a
                  href={`/profile/${user?._id}`}
                  style={{
                    display: "block", width: "100%",
                    background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                    color: C.white, borderRadius: "0.65rem", padding: "0.45rem 0",
                    fontWeight: 700, fontSize: "0.85rem", textDecoration: "none",
                    boxShadow: `0 4px 12px rgba(79,70,229,0.3)`,
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
              ].map(({ emoji, label, href }) => (
                <a key={label} href={href} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "0.45rem 0.6rem", borderRadius: "0.6rem",
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
                    flex: 1, borderRadius: "999px", padding: "10px 18px",
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
                ].map(({ icon, label }) => (
                  <button
                    key={label}
                    className="cc-composer-btn"
                    onClick={() => setShowPostModal(true)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      border: `1.5px solid ${C.border}`, borderRadius: "0.6rem", padding: "0.45rem 0",
                      background: C.white, color: C.inkMuted, fontSize: "0.82rem", fontWeight: 600,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <span>{icon}</span><span>{label}</span>
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
          </main>

          {/* ══════════════════════════ RIGHT SIDEBAR ═════════════════════════ */}
          <aside className="cc-right-aside" style={{ position: "sticky", top: 90 }}>
            <div style={{ ...card, overflow: "hidden" }}>
              {/* Header */}
              <div style={{
                padding: "1rem 1.25rem 0.75rem",
                borderBottom: `1px solid ${C.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontWeight: 800, color: C.ink, fontSize: "0.95rem" }}>People</span>
                <img src={UsersLogo} alt="people" style={{ height: 16, width: 16, opacity: 0.5 }} />
              </div>

              {/* Search */}
              <div style={{ padding: "0.75rem 1.25rem 0.5rem" }}>
                <input
                  type="text"
                  placeholder="Search people…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%", border: `1.5px solid ${C.border}`, borderRadius: "0.65rem",
                    padding: "0.45rem 0.85rem", fontSize: "0.82rem", outline: "none",
                    background: C.surface, color: C.ink,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>

              {/* List */}
              <div
                className="cc-scroll"
                style={{ maxHeight: 480, overflowY: "auto", padding: "0 0.75rem 0.75rem" }}
              >
                {filteredUsers.length === 0 && (
                  <div style={{ textAlign: "center", color: C.inkSoft, padding: "1.5rem 0", fontSize: "0.85rem" }}>
                    No users found.
                  </div>
                )}
                {filteredUsers.map((person) => {
                  const isFollowing = (person.followers || []).includes(user?._id);
                  return (
                    <div
                      key={person._id}
                      className="cc-people-row"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.55rem 0.5rem", borderRadius: "0.65rem", marginBottom: 4,
                        cursor: "pointer", transition: "background 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <img
                          src={person.profileImage || DEFAULT_AVA}
                          alt="Profile"
                          style={{
                            width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0,
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
                      </div>

                      {isFollowing ? (
                        <button
                          onClick={() => handleUnfollow(person._id)}
                          title="Unfollow"
                          style={{
                            background: C.primaryLight, border: `1.5px solid ${C.primaryMid}`,
                            borderRadius: "0.55rem", padding: "5px 8px", cursor: "pointer", flexShrink: 0,
                            display: "flex", alignItems: "center",
                          }}
                        >
                          <img src={UserMinus} alt="Unfollow" style={{ height: 14, width: 14, filter: `invert(30%) sepia(80%) saturate(500%) hue-rotate(220deg)` }} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFollow(person._id)}
                          title="Follow"
                          style={{
                            background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                            border: "none", borderRadius: "0.55rem", padding: "5px 8px", cursor: "pointer", flexShrink: 0,
                            display: "flex", alignItems: "center",
                            boxShadow: "0 2px 8px rgba(79,70,229,0.3)",
                          }}
                        >
                          <img src={UserPlus} alt="Follow" style={{ height: 14, width: 14, filter: "brightness(10)" }} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Post modal */}
      <PostFormModal show={showPostModal} onClose={() => setShowPostModal(false)} onPost={handleNewPost} />

      {/* Mobile people FAB */}
      <div className="d-lg-none position-fixed" style={{ bottom: 16, right: 16, zIndex: 200 }}>
        <button
          style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
            border: "none", borderRadius: "50%", width: 52, height: 52,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(79,70,229,0.45)", cursor: "pointer",
          }}
          data-bs-toggle="offcanvas" data-bs-target="#userSidebar"
        >
          <img src={UsersLogo} alt="users" style={{ height: 20, width: 20, filter: "brightness(10)" }} />
        </button>

        <div className="offcanvas offcanvas-end" tabIndex="-1" id="userSidebar">
          <div className="offcanvas-header" style={{ borderBottom: `1px solid ${C.border}` }}>
            <h5 style={{ fontWeight: 800, color: C.ink }}>People</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" />
          </div>
          <div className="offcanvas-body" style={{ background: C.surface }}>
            <input
              type="text" className="form-control mb-3"
              placeholder="Search people…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: "0.65rem", border: `1.5px solid ${C.border}` }}
            />
            {filteredUsers.length === 0 && <div className="text-muted text-center">No users found.</div>}
            {filteredUsers.map((person) => {
              const isFollowing = (person.followers || []).includes(user?._id);
              return (
                <div key={person._id} className="d-flex align-items-center mb-3" style={{
                  background: C.white, borderRadius: "0.75rem", padding: "10px 12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${C.border}`,
                }}>
                  <img src={person.profileImage || DEFAULT_AVA} alt="Profile"
                    className="rounded-circle me-2" style={{ width: 36, height: 36, objectFit: "cover" }} />
                  <span style={{ fontWeight: 700, flex: 1, fontSize: "0.88rem", color: C.ink }}>
                    {person.name || person.username}
                  </span>
                  {isFollowing ? (
                    <button onClick={() => handleUnfollow(person._id)} style={{
                      background: C.primaryLight, border: `1px solid ${C.primaryMid}`,
                      borderRadius: "0.5rem", padding: "4px 8px", cursor: "pointer",
                    }}>
                      <img src={UserMinus} alt="Unfollow" style={{ height: 14 }} />
                    </button>
                  ) : (
                    <button onClick={() => handleFollow(person._id)} style={{
                      background: `linear-gradient(135deg,${C.primary},${C.secondary})`,
                      border: "none", borderRadius: "0.5rem", padding: "4px 8px", cursor: "pointer",
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
