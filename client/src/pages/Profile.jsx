import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../api/api";
import { Link } from "react-router-dom";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale
);

import CameraImage from "../assets/camera-regular-full.svg";
import EditLogo from "../assets/edit.svg";
import DeleteLogo from "../assets/delete.svg";
import SaveLogo from "../assets/floppy-disk-regular-full.svg";
import CancelLogo from "../assets/x-solid-full.svg";

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [enrollments, setEnrollments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [allProblems, setAllProblems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage);
  const [selectedFile, setSelectedFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editCodeBlocks, setEditCodeBlocks] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [editImages, setEditImages] = useState([]);

  useEffect(() => {
    if (user) {
      api.get("/enrollments/mine").then((res) => setEnrollments(res.data || []));
      api.get("/attempts/mine").then((res) => setAttempts(res.data || []));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      api.get("/coding/submissions/me").then((res) => {
        const solvedIds = [
          ...new Set(
            (res.data || [])
              .filter((s) => s.result === "Accepted")
              .map((s) => s.problem)
          ),
        ];
        setSolvedProblems(solvedIds);
      });
      api.get("/coding/problems").then((res) => setAllProblems(res.data || []));
    }
  }, [user]);

  // Prepare analytics data
  const examTitles = attempts.map((a) => a.exam?.title || "Exam");
  const scores = attempts.map((a) => a.score);
  const totals = attempts.map((a) => a.total || 0);

  // For Pie chart: Pass/Fail
  const passCount = attempts.filter((a) => a.score >= (a.total || 0) * 0.4).length;
  const failCount = attempts.length - passCount;

  const handleEditCodeChange = (idx, field, value) => {
    setEditCodeBlocks((prev) =>
      prev.map((cb, i) => (i === idx ? { ...cb, [field]: value } : cb))
    );
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setProfileImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("profileImage", selectedFile);
    try {
      const res = await api.put("/auth/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfileImage(res.data.profileImage);
      setUser && setUser({ ...user, profileImage: res.data.profileImage });
      setSelectedFile(null);
    } catch (err) {
      alert("Image upload failed");
    }
    setUploading(false);
  };

  useEffect(() => {
    if (user) {
      api.get(`/posts/user/${user._id}`).then((res) => setPosts(res.data || []));
      api.get(`/users/${user._id}`).then((res) => {
        setFollowers(res.data?.followers || []);
        setFollowing(res.data?.following || []);
      });
    }
  }, [user, refresh]);

  const startEdit = (post) => {
    setEditingPostId(post._id);
    setEditText(post.text || "");
    setEditCodeBlocks(post.codeBlocks || []);
    setEditImages(post.images || []);
  };

  const handleImageChange = (e) => {
    setEditImages(Array.from(e.target.files || []));
  };

  const saveEdit = async (postId) => {
    const formData = new FormData();
    formData.append("text", editText);
    formData.append("codeBlocks", JSON.stringify(editCodeBlocks));
    editImages.forEach((img) => formData.append("images", img));
    await api.put(`/posts/${postId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setEditingPostId(null);
    setEditText("");
    setEditCodeBlocks([]);
    setEditImages([]);
    setRefresh((r) => !r);
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditText("");
    setEditCodeBlocks([]);
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    await api.delete(`/posts/${postId}`);
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleFollow = async (personId) => {
    await api.post(`/users/${personId}/follow`);
    setRefresh((r) => !r);
  };
  const handleUnfollow = async (personId) => {
    await api.post(`/users/${personId}/unfollow`);
    setRefresh((r) => !r);
  };


  // Responsive styles and thin scrollbar
  const styles = {
    page: {
      padding: "24px 12px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "360px 1fr",
      gap: 24,
      alignItems: "start",
    },
    gridMobile: {
      display: "block",
    },
    profileCard: {
      padding: 18,
      borderRadius: 12,
      background: "var(--cc-surface)",
      boxShadow: "0 6px 18px rgba(20,20,40,0.06)",
    },
    profileImage: {
      width: 160,
      height: 160,
      borderRadius: 16,
      objectFit: "cover",
      border: "3px solid var(--cc-surface)",
      boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
    },
    infoRow: { display: "flex", gap: 8, alignItems: "center", marginTop: 12 },
    rightPanelCard: {
      padding: 18,
      borderRadius: 12,
      background: "var(--cc-surface)",
      boxShadow: "0 6px 18px rgba(20,20,40,0.04)",
      marginBottom: 18,
    },
    scrollArea: {
      maxHeight: 420,
      overflowY: "auto",
      paddingRight: 6,
    },
    smallBadge: {
      fontSize: 12,
      padding: "6px 8px",
      borderRadius: 8,
    },
  };

  // choose layout based on window width
  const isMobile = typeof window !== "undefined" ? window.innerWidth <= 992 : false;

  return (
    <div style={styles.page}>
      <style>{`
        /* thin scrollbar for Webkit */
        .profile-scroll::-webkit-scrollbar { height:6px; width:6px; }
        .profile-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }
        .profile-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.12) transparent; }
        .profile-name { font-size: 20px; font-weight: 700; }
        .profile-sub { color: #6b7280; font-size: 14px; }
        @media (max-width: 992px) {
          .profile-grid { display: block !important; }
          .profile-image { width: 120px !important; height: 120px !important; margin: 0 auto; display:block; }
          .profile-left { margin-bottom: 18px; }
        }
      `}</style>

      {/* <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>My Profile</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            Last updated: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "—"}
          </span>
        </div>
      </div> */}

      <div className="profile-grid" style={isMobile ? styles.gridMobile : styles.grid}>
        {/* LEFT: Profile card */}
        <aside className="profile-left" style={styles.profileCard}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                className="profile-image"
                src={
                  profileImage ||
                  "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"
                }
                alt="Profile"
                style={styles.profileImage}
              />
              <label
                htmlFor="profile-upload"
                title="Change profile photo"
                style={{
                  position: "absolute",
                  right: -6,
                  bottom: -6,
                  background: "var(--cc-surface)",
                  padding: 8,
                  borderRadius: 10,
                  boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                }}
              >
                <img src={CameraImage} alt="Upload" style={{ width: 18, height: 18 }} />
              </label>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <div className="profile-name">{user?.name || user?.username}</div>
              <div className="profile-sub" style={{ marginTop: 6 }}>
                {user?.email}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ ...styles.smallBadge, background: "#eef2ff", color: "#3730a3" }}>
                  Role: {user?.role || "User"}
                </span>
                <span style={{ ...styles.smallBadge, background: "#ecfdf5", color: "#065f46" }}>
                  Courses: {enrollments.length}
                </span>
                <span style={{ ...styles.smallBadge, background: "#fff7ed", color: "#92400e" }}>
                  Solved: {solvedProblems.length}
                </span>
              </div>

              {selectedFile && (
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-sm btn-primary" onClick={handleImageUpload} disabled={uploading}>
                    {uploading ? "Uploading..." : "Update Photo"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* brief bio / details area */}
          <div style={{ marginTop: 18, color: "var(--cc-text)", fontSize: 14 }}>
            <p style={{ margin: 0 }}>
              <strong>About:</strong>{" "}
              {user?.bio || "No bio provided. Add a short bio to let others know about you."}
            </p>
          </div>
        </aside>

        {/* RIGHT: Details panels */}
        <main>
          {/* Courses */}
          <section style={styles.rightPanelCard} className="profile-scroll">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h5 style={{ margin: 0 }}>My Courses</h5>
              <span style={{ color: "#6b7280", fontSize: 13 }}>{enrollments.length}</span>
            </div>

            <div style={styles.scrollArea}>
              {enrollments.length === 0 && <div className="text-muted">No enrollments yet.</div>}
              <ul className="list-group">
                {enrollments.map((en) => {
                  const expired = new Date(en.expiresAt) < new Date();
                  if (!en.course) return null;
                  return (
                    <li key={en._id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <Link to={`/courses/${en.course._id}`} style={{ fontWeight: 600 }}>{en.course.title}</Link>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{en.course.subtitle || ""}</div>
                      </div>
                      <div style={{ textAlign: "right", minWidth: 110 }}>
                        <div style={{ fontSize: 12 }}>{new Date(en.expiresAt).toLocaleDateString()}</div>
                        <div style={{ marginTop: 6 }}>
                          <span className={`badge ${expired ? "bg-danger" : "bg-success"}`}>
                            {expired ? "Expired" : "Active"}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Analytics */}
          <section style={{ ...styles.rightPanelCard, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ margin: 0 }}>Performance</h5>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setShowAnalytics((v) => !v)}>
                {showAnalytics ? "Hide" : "Show"}
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              {!showAnalytics && (
                <div className="text-muted">
                  Recent Attempts: {attempts.length} — Pass: {passCount} / Fail: {failCount}
                </div>
              )}

              {showAnalytics && attempts.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div style={{ background: "var(--cc-surface)", padding: 8, borderRadius: 8 }}>
                    <Bar
                      data={{
                        labels: examTitles,
                        datasets: [
                          { label: "Score", data: scores, backgroundColor: "#36A2EB" },
                          { label: "Total", data: totals, backgroundColor: "#e0e0e0" },
                        ],
                      }}
                      options={{ maintainAspectRatio: true, plugins: { legend: { display: false } } }}
                    />
                  </div>
                  <div style={{ background: "var(--cc-surface)", padding: 8, borderRadius: 8 }}>
                    <Line
                      data={{
                        labels: examTitles,
                        datasets: [{ label: "Score", data: scores, borderColor: "#4CAF50", backgroundColor: "#4CAF5044", tension: 0.3 }],
                      }}
                      options={{ maintainAspectRatio: true, plugins: { legend: { display: false } } }}
                    />
                  </div>
                  {/* <div style={{ gridColumn: "1 / -1", background: "#fff", padding: 8, borderRadius: 8 }}>
                    <Pie
                      data={{ labels: ["Pass", "Fail"], datasets: [{ data: [passCount, failCount], backgroundColor: ["#4CAF50", "#FF6384"] }] }}
                      options={{ maintainAspectRatio: true }}
                    />
                  </div> */}
                </div>
              )}

              {showAnalytics && attempts.length === 0 && <div className="text-muted mt-2">No attempts to show.</div>}
            </div>
          </section>

          {/* Followers / Following */}
          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div style={styles.rightPanelCard} className="profile-scroll">
              <h6 style={{ marginTop: 0 }}>Followers ({followers.length})</h6>
              <div style={{ ...styles.scrollArea }}>
                {followers.length === 0 && <div className="text-muted">No followers yet.</div>}
                <ul className="list-group">
                  {followers.map((f) => (
                    <li key={f._id} className="list-group-item d-flex justify-content-between align-items-center">
                      <Link to={`/profile/${f._id}`}>{f.name || f.username}</Link>
                      {user?.following?.includes(f._id) ? (
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleUnfollow(f._id)}>Unfollow</button>
                      ) : (
                        <button className="btn btn-sm btn-warning" onClick={() => handleFollow(f._id)}>Follow</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={styles.rightPanelCard} className="profile-scroll">
              <h6 style={{ marginTop: 0 }}>Following ({following.length})</h6>
              <div style={{ ...styles.scrollArea }}>
                {following.length === 0 && <div className="text-muted">Not following anyone.</div>}
                <ul className="list-group">
                  {following.map((f) => (
                    <li key={f._id} className="list-group-item d-flex justify-content-between align-items-center">
                      <Link to={`/profile/${f._id}`}>{f.name || f.username}</Link>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => handleUnfollow(f._id)}>Unfollow</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* My Posts */}
          <section style={{ marginTop: 12 }}>
            <div style={styles.rightPanelCard}>
              <h5 style={{ marginTop: 0 }}>My Posts</h5>
              {posts.length === 0 && <div className="text-muted">No posts yet.</div>}
              <div style={{ marginTop: 12 }}>
                {posts.map((post) =>
                  editingPostId === post._id ? (
                    <div key={post._id} className="card mb-3">
                      <div className="card-body">
                        <textarea className="form-control mb-2" value={editText} onChange={(e) => setEditText(e.target.value)} />
                        <div className="mb-2">
                          <strong>Edit Code Blocks:</strong>
                          {editCodeBlocks.map((cb, idx) => (
                            <div key={idx} className="mb-2">
                              <input className="form-control mb-1" value={cb.language} onChange={(e) => handleEditCodeChange(idx, "language", e.target.value)} placeholder="Language" />
                              <textarea className="form-control font-monospace" rows={2} value={cb.code} onChange={(e) => handleEditCodeChange(idx, "code", e.target.value)} placeholder="Code" />
                            </div>
                          ))}
                        </div>
                        <div className="mb-2">
                          <strong>Edit Images:</strong>
                          <input type="file" multiple accept="image/*" className="form-control" onChange={handleImageChange} />
                          <div className="mt-2">
                            {editImages &&
                              editImages.map((img, idx) =>
                                typeof img === "string" ? (
                                  <img key={idx} src={img} alt="" style={{ maxWidth: 100, marginRight: 8 }} />
                                ) : (
                                  <span key={idx} className="badge bg-secondary me-2">{img.name}</span>
                                )
                              )}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-sm btn-success" onClick={() => saveEdit(post._id)}>
                            <img src={SaveLogo} alt="Save" style={{ height: 16, width: 16 }} />
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>
                            <img src={CancelLogo} alt="Cancel" style={{ height: 16, width: 16 }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={post._id} className="card mb-3">
                      <div className="card-body">
                        <p>{post.text}</p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {(post.images || []).map((img, idx) => (
                            <img key={idx} src={img} alt="" style={{ maxWidth: 200, marginRight: 8, borderRadius: 6 }} />
                          ))}
                        </div>
                        {(post.codeBlocks || []).map((cb, idx) => (
                          <pre key={idx} className="bg-light p-2" style={{ borderRadius: 6 }}>
                            <code><b>{cb.language}:</b> {cb.code}</code>
                          </pre>
                        ))}
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(post)}>
                            <img src={EditLogo} alt="Edit" style={{ height: 16, width: 16 }} />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deletePost(post._id)}>
                            <img src={DeleteLogo} alt="Delete" style={{ height: 16, width: 16 }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}






// import React, { useContext, useEffect, useState } from "react";
// import { AuthContext } from "../contexts/AuthContext";
// import api from "../api/api";
// import { Link } from "react-router-dom";
// import { Bar, Line, Pie } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   Title,
//   Tooltip,
//   Legend,
//   BarElement,
//   LineElement,
//   PointElement,
//   ArcElement,
//   CategoryScale,
//   LinearScale,
// } from "chart.js";

// ChartJS.register(
//   Title,
//   Tooltip,
//   Legend,
//   BarElement,
//   LineElement,
//   PointElement,
//   ArcElement,
//   CategoryScale,
//   LinearScale
// );

// import CameraImage from "../assets/camera-regular-full.svg";
// import EditLogo from "../assets/edit.svg";
// import DeleteLogo from "../assets/delete.svg";
// import SaveLogo from "../assets/floppy-disk-regular-full.svg";
// import CancelLogo from "../assets/x-solid-full.svg";

// export default function Profile() {
//   const { user, setUser } = useContext(AuthContext);

//   const [enrollments, setEnrollments] = useState([]);
//   const [attempts, setAttempts] = useState([]);
//   const [showAnalytics, setShowAnalytics] = useState(false);
//   const [solvedProblems, setSolvedProblems] = useState([]);
//   const [allProblems, setAllProblems] = useState([]);
//   const [uploading, setUploading] = useState(false);
//   const [profileImage, setProfileImage] = useState(user?.profileImage);
//   const [selectedFile, setSelectedFile] = useState(null);

//   const [posts, setPosts] = useState([]);
//   const [followers, setFollowers] = useState([]);
//   const [following, setFollowing] = useState([]);
//   const [refresh, setRefresh] = useState(false);

//   const [editingPostId, setEditingPostId] = useState(null);
//   const [editText, setEditText] = useState("");
//   const [editCodeBlocks, setEditCodeBlocks] = useState([]);
//   const [editImages, setEditImages] = useState([]);

//   // ============= FETCH COURSES + ATTEMPTS =============
//   useEffect(() => {
//     if (user) {
//       api.get("/enrollments/mine").then((res) => setEnrollments(res.data || []));
//       api.get("/attempts/mine").then((res) => setAttempts(res.data || []));
//     }
//   }, [user]);

//   // ============= FETCH PROBLEMS SOLVED =============
//   useEffect(() => {
//     if (!user) return;

//     api.get("/coding/submissions/me").then((res) => {
//       const solvedIds = [
//         ...new Set(
//           (res.data || [])
//             .filter((s) => s.result === "Accepted")
//             .map((s) => s.problem)
//         ),
//       ];
//       setSolvedProblems(solvedIds);
//     });

//     api.get("/coding/problems").then((res) => setAllProblems(res.data || []));
//   }, [user]);

//   // ============= FETCH POSTS (supports both APIs) =============
//   useEffect(() => {
//     if (!user) return;

//     async function loadPosts() {
//       try {
//         // Backend Style #1: /posts/user/:id
//         const primary = await api.get(`/posts/user/${user._id}`);

//         if (Array.isArray(primary.data) && primary.data.length > 0) {
//           setPosts(primary.data);
//         } else {
//           // Backend Style #2: /posts?userId=id
//           const secondary = await api.get(`/posts?userId=${user._id}`);
//           setPosts(secondary.data || []);
//         }
//       } catch (err) {
//         try {
//           const fallback = await api.get(`/posts?userId=${user._id}`);
//           setPosts(fallback.data || []);
//         } catch (err2) {
//           console.log("Both post routes failed");
//           setPosts([]);
//         }
//       }
//     }

//     loadPosts();

//     api.get(`/users/${user._id}`).then((res) => {
//       setFollowers(res.data.followers || []);
//       setFollowing(res.data.following || []);
//     });

//   }, [user, refresh]);

//   // =============== HANDLE PROFILE IMAGE ===============
//   const handleFileSelect = (e) => {
//     if (e.target.files[0]) {
//       setSelectedFile(e.target.files[0]);
//       setProfileImage(URL.createObjectURL(e.target.files[0]));
//     }
//   };

//   const handleImageUpload = async () => {
//     if (!selectedFile) return;
//     setUploading(true);

//     const formData = new FormData();
//     formData.append("profileImage", selectedFile);

//     try {
//       const res = await api.put("/auth/profile/image", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       setProfileImage(res.data.profileImage);
//       setUser({ ...user, profileImage: res.data.profileImage });
//       setSelectedFile(null);
//     } catch (err) {
//       alert("Failed to upload");
//     }

//     setUploading(false);
//   };

//   // =============== POST EDIT HANDLERS ===============
//   const startEdit = (post) => {
//     setEditingPostId(post._id);
//     setEditText(post.text);
//     setEditCodeBlocks(post.codeBlocks || []);
//     setEditImages(post.images || []);
//   };

//   const handleImageChange = (e) => {
//     setEditImages(Array.from(e.target.files));
//   };

//   const handleEditCodeChange = (idx, field, value) => {
//     setEditCodeBlocks((prev) =>
//       prev.map((cb, i) => (i === idx ? { ...cb, [field]: value } : cb))
//     );
//   };

//   const cancelEdit = () => {
//     setEditingPostId(null);
//     setEditText("");
//     setEditCodeBlocks([]);
//     setEditImages([]);
//   };

//   const saveEdit = async (postId) => {
//     const formData = new FormData();
//     formData.append("text", editText);
//     formData.append("codeBlocks", JSON.stringify(editCodeBlocks));
//     editImages.forEach((img) => formData.append("images", img));

//     try {
//       await api.put(`/posts/${postId}`, formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       cancelEdit();
//       setRefresh((r) => !r);
//     } catch (err) {
//       alert("Failed to update post");
//     }
//   };

//   const deletePost = async (postId) => {
//     if (!window.confirm("Delete this post?")) return;

//     try {
//       await api.delete(`/posts/${postId}`);
//       setPosts((prev) => prev.filter((p) => p._id !== postId));
//     } catch (err) {
//       alert("Delete failed");
//     }
//   };

//   // =============== FOLLOW / UNFOLLOW ===============
//   const handleFollow = async (id) => {
//     await api.post(`/users/${id}/follow`);
//     setRefresh((r) => !r);
//   };

//   const handleUnfollow = async (id) => {
//     await api.post(`/users/${id}/unfollow`);
//     setRefresh((r) => !r);
//   };

//   // =============== ANALYTICS DATA ===============
//   const examTitles = attempts.map((a) => a.exam?.title || "Exam");
//   const scores = attempts.map((a) => a.score);
//   const totals = attempts.map((a) => a.total || 0);

//   const passCount = attempts.filter((a) => a.score >= (a.total || 0) * 0.4).length;
//   const failCount = attempts.length - passCount;

//   // STYLES
//   const styles = {
//     page: { padding: "24px 12px" },
//     grid: {
//       display: "grid",
//       gridTemplateColumns: "360px 1fr",
//       gap: 24,
//     },
//     gridMobile: { display: "block" },
//     profileCard: {
//       padding: 18,
//       borderRadius: 12,
//       background: "#fff",
//       boxShadow: "0 6px 18px rgba(20,20,40,0.06)",
//     },
//     profileImage: {
//       width: 160,
//       height: 160,
//       borderRadius: 16,
//       objectFit: "cover",
//       border: "3px solid #fff",
//       boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
//     },
//     rightPanelCard: {
//       padding: 18,
//       borderRadius: 12,
//       background: "#fff",
//       boxShadow: "0 6px 18px rgba(20,20,40,0.04)",
//       marginBottom: 18,
//     },
//     scrollArea: {
//       maxHeight: 420,
//       overflowY: "auto",
//       paddingRight: 6,
//     },
//   };

//   const isMobile =
//     typeof window !== "undefined" ? window.innerWidth <= 992 : false;

//   return (
//     <div style={styles.page}>
//       <style>{`
//         .profile-scroll::-webkit-scrollbar { height:6px; width:6px; }
//         .profile-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }
//         @media (max-width: 992px) {
//           .profile-grid { display:block !important; }
//         }
//       `}</style>

//       <div className="profile-grid" style={isMobile ? styles.gridMobile : styles.grid}>
        
//         {/* LEFT: PROFILE CARD */}
//         <aside style={styles.profileCard}>
//           <div style={{ display: "flex", gap: 16 }}>
//             <div style={{ position: "relative" }}>
//               <img
//                 src={
//                   profileImage ||
//                   "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"
//                 }
//                 style={styles.profileImage}
//               />

//               <label
//                 htmlFor="profile-upload"
//                 style={{
//                   position: "absolute",
//                   right: -6,
//                   bottom: -6,
//                   background: "#fff",
//                   padding: 8,
//                   borderRadius: 10,
//                   boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
//                   cursor: "pointer",
//                 }}
//               >
//                 <img src={CameraImage} style={{ width: 18, height: 18 }} />
//               </label>

//               <input
//                 id="profile-upload"
//                 type="file"
//                 accept="image/*"
//                 style={{ display: "none" }}
//                 onChange={handleFileSelect}
//               />
//             </div>

//             <div>
//               <h4>{user?.name || user?.username}</h4>
//               <p>{user?.email}</p>

//               {selectedFile && (
//                 <button className="btn btn-primary btn-sm" onClick={handleImageUpload}>
//                   {uploading ? "Uploading..." : "Save Photo"}
//                 </button>
//               )}
//             </div>
//           </div>
//         </aside>

//         {/* RIGHT PANEL */}
//         <main>

//           {/* COURSES */}
//           <section style={styles.rightPanelCard}>
//             <h5>My Courses</h5>

//             {enrollments.length === 0 ? (
//               <div>No enrollments yet.</div>
//             ) : (
//               <div style={styles.scrollArea} className="profile-scroll">
//                 {enrollments.map((en) => (
//                   <div key={en._id} className="mb-2 p-2 border rounded">
//                     <Link to={`/courses/${en.course._id}`}>{en.course.title}</Link>
//                     <div style={{ fontSize: 12 }}>
//                       Expires: {new Date(en.expiresAt).toLocaleDateString()}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </section>

//           {/* ANALYTICS */}
//           <section style={styles.rightPanelCard}>
//             <h5>
//               Performance
//               <button
//                 className="btn btn-sm btn-outline-primary float-end"
//                 onClick={() => setShowAnalytics((v) => !v)}
//               >
//                 {showAnalytics ? "Hide" : "Show"}
//               </button>
//             </h5>

//             {showAnalytics && attempts.length > 0 ? (
//               <div>
//                 {/* BAR */}
//                 <Bar
//                   data={{
//                     labels: examTitles,
//                     datasets: [
//                       { label: "Score", data: scores, backgroundColor: "#36A2EB" },
//                       { label: "Total", data: totals, backgroundColor: "#e0e0e0" },
//                     ],
//                   }}
//                 />

//                 {/* PIE */}
//                 <Pie
//                   data={{
//                     labels: ["Pass", "Fail"],
//                     datasets: [{ data: [passCount, failCount] }],
//                   }}
//                 />
//               </div>
//             ) : (
//               <div>No analytics to show.</div>
//             )}
//           </section>

//           {/* FOLLOWERS */}
//           <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
//             <div style={styles.rightPanelCard}>
//               <h6>Followers ({followers.length})</h6>

//               {followers.length === 0 ? (
//                 <div>No followers</div>
//               ) : (
//                 <div style={styles.scrollArea}>
//                   {followers.map((f) => (
//                     <div key={f._id} className="d-flex justify-content-between mb-2">
//                       <Link to={`/profile/${f._id}`}>{f.name}</Link>

//                       {following.includes(f._id) ? (
//                         <button className="btn btn-sm btn-outline-secondary"
//                           onClick={() => handleUnfollow(f._id)}>
//                           Unfollow
//                         </button>
//                       ) : (
//                         <button className="btn btn-sm btn-warning"
//                           onClick={() => handleFollow(f._id)}>
//                           Follow
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* FOLLOWING */}
//             <div style={styles.rightPanelCard}>
//               <h6>Following ({following.length})</h6>

//               {following.length === 0 ? (
//                 <div>Not following anyone</div>
//               ) : (
//                 <div style={styles.scrollArea}>
//                   {following.map((f) => (
//                     <div key={f._id} className="d-flex justify-content-between mb-2">
//                       <Link to={`/profile/${f._id}`}>{f.name}</Link>
//                       <button className="btn btn-sm btn-outline-secondary"
//                         onClick={() => handleUnfollow(f._id)}>
//                         Unfollow
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </section>

//           {/* POSTS */}
//           <section style={styles.rightPanelCard}>
//             <h5>My Posts</h5>

//             {posts.length === 0 && <div>No posts yet.</div>}

//             {posts.map((post) =>
//               editingPostId === post._id ? (
//                 <div key={post._id} className="card p-3 mb-2">

//                   <textarea
//                     className="form-control mb-2"
//                     value={editText}
//                     onChange={(e) => setEditText(e.target.value)}
//                   />

//                   <strong>Edit Code Blocks:</strong>
//                   {editCodeBlocks.map((cb, idx) => (
//                     <div key={idx}>
//                       <input
//                         className="form-control my-1"
//                         value={cb.language}
//                         onChange={(e) => handleEditCodeChange(idx, "language", e.target.value)}
//                         placeholder="Language"
//                       />
//                       <textarea
//                         className="form-control my-1"
//                         value={cb.code}
//                         onChange={(e) => handleEditCodeChange(idx, "code", e.target.value)}
//                       />
//                     </div>
//                   ))}

//                   <strong>Edit Images:</strong>
//                   <input type="file" multiple className="form-control" onChange={handleImageChange} />

//                   <div className="mt-2">
//                     {editImages.map((img, idx) =>
//                       typeof img === "string" ? (
//                         <img key={idx} src={img} style={{ maxWidth: 100 }} />
//                       ) : (
//                         <span key={idx} className="badge bg-secondary me-1">{img.name}</span>
//                       )
//                     )}
//                   </div>

//                   <div className="mt-3 d-flex gap-2">
//                     <button className="btn btn-success btn-sm" onClick={() => saveEdit(post._id)}>
//                       <img src={SaveLogo} style={{ width: 16 }} />
//                     </button>
//                     <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>
//                       <img src={CancelLogo} style={{ width: 16 }} />
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div key={post._id} className="card p-3 mb-2">
//                   <p>{post.text}</p>

//                   {post.images?.map((img, idx) => (
//                     <img
//                       key={idx}
//                       src={img}
//                       style={{ maxWidth: 200, marginRight: 8, borderRadius: 6 }}
//                     />
//                   ))}

//                   {post.codeBlocks?.map((cb, idx) => (
//                     <pre key={idx} className="bg-light p-2 rounded">
//                       <b>{cb.language}</b>: {cb.code}
//                     </pre>
//                   ))}

//                   <div className="mt-2 d-flex gap-2">
//                     <button className="btn btn-outline-primary btn-sm" onClick={() => startEdit(post)}>
//                       <img src={EditLogo} style={{ width: 16 }} />
//                     </button>
//                     <button className="btn btn-outline-danger btn-sm" onClick={() => deletePost(post._id)}>
//                       <img src={DeleteLogo} style={{ width: 16 }} />
//                     </button>
//                   </div>
//                 </div>
//               )
//             )}
//           </section>

//         </main>
//       </div>
//     </div>
//   );
// }










// import React, { useContext, useEffect, useState } from "react";
// import { AuthContext } from "../contexts/AuthContext";
// import api from "../api/api";
// import { Link } from "react-router-dom";
// import { Bar, Line, Pie } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   Title,
//   Tooltip,
//   Legend,
//   BarElement,
//   LineElement,
//   PointElement,
//   ArcElement,
//   CategoryScale,
//   LinearScale,
// } from "chart.js";

// ChartJS.register(
//   Title,
//   Tooltip,
//   Legend,
//   BarElement,
//   LineElement,
//   PointElement,
//   ArcElement,
//   CategoryScale,
//   LinearScale
// );

// import CameraImage from "../assets/camera-regular-full.svg";
// import EditLogo from "../assets/edit.svg";
// import DeleteLogo from "../assets/delete.svg";
// import SaveLogo from "../assets/floppy-disk-regular-full.svg";
// import CancelLogo from "../assets/x-solid-full.svg";

// export default function Profile() {
//   const { user, setUser } = useContext(AuthContext);
//   const [enrollments, setEnrollments] = useState([]);
//   const [attempts, setAttempts] = useState([]);
//   const [showAnalytics, setShowAnalytics] = useState(false);
//   const [solvedProblems, setSolvedProblems] = useState([]);
//   const [allProblems, setAllProblems] = useState([]);
//   const [uploading, setUploading] = useState(false);
//   const [profileImage, setProfileImage] = useState(user?.profileImage);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [posts, setPosts] = useState([]);
//   const [editingPostId, setEditingPostId] = useState(null);
//   const [editText, setEditText] = useState("");
//   const [editCodeBlocks, setEditCodeBlocks] = useState([]);
//   const [followers, setFollowers] = useState([]);
//   const [following, setFollowing] = useState([]);
//   const [refresh, setRefresh] = useState(false);
//   const [editImages, setEditImages] = useState([]);

//   useEffect(() => {
//     if (user) {
//       api.get("/enrollments/mine").then((res) => setEnrollments(res.data));
//       api.get("/attempts/mine").then((res) => setAttempts(res.data));
//     }
//   }, [user]);

//   useEffect(() => {
//     if (user) {
//       api.get("/coding/submissions/me").then((res) => {
//         const solvedIds = [
//           ...new Set(
//             res.data
//               .filter((s) => s.result === "Accepted")
//               .map((s) => s.problem)
//           ),
//         ];
//         setSolvedProblems(solvedIds);
//       });
//       api.get("/coding/problems").then((res) => setAllProblems(res.data));
//     }
//   }, [user]);

//   // Load user posts
//   useEffect(() => {
//     if (user?._id) {
//       loadUserPosts();
//     }
//   }, [user?._id, refresh]);

//   const loadUserPosts = async () => {
//     try {
//       const res = await api.get(`/posts/user/${user._id}`);
//       setPosts(res.data || []);
//     } catch (err) {
//       console.error("Error loading user posts:", err);
//       setPosts([]);
//     }
//   };

//   // Load followers and following
//   useEffect(() => {
//     if (user?._id) {
//       api.get(`/users/${user._id}`).then((res) => {
//         setFollowers(res.data.followers || []);
//         setFollowing(res.data.following || []);
//       });
//     }
//   }, [user?._id, refresh]);

//   // Prepare analytics data
//   const examTitles = attempts.map((a) => a.exam?.title || "Exam");
//   const scores = attempts.map((a) => a.score);
//   const totals = attempts.map((a) => a.total || 0);
//   const passCount = attempts.filter((a) => a.score >= a.total * 0.4).length;
//   const failCount = attempts.length - passCount;

//   const handleEditCodeChange = (idx, field, value) => {
//     setEditCodeBlocks((prev) =>
//       prev.map((cb, i) => (i === idx ? { ...cb, [field]: value } : cb))
//     );
//   };

//   const handleFileSelect = (e) => {
//     if (e.target.files[0]) {
//       setSelectedFile(e.target.files[0]);
//       setProfileImage(URL.createObjectURL(e.target.files[0]));
//     }
//   };

//   const handleImageUpload = async () => {
//     if (!selectedFile) return;
//     setUploading(true);
//     const formData = new FormData();
//     formData.append("profileImage", selectedFile);
//     try {
//       const res = await api.put("/auth/profile/image", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       setProfileImage(res.data.profileImage);
//       setUser({ ...user, profileImage: res.data.profileImage });
//       setSelectedFile(null);
//     } catch (err) {
//       alert("Image upload failed");
//     }
//     setUploading(false);
//   };

//   const startEdit = (post) => {
//     setEditingPostId(post._id);
//     setEditText(post.text);
//     setEditCodeBlocks(post.codeBlocks || []);
//     setEditImages(post.images || []);
//   };

//   const handleImageChange = (e) => {
//     setEditImages(Array.from(e.target.files));
//   };

//   const saveEdit = async (postId) => {
//     const formData = new FormData();
//     formData.append("text", editText);
//     formData.append("codeBlocks", JSON.stringify(editCodeBlocks));
//     editImages.forEach((img) => formData.append("images", img));
//     try {
//       await api.put(`/posts/${postId}`, formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       setEditingPostId(null);
//       setEditText("");
//       setEditCodeBlocks([]);
//       setEditImages([]);
//       setRefresh((r) => !r);
//     } catch (err) {
//       alert("Failed to update post");
//     }
//   };

//   const cancelEdit = () => {
//     setEditingPostId(null);
//     setEditText("");
//     setEditCodeBlocks([]);
//   };

//   const deletePost = async (postId) => {
//     if (window.confirm("Are you sure you want to delete this post?")) {
//       try {
//         await api.delete(`/posts/${postId}`);
//         setPosts((prev) => prev.filter((p) => p._id !== postId));
//       } catch (err) {
//         alert("Failed to delete post");
//       }
//     }
//   };

//   const handleFollow = async (personId) => {
//     try {
//       await api.post(`/users/${personId}/follow`);
//       setRefresh((r) => !r);
//     } catch (err) {
//       console.error("Follow error:", err);
//     }
//   };

//   const handleUnfollow = async (personId) => {
//     try {
//       await api.post(`/users/${personId}/unfollow`);
//       setRefresh((r) => !r);
//     } catch (err) {
//       console.error("Unfollow error:", err);
//     }
//   };

//   return (
//     <div className="container py-4">
//       <h2 className="fw-bold mb-4">Profile</h2>

//       <div className="row">
//         {/* Left Column: Profile Info */}
//         <div className="col-lg-4 col-md-6 mb-4">
//           <div className="card shadow-sm p-4">
//             <div className="d-flex flex-column align-items-center mb-3">
//               <div style={{ position: "relative" }}>
//                 <img
//                   src={
//                     profileImage ||
//                     "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"
//                   }
//                   alt="Profile"
//                   className="rounded-circle border"
//                   style={{ width: 120, height: 120, objectFit: "cover" }}
//                 />
//                 <label
//                   htmlFor="profile-upload"
//                   className="btn btn-sm btn-outline-secondary"
//                   style={{
//                     position: "absolute",
//                     bottom: 0,
//                     right: 0,
//                     borderRadius: "50%",
//                   }}
//                 >
//                   <img
//                     src={CameraImage}
//                     alt="Upload"
//                     style={{ height: 18, width: 18 }}
//                   />
//                 </label>
//                 <input
//                   id="profile-upload"
//                   type="file"
//                   accept="image/*"
//                   style={{ display: "none" }}
//                   onChange={handleFileSelect}
//                   disabled={uploading}
//                 />
//               </div>

//               {selectedFile && (
//                 <button
//                   className="btn btn-primary btn-sm mt-2"
//                   onClick={handleImageUpload}
//                   disabled={uploading}
//                 >
//                   {uploading ? "Updating..." : "Update Photo"}
//                 </button>
//               )}
//             </div>

//             {user && (
//               <div className="text-center">
//                 <h5 className="fw-bold">{user.name || user.username}</h5>
//                 <p className="text-muted mb-1">{user.email}</p>
//                 <span className="badge bg-info text-dark">{user.role}</span>
//                 {user.college && <p className="small mt-2">{user.college}</p>}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Middle Column: Posts */}
//         <div className="col-lg-8 col-md-6">
//           <h4 className="fw-bold mb-3">My Posts ({posts.length})</h4>

//           {posts.length === 0 ? (
//             <div className="alert alert-info">No posts yet. Create one!</div>
//           ) : (
//             posts.map((post) => (
//               <div key={post._id} className="card shadow-sm mb-3 p-3">
//                 {editingPostId === post._id ? (
//                   // Edit Mode
//                   <div>
//                     <textarea
//                       className="form-control mb-2"
//                       rows="3"
//                       value={editText}
//                       onChange={(e) => setEditText(e.target.value)}
//                     />

//                     {editCodeBlocks.map((cb, idx) => (
//                       <div key={idx} className="mb-2 p-2 border rounded">
//                         <input
//                           type="text"
//                           className="form-control form-control-sm mb-1"
//                           placeholder="Language"
//                           value={cb.language}
//                           onChange={(e) =>
//                             handleEditCodeChange(
//                               idx,
//                               "language",
//                               e.target.value
//                             )
//                           }
//                         />
//                         <textarea
//                           className="form-control form-control-sm"
//                           rows="3"
//                           placeholder="Code"
//                           value={cb.code}
//                           onChange={(e) =>
//                             handleEditCodeChange(idx, "code", e.target.value)
//                           }
//                         />
//                       </div>
//                     ))}

//                     <input
//                       type="file"
//                       multiple
//                       className="form-control mb-2"
//                       onChange={handleImageChange}
//                     />

//                     <div className="d-flex gap-2">
//                       <button
//                         className="btn btn-success btn-sm"
//                         onClick={() => saveEdit(post._id)}
//                       >
//                         Save
//                       </button>
//                       <button
//                         className="btn btn-secondary btn-sm"
//                         onClick={cancelEdit}
//                       >
//                         Cancel
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   // View Mode
//                   <div>
//                     <div className="d-flex justify-content-between align-items-start mb-2">
//                       <div>
//                         <h6 className="fw-bold">{post.author?.name}</h6>
//                         <small className="text-muted">
//                           {new Date(post.createdAt).toLocaleDateString()}
//                         </small>
//                       </div>
//                       <div className="btn-group btn-group-sm">
//                         <button
//                           className="btn btn-outline-primary"
//                           onClick={() => startEdit(post)}
//                         >
//                           <img src={EditLogo} alt="Edit" style={{ width: 14 }} />
//                         </button>
//                         <button
//                           className="btn btn-outline-danger"
//                           onClick={() => deletePost(post._id)}
//                         >
//                           <img
//                             src={DeleteLogo}
//                             alt="Delete"
//                             style={{ width: 14 }}
//                           />
//                         </button>
//                       </div>
//                     </div>

//                     <p className="mb-2">{post.text}</p>

//                     {post.images && post.images.length > 0 && (
//                       <div className="mb-2">
//                         {post.images.map((img, idx) => (
//                           <img
//                             key={idx}
//                             src={img}
//                             alt="Post"
//                             style={{
//                               maxWidth: "100%",
//                               maxHeight: 200,
//                               marginRight: 5,
//                               marginBottom: 5,
//                               borderRadius: 4,
//                             }}
//                           />
//                         ))}
//                       </div>
//                     )}

//                     {post.codeBlocks && post.codeBlocks.length > 0 && (
//                       <div className="mb-2">
//                         {post.codeBlocks.map((cb, idx) => (
//                           <pre
//                             key={idx}
//                             className="bg-light p-2 rounded"
//                             style={{ fontSize: "12px" }}
//                           >
//                             <code>
//                               <strong>{cb.language}</strong>
//                               {"\n"}
//                               {cb.code}
//                             </code>
//                           </pre>
//                         ))}
//                       </div>
//                     )}

//                     <small className="text-muted">
//                       ❤️ {post.likes?.length || 0} likes
//                     </small>
//                   </div>
//                 )}
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {/* Courses Section */}
//       <div className="row mt-5">
//         <div className="col-lg-6 mb-4">
//           <h4 className="fw-bold">My Courses</h4>
//           <ul className="list-group">
//             {enrollments.length === 0 && (
//               <li className="list-group-item text-muted">
//                 No enrollments yet.
//               </li>
//             )}
//             {enrollments.map((en) => {
//               const expired = new Date(en.expiresAt) < new Date();
//               if (!en.course) return null;
//               return (
//                 <li
//                   key={en._id}
//                   className="list-group-item d-flex justify-content-between"
//                 >
//                   <Link to={`/courses/${en.course._id}`}>
//                     {en.course.title}
//                   </Link>
//                   {expired ? (
//                     <span className="badge bg-danger">Expired</span>
//                   ) : (
//                     <span className="badge bg-success">Active</span>
//                   )}
//                 </li>
//               );
//             })}
//           </ul>
//         </div>

//         <div className="col-lg-6 mb-4">
//           <h4 className="fw-bold">Solved Problems</h4>
//           <ul className="list-group">
//             {solvedProblems.length === 0 && (
//               <li className="list-group-item text-muted">
//                 No problems solved yet.
//               </li>
//             )}
//             {allProblems
//               .filter((p) => solvedProblems.includes(p._id))
//               .map((p) => (
//                 <li key={p._id} className="list-group-item">
//                   <Link to={`/coding/problems/${p._id}`}>{p.title}</Link>
//                 </li>
//               ))}
//           </ul>
//         </div>
//       </div>

//       {/* Performance & Followers */}
//       <div className="row mt-5">
//         <div className="col-lg-6 mb-4">
//           <h4 className="fw-bold">
//             Performance Tracking
//             <button
//               className="btn btn-outline-primary btn-sm ms-3"
//               onClick={() => setShowAnalytics((v) => !v)}
//             >
//               {showAnalytics ? "Hide" : "Show"}
//             </button>
//           </h4>
//           {!showAnalytics && (
//             <ul className="list-group">
//               {attempts.length === 0 && (
//                 <li className="list-group-item text-muted">
//                   No exam attempts yet.
//                 </li>
//               )}
//               {attempts.map((a) => (
//                 <li
//                   key={a._id}
//                   className="list-group-item d-flex justify-content-between"
//                 >
//                   <Link to={`/result/${a._id}`}>{a.exam?.title || "Exam"}</Link>
//                   <span>
//                     <b>{a.score}</b> / {a.total}
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>

//         <div className="col-lg-6 mb-4">
//           <h4 className="fw-bold">Followers ({followers.length})</h4>
//           <ul className="list-group">
//             {followers.length === 0 && (
//               <li className="list-group-item text-muted">No followers yet.</li>
//             )}
//             {followers.map((f) => (
//               <li
//                 key={f._id}
//                 className="list-group-item d-flex justify-content-between align-items-center"
//               >
//                 <Link to={`/profile/${f._id}`}>{f.name || f.username}</Link>
//                 <button
//                   className="btn btn-sm btn-warning"
//                   onClick={() => handleUnfollow(f._id)}
//                 >
//                   Unfollow
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </div>
//       </div>

//       {/* Analytics Charts */}
//       {showAnalytics && attempts.length > 0 && (
//         <div className="row mt-5">
//           <div className="col-lg-6 mb-4">
//             <div className="card p-3 shadow">
//               <h6 className="fw-bold text-center">Scores (Bar Chart)</h6>
//               <Bar
//                 data={{
//                   labels: examTitles,
//                   datasets: [
//                     {
//                       label: "Score",
//                       data: scores,
//                       backgroundColor: "#36A2EB",
//                     },
//                     {
//                       label: "Total",
//                       data: totals,
//                       backgroundColor: "#e0e0e0",
//                     },
//                   ],
//                 }}
//                 options={{
//                   responsive: true,
//                   plugins: { legend: { display: true } },
//                   scales: {
//                     y: { beginAtZero: true, max: Math.max(...totals, 10) },
//                   },
//                 }}
//               />
//             </div>
//           </div>
//           <div className="col-lg-6 mb-4">
//             <div className="card p-3 shadow">
//               <h6 className="fw-bold text-center">Pass vs Fail</h6>
//               <Pie
//                 data={{
//                   labels: ["Pass", "Fail"],
//                   datasets: [
//                     {
//                       data: [passCount, failCount],
//                       backgroundColor: ["#4CAF50", "#FF6384"],
//                     },
//                   ],
//                 }}
//                 options={{
//                   responsive: true,
//                   plugins: { legend: { display: true } },
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }











// import React, { useContext, useEffect, useState } from "react";
// import { AuthContext } from "../contexts/AuthContext";
// import api from "../api/api";
// import { Link } from "react-router-dom";
// import { Bar, Pie } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   Title,
//   Tooltip,
//   Legend,
//   BarElement,
//   ArcElement,
//   CategoryScale,
//   LinearScale,
// } from "chart.js";

// ChartJS.register(
//   Title,
//   Tooltip,
//   Legend,
//   BarElement,
//   ArcElement,
//   CategoryScale,
//   LinearScale
// );

// import CameraImage from "../assets/camera-regular-full.svg";
// import EditLogo from "../assets/edit.svg";
// import DeleteLogo from "../assets/delete.svg";

// export default function Profile() {
//   const { user, setUser } = useContext(AuthContext);
//   const [enrollments, setEnrollments] = useState([]);
//   const [attempts, setAttempts] = useState([]);
//   const [showAnalytics, setShowAnalytics] = useState(false);
//   const [solvedProblems, setSolvedProblems] = useState([]);
//   const [allProblems, setAllProblems] = useState([]);
//   const [uploading, setUploading] = useState(false);
//   const [profileImage, setProfileImage] = useState(user?.profileImage);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [posts, setPosts] = useState([]);
//   const [postsLoading, setPostsLoading] = useState(false);
//   const [editingPostId, setEditingPostId] = useState(null);
//   const [editText, setEditText] = useState("");
//   const [editCodeBlocks, setEditCodeBlocks] = useState([]);
//   const [followers, setFollowers] = useState([]);
//   const [following, setFollowing] = useState([]);
//   const [refresh, setRefresh] = useState(false);

//   // Load user enrollments and attempts
//   useEffect(() => {
//     if (user) {
//       api.get("/enrollments/mine").then((res) => setEnrollments(res.data || []));
//       api.get("/attempts/mine").then((res) => setAttempts(res.data || []));
//     }
//   }, [user]);

//   // Load coding analytics
//   useEffect(() => {
//     if (user) {
//       api
//         .get("/coding/submissions/me")
//         .then((res) => {
//           const solvedIds = [
//             ...new Set(
//               res.data
//                 .filter((s) => s.result === "Accepted")
//                 .map((s) => s.problem)
//             ),
//           ];
//           setSolvedProblems(solvedIds);
//         })
//         .catch(() => setSolvedProblems([]));

//       api
//         .get("/coding/problems")
//         .then((res) => setAllProblems(res.data || []))
//         .catch(() => setAllProblems([]));
//     }
//   }, [user]);

//   // Load user posts - THIS IS THE KEY FIX
//   useEffect(() => {
//     if (user?._id) {
//       loadUserPosts();
//     }
//   }, [user?._id, refresh]);

//   const loadUserPosts = async () => {
//     setPostsLoading(true);
//     try {
//       console.log("Fetching posts for user:", user._id);
//       const res = await api.get(`/posts/user/${user._id}`);
//       console.log("Posts received:", res.data);
//       setPosts(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.error("Error loading user posts:", err);
//       setPosts([]);
//     } finally {
//       setPostsLoading(false);
//     }
//   };

//   // Load followers/following
//   useEffect(() => {
//     if (user?._id) {
//       api
//         .get(`/users/${user._id}`)
//         .then((res) => {
//           setFollowers(res.data.followers || []);
//           setFollowing(res.data.following || []);
//         })
//         .catch(() => {
//           setFollowers([]);
//           setFollowing([]);
//         });
//     }
//   }, [user?._id, refresh]);

//   // Analytics data
//   const examTitles = attempts.map((a) => a.exam?.title || "Exam");
//   const scores = attempts.map((a) => a.score);
//   const totals = attempts.map((a) => a.total || 0);
//   const passCount = attempts.filter((a) => a.score >= a.total * 0.4).length;
//   const failCount = attempts.length - passCount;

//   const handleFileSelect = (e) => {
//     if (e.target.files[0]) {
//       setSelectedFile(e.target.files[0]);
//       setProfileImage(URL.createObjectURL(e.target.files[0]));
//     }
//   };

//   const handleImageUpload = async () => {
//     if (!selectedFile) return;
//     setUploading(true);
//     const formData = new FormData();
//     formData.append("profileImage", selectedFile);
//     try {
//       const res = await api.put("/auth/profile/image", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       setProfileImage(res.data.profileImage);
//       setUser({ ...user, profileImage: res.data.profileImage });
//       setSelectedFile(null);
//     } catch (err) {
//       console.error("Image upload error:", err);
//     }
//     setUploading(false);
//   };

//   const startEdit = (post) => {
//     setEditingPostId(post._id);
//     setEditText(post.text);
//     setEditCodeBlocks(post.codeBlocks || []);
//   };

//   const saveEdit = async (postId) => {
//     const formData = new FormData();
//     formData.append("text", editText);
//     formData.append("codeBlocks", JSON.stringify(editCodeBlocks));

//     try {
//       await api.put(`/posts/${postId}`, formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       setEditingPostId(null);
//       setEditText("");
//       setEditCodeBlocks([]);
//       setRefresh((r) => !r);
//     } catch (err) {
//       console.error("Update error:", err);
//     }
//   };

//   const cancelEdit = () => {
//     setEditingPostId(null);
//     setEditText("");
//     setEditCodeBlocks([]);
//   };

//   const deletePost = async (postId) => {
//     if (window.confirm("Delete this post?")) {
//       try {
//         await api.delete(`/posts/${postId}`);
//         setPosts((prev) => prev.filter((p) => p._id !== postId));
//       } catch (err) {
//         console.error("Delete error:", err);
//       }
//     }
//   };

//   const handleFollow = async (personId) => {
//     try {
//       await api.post(`/users/${personId}/follow`);
//       setRefresh((r) => !r);
//     } catch (err) {
//       console.error("Follow error:", err);
//     }
//   };

//   const handleUnfollow = async (personId) => {
//     try {
//       await api.post(`/users/${personId}/unfollow`);
//       setRefresh((r) => !r);
//     } catch (err) {
//       console.error("Unfollow error:", err);
//     }
//   };

//   return (
//     <div className="container py-4">
//       <h2 className="fw-bold mb-4">My Profile</h2>

//       <div className="row">
//         {/* LEFT COLUMN - Profile Info */}
//         <div className="col-lg-4 mb-4">
//           <div className="card shadow-sm p-4">
//             <div className="d-flex flex-column align-items-center mb-3">
//               <div style={{ position: "relative" }}>
//                 <img
//                   src={
//                     profileImage ||
//                     "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"
//                   }
//                   alt="Profile"
//                   className="rounded-circle border"
//                   style={{ width: 120, height: 120, objectFit: "cover" }}
//                 />
//                 <label
//                   htmlFor="profile-upload"
//                   className="btn btn-sm btn-outline-secondary"
//                   style={{
//                     position: "absolute",
//                     bottom: 0,
//                     right: 0,
//                     borderRadius: "50%",
//                   }}
//                 >
//                   <img
//                     src={CameraImage}
//                     alt="Upload"
//                     style={{ height: 18, width: 18 }}
//                   />
//                 </label>
//                 <input
//                   id="profile-upload"
//                   type="file"
//                   accept="image/*"
//                   style={{ display: "none" }}
//                   onChange={handleFileSelect}
//                   disabled={uploading}
//                 />
//               </div>

//               {selectedFile && (
//                 <button
//                   className="btn btn-primary btn-sm mt-2"
//                   onClick={handleImageUpload}
//                   disabled={uploading}
//                 >
//                   {uploading ? "Updating..." : "Update Photo"}
//                 </button>
//               )}
//             </div>

//             {user && (
//               <div className="text-center">
//                 <h5 className="fw-bold">{user.name || user.username}</h5>
//                 <p className="text-muted mb-1">{user.email}</p>
//                 <span className="badge bg-info text-dark">{user.role}</span>
//                 {user.college && <p className="small mt-2">{user.college}</p>}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* MIDDLE COLUMN - Posts */}
//         <div className="col-lg-8">
//           <h4 className="fw-bold mb-3">
//             My Posts ({posts.length})
//             {postsLoading && <span className="spinner-border spinner-border-sm ms-2"></span>}
//           </h4>

//           {posts.length === 0 && !postsLoading && (
//             <div className="alert alert-info">No posts yet. Create one!</div>
//           )}

//           {posts.map((post) => (
//             <div key={post._id} className="card shadow-sm mb-3 p-3">
//               {editingPostId === post._id ? (
//                 // Edit Mode
//                 <div>
//                   <textarea
//                     className="form-control mb-2"
//                     rows="3"
//                     value={editText}
//                     onChange={(e) => setEditText(e.target.value)}
//                   />
//                   <div className="d-flex gap-2">
//                     <button
//                       className="btn btn-success btn-sm"
//                       onClick={() => saveEdit(post._id)}
//                     >
//                       Save
//                     </button>
//                     <button
//                       className="btn btn-secondary btn-sm"
//                       onClick={cancelEdit}
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 // View Mode
//                 <div>
//                   <div className="d-flex justify-content-between align-items-start mb-2">
//                     <div>
//                       <h6 className="fw-bold">{post.author?.name}</h6>
//                       <small className="text-muted">
//                         {new Date(post.createdAt).toLocaleDateString()}
//                       </small>
//                     </div>
//                     <div className="btn-group btn-group-sm">
//                       <button
//                         className="btn btn-outline-primary"
//                         onClick={() => startEdit(post)}
//                       >
//                         <img src={EditLogo} alt="Edit" style={{ width: 14 }} />
//                       </button>
//                       <button
//                         className="btn btn-outline-danger"
//                         onClick={() => deletePost(post._id)}
//                       >
//                         <img
//                           src={DeleteLogo}
//                           alt="Delete"
//                           style={{ width: 14 }}
//                         />
//                       </button>
//                     </div>
//                   </div>

//                   <p className="mb-2">{post.text}</p>

//                   {post.images && post.images.length > 0 && (
//                     <div className="mb-2">
//                       {post.images.map((img, idx) => (
//                         <img
//                           key={idx}
//                           src={img}
//                           alt="Post"
//                           style={{
//                             maxWidth: "100%",
//                             maxHeight: 200,
//                             marginRight: 5,
//                             marginBottom: 5,
//                             borderRadius: 4,
//                           }}
//                         />
//                       ))}
//                     </div>
//                   )}

//                   {post.codeBlocks && post.codeBlocks.length > 0 && (
//                     <div className="mb-2">
//                       {post.codeBlocks.map((cb, idx) => (
//                         <pre
//                           key={idx}
//                           className="bg-light p-2 rounded"
//                           style={{ fontSize: "12px" }}
//                         >
//                           <code>
//                             <strong>{cb.language}</strong>
//                             {"\n"}
//                             {cb.code}
//                           </code>
//                         </pre>
//                       ))}
//                     </div>
//                   )}

//                   <small className="text-muted">
//                     ❤️ {post.likes?.length || 0} likes • 💬{" "}
//                     {post.comments?.length || 0} comments
//                   </small>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Courses Section */}
//       <div className="row mt-5">
//         <div className="col-lg-6 mb-4">
//           <h4 className="fw-bold">My Courses ({enrollments.length})</h4>
//           <ul className="list-group">
//             {enrollments.length === 0 && (
//               <li className="list-group-item text-muted">No enrollments yet.</li>
//             )}
//             {enrollments.map((en) => {
//               const expired = new Date(en.expiresAt) < new Date();
//               if (!en.course) return null;
//               return (
//                 <li
//                   key={en._id}
//                   className="list-group-item d-flex justify-content-between"
//                 >
//                   <Link to={`/courses/${en.course._id}`}>
//                     {en.course.title}
//                   </Link>
//                   {expired ? (
//                     <span className="badge bg-danger">Expired</span>
//                   ) : (
//                     <span className="badge bg-success">Active</span>
//                   )}
//                 </li>
//               );
//             })}
//           </ul>
//         </div>

//         <div className="col-lg-6 mb-4">
//           <h4 className="fw-bold">Solved Problems ({solvedProblems.length})</h4>
//           <ul className="list-group">
//             {solvedProblems.length === 0 && (
//               <li className="list-group-item text-muted">
//                 No problems solved yet.
//               </li>
//             )}
//             {allProblems
//               .filter((p) => solvedProblems.includes(p._id))
//               .map((p) => (
//                 <li key={p._id} className="list-group-item">
//                   <Link to={`/coding/problems/${p._id}`}>{p.title}</Link>
//                 </li>
//               ))}
//           </ul>
//         </div>
//       </div>

//       {/* Performance & Followers */}
//       <div className="row mt-5">
//         <div className="col-lg-6 mb-4">
//           <h4 className="fw-bold">
//             Performance ({attempts.length})
//             <button
//               className="btn btn-outline-primary btn-sm ms-3"
//               onClick={() => setShowAnalytics((v) => !v)}
//             >
//               {showAnalytics ? "Hide" : "Show"}
//             </button>
//           </h4>
//           {!showAnalytics && (
//             <ul className="list-group">
//               {attempts.length === 0 && (
//                 <li className="list-group-item text-muted">
//                   No exam attempts yet.
//                 </li>
//               )}
//               {attempts.map((a) => (
//                 <li
//                   key={a._id}
//                   className="list-group-item d-flex justify-content-between"
//                 >
//                   <Link to={`/result/${a._id}`}>{a.exam?.title || "Exam"}</Link>
//                   <span>
//                     <b>{a.score}</b> / {a.total}
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>

//         <div className="col-lg-6 mb-4">
//           <h4 className="fw-bold">Followers ({followers.length})</h4>
//           <ul className="list-group">
//             {followers.length === 0 && (
//               <li className="list-group-item text-muted">No followers yet.</li>
//             )}
//             {followers.map((f) => (
//               <li
//                 key={f._id}
//                 className="list-group-item d-flex justify-content-between align-items-center"
//               >
//                 <Link to={`/profile/${f._id}`}>{f.name || f.username}</Link>
//                 <button
//                   className="btn btn-sm btn-warning"
//                   onClick={() => handleUnfollow(f._id)}
//                 >
//                   Unfollow
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </div>
//       </div>

//       {/* Analytics Charts */}
//       {showAnalytics && attempts.length > 0 && (
//         <div className="row mt-5">
//           <div className="col-lg-6 mb-4">
//             <div className="card p-3 shadow">
//               <h6 className="fw-bold text-center">Scores (Bar Chart)</h6>
//               <Bar
//                 data={{
//                   labels: examTitles,
//                   datasets: [
//                     {
//                       label: "Score",
//                       data: scores,
//                       backgroundColor: "#36A2EB",
//                     },
//                     {
//                       label: "Total",
//                       data: totals,
//                       backgroundColor: "#e0e0e0",
//                     },
//                   ],
//                 }}
//                 options={{
//                   responsive: true,
//                   plugins: { legend: { display: true } },
//                   scales: {
//                     y: { beginAtZero: true, max: Math.max(...totals, 10) },
//                   },
//                 }}
//               />
//             </div>
//           </div>
//           <div className="col-lg-6 mb-4">
//             <div className="card p-3 shadow">
//               <h6 className="fw-bold text-center">Pass vs Fail</h6>
//               <Pie
//                 data={{
//                   labels: ["Pass", "Fail"],
//                   datasets: [
//                     {
//                       data: [passCount, failCount],
//                       backgroundColor: ["#4CAF50", "#FF6384"],
//                     },
//                   ],
//                 }}
//                 options={{
//                   responsive: true,
//                   plugins: { legend: { display: true } },
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }