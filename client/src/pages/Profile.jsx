import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaBookOpen, FaCamera, FaChartLine, FaCode, FaEdit, FaFlask, FaGraduationCap, FaSave, FaShieldAlt, FaTrash, FaTimes, FaUsers } from "react-icons/fa";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { AuthContext } from "../contexts/AuthContext";
import api from "../api/api";
import { optimizedImageUrl } from "../utils/imageUrl";
import "./Profile.css";
import "./ProfileContributions.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const DEFAULT_AVATAR = "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png";

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [enrollments, setEnrollments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [codingSubmissions, setCodingSubmissions] = useState([]);
  const [profileImage, setProfileImage] = useState(user?.profileImage);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ name: "", college: "", degree: "", yearOfPassing: "" });
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editCodeBlocks, setEditCodeBlocks] = useState([]);
  const [editImages, setEditImages] = useState([]);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfileImage(user.profileImage || "");
    setProfileDraft({ name: user.name || "", college: user.college || "", degree: user.degree || "", yearOfPassing: user.yearOfPassing || "" });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      api.get("/enrollments/my"),
      api.get("/attempts/my"),
      api.get("/coding/submissions/my"),
      api.get(`/posts/user/${user._id}`, { params: { page: 1, limit: 20 } }),
      api.get(`/users/${user._id}`),
    ]).then(([enrollmentResult, attemptResult, submissionsResult, postsResult, userResult]) => {
      if (enrollmentResult.status === "fulfilled") setEnrollments(enrollmentResult.value.data || []);
      if (attemptResult.status === "fulfilled") setAttempts(attemptResult.value.data || []);
      if (submissionsResult.status === "fulfilled") {
        const submissions = submissionsResult.value.data || [];
        setCodingSubmissions(submissions);
        const accepted = submissions.filter((submission) => submission.result === "Accepted").map((submission) => submission.problem);
        setSolvedProblems([...new Set(accepted)]);
      }
      if (postsResult.status === "fulfilled") setPosts(postsResult.value.data || []);
      if (userResult.status === "fulfilled") {
        setFollowers(userResult.value.data?.followers || []);
        setFollowing(userResult.value.data?.following || []);
      }
    });
  }, [user, refresh]);

  const examMetrics = useMemo(() => {
    const scored = attempts.filter((attempt) => Number(attempt.total) > 0);
    const totalScore = scored.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0);
    const totalPossible = scored.reduce((sum, attempt) => sum + Number(attempt.total || 0), 0);
    const passCount = scored.filter((attempt) => Number(attempt.score || 0) >= Number(attempt.total || 0) * 0.4).length;
    return { average: totalPossible ? Math.round((totalScore / totalPossible) * 100) : 0, passRate: scored.length ? Math.round((passCount / scored.length) * 100) : 0 };
  }, [attempts]);

  const profileStats = [
    { label: "Enrolled courses", value: enrollments.length, icon: FaBookOpen, tone: "blue" },
    { label: "Problems solved", value: solvedProblems.length, icon: FaCode, tone: "green" },
    { label: "Exam attempts", value: attempts.length, icon: FaFlask, tone: "orange" },
    { label: "Followers", value: followers.length, icon: FaUsers, tone: "purple" },
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setProfileImage(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("profileImage", selectedFile);
    try {
      const response = await api.post("/auth/profile-image", formData, { onUploadProgress: (event) => event.total && setUploadProgress(Math.min(99, Math.round((event.loaded * 100) / event.total))) });
      setUploadProgress(100);
      setProfileImage(response.data.profileImage);
      setUser?.({ ...user, profileImage: response.data.profileImage });
      setSelectedFile(null);
    } catch (error) {
      alert(error.response?.data?.error || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const response = await api.put("/users/profile", profileDraft);
      setUser?.({ ...user, ...(response.data.user || profileDraft) });
      setEditingProfile(false);
    } catch (error) {
      alert(error.response?.data?.error || "Could not update profile");
    }
  };

  const startEdit = (post) => { setEditingPostId(post._id); setEditText(post.text || ""); setEditCodeBlocks(post.codeBlocks || []); setEditImages(post.images || []); };
  const handleEditCodeChange = (index, field, value) => setEditCodeBlocks((current) => current.map((block, i) => i === index ? { ...block, [field]: value } : block));
  const saveEdit = async (postId) => {
    const data = new FormData();
    data.append("text", editText);
    data.append("codeBlocks", JSON.stringify(editCodeBlocks));
    editImages.forEach((image) => { if (image instanceof File) data.append("images", image); });
    try {
      const response = await api.put(`/posts/${postId}`, data);
      setPosts((current) => current.map((post) => post._id === postId ? response.data : post));
      setEditingPostId(null);
    } catch (error) {
      alert(error.response?.data?.error || "Could not save post");
    }
  };
  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    await api.delete(`/posts/${postId}`);
    setPosts((current) => current.filter((post) => post._id !== postId));
  };
  const handleFollow = async (personId) => { await api.post(`/users/follow/${personId}`); setRefresh((value) => !value); };
  const handleUnfollow = async (personId) => { await api.post(`/users/unfollow/${personId}`); setRefresh((value) => !value); };

  const examChartData = { labels: attempts.slice(-8).map((attempt) => attempt.exam?.title?.slice(0, 14) || "Exam"), datasets: [{ label: "Score", data: attempts.slice(-8).map((attempt) => attempt.score || 0), borderColor: "#0078d4", backgroundColor: "rgba(0,120,212,.12)", tension: .35, fill: true }] };
  const courseProgress = (enrollment) => Math.min(100, Math.max(0, Number(enrollment.progress ?? enrollment.progressPercentage ?? enrollment.course?.progress ?? 0)));
  const contributionData = useMemo(() => {
    const counts = new Map();
    codingSubmissions.forEach((submission) => {
      const timestamp = submission.createdAt || submission.submittedAt || submission.updatedAt;
      const date = timestamp ? new Date(timestamp) : null;
      if (!date || Number.isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    enrollments.forEach((enrollment) => {
      if (Number(enrollment.progress) < 100 || !enrollment.completedAt) return;
      const key = new Date(enrollment.completedAt).toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const cells = Array.from({ length: 364 }, (_, index) => {
      const date = new Date(end);
      date.setDate(end.getDate() - (363 - index));
      const key = date.toISOString().slice(0, 10);
      return { key, date, count: counts.get(key) || 0 };
    });
    const max = Math.max(...cells.map((cell) => cell.count), 0);
    let currentStreak = 0;
    for (let index = cells.length - 1; index >= 0 && cells[index].count > 0; index -= 1) currentStreak += 1;
    return { cells, max, total: codingSubmissions.length, activeDays: cells.filter((cell) => cell.count > 0).length, currentStreak };
  }, [codingSubmissions, enrollments]);

  return (
    <div className="cc-profile-shell">
      <div className="cc-profile-heading"><div><span className="cc-profile-eyebrow">Code Campus identity</span><h1>My professional profile</h1><p>Track your learning, coding activity, assessments, and community presence.</p></div><Link className="cc-profile-action" to="/courses"><FaGraduationCap /> Explore learning</Link></div>
      <div className="cc-profile-layout">
        <aside className="cc-profile-sidebar">
          <section className="cc-profile-identity cc-profile-card">
            <div className="cc-profile-cover" />
            <div className="cc-profile-avatar-wrap"><img className="cc-profile-avatar" src={optimizedImageUrl(profileImage || DEFAULT_AVATAR, 400)} alt="Profile" /><label htmlFor="profile-upload" className="cc-profile-camera" title="Change profile photo"><FaCamera /></label><input id="profile-upload" type="file" accept="image/*" onChange={handleFileSelect} disabled={uploading} /></div>
            <div className="cc-profile-identity-body"><h2>{user?.name || user?.username}</h2><span className="cc-profile-handle">@{user?.username}</span><span className="cc-profile-email">{user?.email}</span><div className="cc-profile-role">{user?.role || "Student"}</div><p>{user?.bio || "Build your professional learning identity across courses, exams, and coding practice."}</p>
              {selectedFile && <div className="cc-profile-upload"><div><span>{uploading ? "Uploading photo" : "Photo ready"}</span><strong>{uploadProgress}%</strong></div><div className="cc-profile-progress"><i style={{ width: `${Math.max(uploadProgress, selectedFile ? 8 : 0)}%` }} /></div><button onClick={handleImageUpload} disabled={uploading}>{uploading ? "Uploading…" : "Update photo"}</button></div>}
              <div className="cc-profile-actions"><button onClick={() => setEditingProfile(true)}><FaEdit /> Edit profile</button><button onClick={() => setShowAnalytics((value) => !value)}><FaChartLine /> {showAnalytics ? "Hide analytics" : "Analytics"}</button></div>
            </div>
          </section>
          <section className="cc-profile-card cc-profile-specialties"><div className="cc-profile-section-title"><h2>Verified specialties</h2><span>Learning signals</span></div><div className="cc-profile-tags"><span><FaCode /> Problem solving</span><span><FaBookOpen /> {user?.degree || "Technical learning"}</span><span><FaShieldAlt /> {user?.role || "Learner"}</span><span><FaGraduationCap /> {user?.college || "Code Campus"}</span></div></section>
          <section className="cc-profile-card cc-profile-network"><div className="cc-profile-tabs"><span>Followers ({followers.length})</span><span>Following ({following.length})</span></div><div className="cc-profile-people">{[...followers, ...following].slice(0, 6).map((person, index) => <div key={`${person._id}-${index}`}><img src={optimizedImageUrl(person.profileImage || DEFAULT_AVATAR, 80)} alt="" /><Link to={`/profile/${person._id}`}>{person.name || person.username}</Link><button onClick={() => (followers.some((item) => item._id === person._id) ? handleUnfollow(person._id) : handleFollow(person._id))}>{followers.some((item) => item._id === person._id) ? "Following" : "Follow back"}</button></div>)}</div>{!followers.length && !following.length && <p className="cc-profile-muted">Connect with other learners to grow your network.</p>}</section>
        </aside>

        <main className="cc-profile-main">
          <section className="cc-profile-card cc-profile-metrics"><div className="cc-profile-section-title"><div><h2>Engineering performance &amp; learning metrics</h2><span>Updated from your Code Campus activity</span></div><span className="cc-live-status"><i /> Live profile</span></div><div className="cc-profile-stat-grid">{profileStats.map((stat) => { const StatIcon = stat.icon; return <div className={`cc-profile-stat ${stat.tone}`} key={stat.label}><StatIcon /><small>{stat.label}</small><strong>{stat.value}</strong><span>{stat.label === "Exam attempts" ? `${examMetrics.passRate}% pass rate` : stat.label === "Problems solved" ? "Accepted solutions" : "Active records"}</span></div>; })}</div><div className="cc-profile-quality"><div><span>Assessment quality</span><strong>{examMetrics.average ? `${examMetrics.average}% average score` : "Build your first score"}</strong></div><div className="cc-profile-quality-track"><i style={{ width: `${examMetrics.average}%` }} /></div></div></section>

          <section className="cc-profile-card cc-profile-contributions"><div className="cc-profile-section-title"><div><h2>Learning &amp; coding contributions</h2><span>Course completions and coding activity over the last 12 months</span></div><span className="cc-live-status"><i /> Activity tracked</span></div><div className="cc-contribution-summary"><div><strong>{contributionData.total + enrollments.filter((enrollment) => Number(enrollment.progress) === 100).length}</strong><span>Total contributions</span></div><div><strong>{contributionData.activeDays}</strong><span>Active days</span></div><div><strong>{contributionData.currentStreak}</strong><span>Current streak</span></div></div><div className="cc-contribution-wrap"><div className="cc-contribution-months"><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span></div><div className="cc-contribution-grid" aria-label="Learning and coding contribution graph">{contributionData.cells.map((cell) => { const level = cell.count === 0 ? 0 : Math.min(4, Math.ceil((cell.count / Math.max(contributionData.max, 1)) * 4)); return <span key={cell.key} className={`cc-contribution-cell level-${level}`} title={`${cell.count} contribution${cell.count === 1 ? "" : "s"} on ${cell.date.toLocaleDateString()}`} />; })}</div><div className="cc-contribution-legend"><span>Less</span><i className="level-0" /><i className="level-1" /><i className="level-2" /><i className="level-3" /><i className="level-4" /><span>More</span></div></div></section>

          <section className="cc-profile-card cc-profile-learning"><div className="cc-profile-section-title"><div><h2>Enrolled courses &amp; active learning tracks</h2><span>{enrollments.length} tracks connected to your profile</span></div><Link to="/courses">View courses <FaArrowRight /></Link></div>{enrollments.length === 0 ? <div className="cc-profile-empty"><FaBookOpen /><span>No courses yet. Start a learning track to see progress here.</span><Link to="/courses">Browse courses</Link></div> : <div className="cc-profile-course-list">{enrollments.slice(0, 5).map((enrollment) => { const progress = courseProgress(enrollment); const expired = enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date(); return <div className="cc-profile-course" key={enrollment._id}><div className="cc-profile-course-top"><div><Link to={`/courses/${enrollment.course?._id}`}>{enrollment.course?.title || "Course"}</Link><span>{enrollment.course?.subtitle || "Structured learning path"}</span></div><b className={expired ? "expired" : "active"}>{expired ? "Expired" : `${progress}% complete`}</b></div><div className="cc-profile-course-bar"><i className={expired ? "expired" : ""} style={{ width: `${progress}%` }} /></div><div className="cc-profile-course-bottom"><span>{expired ? "Renew access to continue" : "Keep building momentum"}</span><Link to={`/courses/${enrollment.course?._id}`}>Resume learning <FaArrowRight /></Link></div></div>; })}</div>}</section>

          {showAnalytics && <section className="cc-profile-card cc-profile-analytics"><div className="cc-profile-section-title"><div><h2>Assessment performance</h2><span>Recent exam scores and consistency</span></div><span className="cc-profile-kpi">{examMetrics.average}% avg.</span></div>{attempts.length ? <div className="cc-profile-chart"><Line data={examChartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} /></div> : <div className="cc-profile-empty"><FaChartLine /><span>Complete an exam to unlock performance analytics.</span></div>}</section>}

          <section className="cc-profile-card cc-profile-posts"><div className="cc-profile-section-title"><div><h2>Recent code snippets &amp; feed posts</h2><span>Your latest contributions to the learning community</span></div><Link to="/">Open feed <FaArrowRight /></Link></div>{posts.length === 0 ? <div className="cc-profile-empty"><FaCode /><span>No posts yet. Share your first idea with the community.</span><Link to="/">Open dashboard</Link></div> : <div className="cc-profile-post-list">{posts.slice(0, 8).map((post) => editingPostId === post._id ? <div className="cc-profile-edit-post" key={post._id}><textarea value={editText} onChange={(event) => setEditText(event.target.value)} /><div>{editCodeBlocks.map((block, index) => <div key={index}><input value={block.language} onChange={(event) => handleEditCodeChange(index, "language", event.target.value)} /><textarea value={block.code} onChange={(event) => handleEditCodeChange(index, "code", event.target.value)} /></div>)}</div><input type="file" multiple accept="image/*" onChange={(event) => setEditImages((event.target.files && Array.from(event.target.files)) || [])} /><div className="cc-profile-edit-actions"><button onClick={() => saveEdit(post._id)}><FaSave /> Save</button><button onClick={() => setEditingPostId(null)}><FaTimes /> Cancel</button></div></div> : <article className="cc-profile-post" key={post._id}><div className="cc-profile-post-head"><span><FaCode /> {post.codeBlocks?.length ? "Code snippet" : "Community post"}</span><time>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Recently"}</time></div><p>{post.text || "Shared a coding update with the community."}</p>{post.images?.length > 0 && <div className="cc-profile-post-images">{post.images.slice(0, 3).map((image) => <img key={image} src={optimizedImageUrl(image, 700)} alt="Post attachment" />)}</div>}{post.codeBlocks?.slice(0, 1).map((block) => <pre key={block.code}><code>{block.code}</code></pre>)}<div className="cc-profile-post-actions"><button onClick={() => startEdit(post)}><FaEdit /> Edit</button><button onClick={() => deletePost(post._id)}><FaTrash /> Delete</button></div></article>)}</div>}</section>
        </main>
      </div>

      {editingProfile && <div className="cc-profile-modal-backdrop" onClick={() => setEditingProfile(false)}><div className="cc-profile-modal" onClick={(event) => event.stopPropagation()}><div className="cc-profile-modal-head"><h2>Edit profile</h2><button onClick={() => setEditingProfile(false)}><FaTimes /></button></div>{Object.entries({ name: "Full name", college: "College / organization", degree: "Degree / specialization", yearOfPassing: "Year of passing" }).map(([field, label]) => <label key={field}>{label}<input value={profileDraft[field]} onChange={(event) => setProfileDraft((current) => ({ ...current, [field]: event.target.value }))} /></label>)}<div className="cc-profile-modal-actions"><button onClick={() => setEditingProfile(false)}>Cancel</button><button onClick={saveProfile}><FaSave /> Save profile</button></div></div></div>}
    </div>
  );
}
