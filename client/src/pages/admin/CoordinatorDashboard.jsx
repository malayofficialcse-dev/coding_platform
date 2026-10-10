import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import "./CoordinatorDashboard.css";

// ── Role Meta ──────────────────────────────────────────────────────────────
const ROLE_META = {
  exam_coordinator: {
    title:       "Exam Coordinator Panel",
    description: "Manage exams, view results and performance analytics",
    icon:        "📋",
    color:       "#8b5cf6",
    gradient:    "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  },
  course_coordinator: {
    title:       "Course Coordinator Panel",
    description: "Create and manage courses, content and enrollments",
    icon:        "📚",
    color:       "#059669",
    gradient:    "linear-gradient(135deg, #059669, #047857)",
  },
  feed_coordinator: {
    title:       "Feed Coordinator Panel",
    description: "Moderate posts, manage community content and announcements",
    icon:        "📰",
    color:       "#d97706",
    gradient:    "linear-gradient(135deg, #d97706, #b45309)",
  },
};

// ── Module Link Cards ──────────────────────────────────────────────────────
function ModuleCard({ title, description, icon, to, canCreate, canEdit, canDelete, accentColor }) {
  return (
    <div className="cd-module-card" style={{ "--accent": accentColor }}>
      <div className="cd-module-icon">{icon}</div>
      <div className="cd-module-info">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="cd-module-perms">
          <span className={`cd-perm-chip ${canCreate ? "on" : "off"}`}>Create</span>
          <span className={`cd-perm-chip ${canEdit   ? "on" : "off"}`}>Edit</span>
          <span className={`cd-perm-chip ${canDelete ? "on" : "off"}`}>Delete</span>
        </div>
      </div>
      <Link to={to} className="cd-module-link">Open →</Link>
    </div>
  );
}

// ── Stat Mini Card ─────────────────────────────────────────────────────────
function MiniStat({ label, value, icon }) {
  return (
    <div className="cd-mini-stat">
      <span className="cd-mini-icon">{icon}</span>
      <span className="cd-mini-value">{value ?? "—"}</span>
      <span className="cd-mini-label">{label}</span>
    </div>
  );
}

// ── Exam Coordinator Dashboard ──────────────────────────────────────────────
function ExamCoordinatorDash({ perm }) {
  const [exams, setExams] = useState([]);
  const [stats, setStats] = useState({});
  useEffect(() => {
    api.get("/exams").then(r => setExams(r.data?.slice(0, 8) || [])).catch(() => {});
  }, []);

  return (
    <>
      <div className="cd-stats-row">
        <MiniStat label="Total Exams"     value={exams.length} icon="📋" />
        <MiniStat label="Active Exams"    value={exams.filter(e => e.isPublished).length} icon="✅" />
        <MiniStat label="Draft Exams"     value={exams.filter(e => !e.isPublished).length} icon="📝" />
      </div>

      <div className="cd-quick-actions">
        {perm?.exams?.create && (
          <Link to="/admin/create" className="cd-action-btn cd-action-primary">+ Create Exam</Link>
        )}
        <Link to="/admin/exams" className="cd-action-btn cd-action-secondary">View All Exams</Link>
        <Link to="/admin/analytics" className="cd-action-btn cd-action-secondary">Analytics</Link>
      </div>

      <h3 className="cd-section-title">Recent Exams</h3>
      <div className="cd-table-wrap">
        <table className="cd-table">
          <thead>
            <tr><th>Title</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {exams.length === 0 && (
              <tr><td colSpan={3} className="cd-empty">No exams yet.</td></tr>
            )}
            {exams.map(ex => (
              <tr key={ex._id}>
                <td className="cd-td-bold">{ex.title}</td>
                <td>
                  <span className={`cd-status ${ex.isPublished ? "published" : "draft"}`}>
                    {ex.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="cd-td-actions">
                  {perm?.exams?.edit && (
                    <Link to={`/admin/exams/${ex._id}`} className="cd-table-btn">Edit</Link>
                  )}
                  <Link to={`/admin/exams/${ex._id}/analytics`} className="cd-table-btn cd-table-btn-ghost">Analytics</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Course Coordinator Dashboard ────────────────────────────────────────────
function CourseCoordinatorDash({ perm }) {
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    api.get("/courses").then(r => setCourses(r.data?.slice(0, 8) || [])).catch(() => {});
  }, []);

  return (
    <>
      <div className="cd-stats-row">
        <MiniStat label="Total Courses"   value={courses.length} icon="📚" />
        <MiniStat label="Published"       value={courses.filter(c => c.isPublished).length} icon="✅" />
        <MiniStat label="Drafts"          value={courses.filter(c => !c.isPublished).length} icon="📝" />
      </div>

      <div className="cd-quick-actions">
        {perm?.courses?.create && (
          <Link to="/admin/courses/create" className="cd-action-btn cd-action-primary">+ Create Course</Link>
        )}
        <Link to="/admin/courses" className="cd-action-btn cd-action-secondary">View All Courses</Link>
      </div>

      <h3 className="cd-section-title">Recent Courses</h3>
      <div className="cd-table-wrap">
        <table className="cd-table">
          <thead>
            <tr><th>Title</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {courses.length === 0 && (
              <tr><td colSpan={3} className="cd-empty">No courses yet.</td></tr>
            )}
            {courses.map(c => (
              <tr key={c._id}>
                <td className="cd-td-bold">{c.title}</td>
                <td>
                  <span className={`cd-status ${c.isPublished ? "published" : "draft"}`}>
                    {c.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="cd-td-actions">
                  {perm?.courses?.edit && (
                    <Link to={`/admin/courses/${c._id}/edit`} className="cd-table-btn">Edit</Link>
                  )}
                  {perm?.courses?.edit && (
                    <Link to={`/admin/courses/${c._id}/content`} className="cd-table-btn cd-table-btn-ghost">Content</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Feed Coordinator Dashboard ──────────────────────────────────────────────
function FeedCoordinatorDash({ perm }) {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    api.get("/posts").then(r => {
      const data = Array.isArray(r.data) ? r.data : (r.data?.posts || []);
      setPosts(data.slice(0, 8));
    }).catch(() => {});
  }, []);

  return (
    <>
      <div className="cd-stats-row">
        <MiniStat label="Total Posts"  value={posts.length} icon="📰" />
        <MiniStat label="This Week"    value={posts.filter(p => {
          const d = new Date(p.createdAt);
          return (Date.now() - d.getTime()) < 7 * 86400000;
        }).length} icon="🗓️" />
      </div>

      <div className="cd-quick-actions">
        {perm?.feed?.create && (
          <Link to="/profile" className="cd-action-btn cd-action-primary">+ New Post</Link>
        )}
        {perm?.feed?.delete && (
          <Link to="/admin/post-control" className="cd-action-btn cd-action-secondary">Manage Posts</Link>
        )}
      </div>

      <h3 className="cd-section-title">Recent Posts</h3>
      <div className="cd-table-wrap">
        <table className="cd-table">
          <thead>
            <tr><th>Content</th><th>Author</th><th>Date</th></tr>
          </thead>
          <tbody>
            {posts.length === 0 && (
              <tr><td colSpan={3} className="cd-empty">No posts yet.</td></tr>
            )}
            {posts.map(p => (
              <tr key={p._id}>
                <td className="cd-td-truncate">{p.content?.slice(0, 60) || "—"}{p.content?.length > 60 ? "…" : ""}</td>
                <td>{p.author?.name || "—"}</td>
                <td className="cd-td-date">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function CoordinatorDashboard() {
  const { user } = useContext(AuthContext);
  const meta    = ROLE_META[user?.role] || ROLE_META.exam_coordinator;
  const perm    = user?.permissions || {};

  return (
    <div className="cd-panel">
      {/* Role Banner */}
      <div className="cd-banner" style={{ background: meta.gradient }}>
        <div className="cd-banner-icon">{meta.icon}</div>
        <div>
          <div className="cd-banner-label">Your Dashboard</div>
          <h1 className="cd-banner-title">{meta.title}</h1>
          <p className="cd-banner-sub">{meta.description}</p>
        </div>
        <div className="cd-banner-user">
          <div className="cd-banner-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="cd-banner-name">{user?.name}</div>
            <div className="cd-banner-role">{meta.title.split(" ")[0]} {meta.title.split(" ")[1]}</div>
          </div>
        </div>
      </div>

      <div className="cd-body">
        {user?.role === "exam_coordinator"   && <ExamCoordinatorDash   perm={perm} />}
        {user?.role === "course_coordinator" && <CourseCoordinatorDash perm={perm} />}
        {user?.role === "feed_coordinator"   && <FeedCoordinatorDash   perm={perm} />}
      </div>
    </div>
  );
}
