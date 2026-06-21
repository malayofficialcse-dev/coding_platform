import React, { useEffect, useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import PostCard from "../components/PostCard";
import PostFormModal from "../components/PostFormModal";
import UsersLogo from "../assets/users-solid-full.svg";
import UserPlus from "../assets/user-plus-regular-full.svg";
import UserMinus from "../assets/user-minus-solid-full.svg";

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

  const handleNewPost = (newPost) => {
    // refresh feed after a new post — keep it simple and consistent with backend
    api.get(`/posts/all`).then((res) => setPosts(res.data));
    setShowPostModal(false);
  };

  const handleUpdatePost = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  // Follow/unfollow logic (optimistic UI)
  const handleFollow = async (personId) => {
    await api.post(`/users/${personId}/follow`);
    setUsers((prev) => prev.map((u) => (u._id === personId ? { ...u, followers: [...(u.followers||[]), user._id] } : u)));
  };
  const handleUnfollow = async (personId) => {
    await api.post(`/users/${personId}/unfollow`);
    setUsers((prev) => prev.map((u) => (u._id === personId ? { ...u, followers: (u.followers||[]).filter((id) => id !== user._id) } : u)));
  };

  // Filter users by search
  const filteredUsers = users.filter(
    (u) => (u.name || u.username).toLowerCase().includes(search.trim().toLowerCase()) && u._id !== user?._id
  );

  // Helper to render reposted posts like in profile page (leave logic unchanged)
  const renderPost = (post) => {
    if (post.repostedFrom && post.repostedFrom !== post._id && post.repostedPost) {
      return (
        <div className="card mb-3 shadow-sm border-0 rounded-4 w-100">
          <div className="card-body pb-0">
            <div className="d-flex align-items-center mb-2">
              <img
                src={post.author?.profileImage || "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"}
                alt="Profile"
                className="rounded-circle border me-2"
                style={{ width: 36, height: 36, objectFit: "cover" }}
              />
              <span className="fw-bold">{post.author?.name || post.author?.username}</span>
              <span className="badge bg-secondary ms-2">Reposted</span>
            </div>
            <div className="mb-2">
              <PostCard post={post.repostedPost} user={user} onUpdate={handleUpdatePost} fullWidth />
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
        fullWidth={
          post.codeBlocks && post.codeBlocks.length > 0 && post.codeBlocks.some((cb) => cb.code && cb.code.length > 200)
        }
      />
    );
  };

  return (
    <div className="container-fluid py-4">
      {/* Top area: three-column layout wrapper */}
      <div className="row gx-4">
        {/* LEFT: profile card */}
        <aside className="col-lg-3 col-md-4 d-none d-md-block">
          <div className="card rounded-4 shadow-sm sticky-top" style={{ top: 96 }}>
            <div className="card-body text-center">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <img
                  src={user?.profileImage || "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"}
                  alt="profile"
                  style={{ width: 140, height: 140, borderRadius: 12, objectFit: "cover", boxShadow: "0 8px 22px rgba(15,15,30,0.08)" }}
                />
              </div>
              <h5 className="fw-bold mb-1">{user?.name || user?.username}</h5>
              <div className="text-muted mb-2">@{user?.username}</div>
              <div className="small text-muted mb-3">{user?.email}</div>

              <div className="d-flex justify-content-center gap-2 mb-3">
                <span className="badge bg-light text-dark" style={{ padding: "8px 12px" }}>{user?.role || "User"}</span>
                <span className="badge bg-light text-dark" style={{ padding: "8px 12px" }}>{(user?.followers||[]).length || 0} followers</span>
              </div>

              <div className="d-grid">
                <a href={`/profile/${user?._id}`} className="btn btn-outline-primary btn-sm">View profile</a>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER: feed */}
        <main className="col-lg-6 col-md-8 col-12">

          {/* --- LINKEDIN-STYLE COMPOSER BAR (COMPACT) --- */}
          <div className="card rounded-4 shadow-sm mb-4" style={{ padding: 14 }}>
            <div className="d-flex align-items-center gap-3">
              {/* avatar */}
              <img
                src={user?.profileImage || "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"}
                alt="me"
                style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
              />

              {/* clickable input-like area */}
              <div
                onClick={() => setShowPostModal(true)}
                style={{
                  flex: 1,
                  borderRadius: 24,
                  padding: "10px 16px",
                  background: "#fff",
                  boxShadow: "0 6px 18px rgba(20,20,40,0.04)",
                  cursor: "pointer",
                  color: "#6b6b6b",
                }}
              >
                Start a post
              </div>

              {/* quick action buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-sm" style={{ background: "white", border: "1px solid transparent", boxShadow: "0 6px 18px rgba(20,20,40,0.04)" }} onClick={() => setShowPostModal(true)}>
                  <strong>Code</strong>
                </button>
                <button className="btn btn-sm" style={{ background: "white", border: "1px solid transparent", boxShadow: "0 6px 18px rgba(20,20,40,0.04)" }} onClick={() => setShowPostModal(true)}>
                  <strong>Image</strong>
                </button>
                <button className="btn btn-sm" style={{ background: "white", border: "1px solid transparent", boxShadow: "0 6px 18px rgba(20,20,40,0.04)" }} onClick={() => setShowPostModal(true)}>
                  <strong>Text</strong>
                </button>
              </div>
            </div>
          </div>

          {/* FEED: posts below the composer */}
          <div>
            {posts.length === 0 && <div className="text-muted">No posts yet.</div>}
            {posts.map((post) => (
              <div key={post._id} className="mb-4">
                {renderPost(post)}
              </div>
            ))}
          </div>
        </main>

        {/* RIGHT: people list */}
        <aside className="col-lg-3 col-md-12 d-none d-lg-block">
          <div className="card rounded-4 shadow-sm sticky-top" style={{ top: 96 }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">People</h5>
                <img src={UsersLogo} alt="people" style={{ height: 18, width: 18 }} />
              </div>

              <input type="text" className="form-control mb-3" placeholder="Search people..." value={search} onChange={(e) => setSearch(e.target.value)} />

              <div className="p-2 rounded" style={{ maxHeight: 520, overflowY: "auto", backgroundColor: "#fbfbfd" }}>
                <style>{`.people-scroll::-webkit-scrollbar { width: 6px; } .people-scroll::-webkit-scrollbar-thumb { background:#ffc107; border-radius:10px; }`}</style>
                <div className="people-scroll">
                  {filteredUsers.length === 0 && <div className="text-center text-muted py-3">No users found.</div>}

                  {filteredUsers.map((person) => {
                    const isFollowing = (person.followers || []).includes(user?._id);
                    return (
                      <div key={person._id} className="d-flex align-items-center justify-content-between mb-3" style={{ backgroundColor: "white", padding: "8px 10px", borderRadius: 10, boxShadow: "0 6px 18px rgba(20,20,40,0.04)", cursor: "pointer" }}>
                        <div className="d-flex align-items-center">
                          <img src={person.profileImage || "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"} alt="Profile" className="rounded-circle border" style={{ width: 48, height: 48, objectFit: "cover", marginRight: 12 }} />
                          <div>
                            <div className="fw-bold" style={{ fontSize: 14 }}>{person.name || person.username}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>@{person.username}</div>
                          </div>
                        </div>

                        {isFollowing ? (
                          <button className="btn btn-sm btn-warning" onClick={() => handleUnfollow(person._id)} title="Unfollow">
                            <img src={UserMinus} alt="Unfollow" style={{ height: 16, width: 16 }} />
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-outline-warning" onClick={() => handleFollow(person._id)} title="Follow">
                            <img src={UserPlus} alt="Follow" style={{ height: 16, width: 16 }} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* --- MODAL USED BY COMPOSER --- */}
      <PostFormModal show={showPostModal} onClose={() => setShowPostModal(false)} onPost={handleNewPost} />

      {/* Mobile: floating people/offcanvas (keeps existing behavior) */}
      <div className="d-md-none position-fixed bottom-0 end-0 p-2" style={{ zIndex: 200 }}>
        <button className="btn btn-outline-secondary" type="button" data-bs-toggle="offcanvas" data-bs-target="#userSidebar" aria-controls="userSidebar">
          <img src={UsersLogo} alt="users" style={{ height: 18, width: 18 }} />
        </button>

        <div className="offcanvas offcanvas-end" tabIndex="-1" id="userSidebar" aria-labelledby="userSidebarLabel">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="userSidebarLabel">People</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>

          <div className="offcanvas-body">
            <input type="text" className="form-control mb-3" placeholder="Search people..." value={search} onChange={(e) => setSearch(e.target.value)} />

            {filteredUsers.length === 0 && <div className="text-muted">No users found.</div>}

            {filteredUsers.map((person) => {
              const isFollowing = (person.followers || []).includes(user?._id);
              return (
                <div key={person._id} className="d-flex align-items-center mb-3">
                  <img src={person.profileImage || "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"} alt="Profile" className="rounded-circle border me-2" style={{ width: 36, height: 36, objectFit: "cover" }} />
                  <span className="fw-bold flex-grow-1">{person.name || person.username}</span>

                  {isFollowing ? (
                    <button className="btn btn-sm btn-warning" onClick={() => handleUnfollow(person._id)}>
                      <img src={UserMinus} alt="Unfollow" style={{ height: 16, width: 16 }} />
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-outline-warning" onClick={() => handleFollow(person._id)}>
                      <img src={UserPlus} alt="Follow" style={{ height: 16, width: 16 }} />
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
