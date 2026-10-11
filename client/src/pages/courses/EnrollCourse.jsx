import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import {
  FaBookOpen,
  FaShieldAlt,
  FaGraduationCap,
  FaCheckCircle,
  FaClock,
  FaLayerGroup,
  FaLock,
  FaArrowRight,
} from "react-icons/fa";
import { optimizedImageUrl } from "../../utils/imageUrl";
import "./Courses.css";

export default function EnrollCourse() {
  const { id } = useParams(); // courseId
  const [course, setCourse] = useState(null);
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [existingEnrollment, setExistingEnrollment] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const nav = useNavigate();
  const { user } = useContext(AuthContext);

  const isAdmin = user && ["admin", "super_admin"].includes(user.role);

  useEffect(() => {
    if (!user) {
      nav("/login");
    }
  }, [user, nav]);

  useEffect(() => {
    api
      .get(`/courses/${id}`)
      .then((res) => setCourse(res.data))
      .catch((err) => console.error("Failed to load course:", err));
  }, [id]);

  // Pre-check enrollment status
  useEffect(() => {
    if (!user) return;

    if (isAdmin) {
      setCheckingEnrollment(false);
      return;
    }

    api
      .get("/enrollments/my")
      .then((res) => {
        const found = (res.data || []).find((e) => {
          const cId = e.course?._id || e.course;
          return String(cId) === String(id);
        });

        if (found) {
          setExistingEnrollment(found);
          const expired = found.expiresAt ? new Date(found.expiresAt) < new Date() : false;
          setIsExpired(expired);
          // If actively enrolled and NOT expired, send straight to the course!
          if (!expired) {
            nav(`/courses/${id}`, { replace: true });
          }
        }
      })
      .catch((error) => {
        console.error("Failed to check course enrollment:", error);
      })
      .finally(() => setCheckingEnrollment(false));
  }, [user, id, nav, isAdmin]);

  const enroll = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/enrollments", { courseId: id, days });
      // Successfully enrolled or renewed - navigate directly to the course!
      nav(`/courses/${id}`, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Enrollment failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (checkingEnrollment || !course) {
    return (
      <div className="cc-courses-shell">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3 text-muted">Checking enrollment credentials...</p>
        </div>
      </div>
    );
  }

  // Admin already has full course access
  if (isAdmin) {
    return (
      <div className="cc-courses-shell">
        <div className="cc-courses-heading">
          <div>
            <span className="cc-courses-eyebrow">Administrative Access</span>
            <h1>{course.title}</h1>
            <p>You have unrestricted administrative privileges across this course curriculum.</p>
          </div>
          <Link to="/courses" className="cc-courses-action">
            <FaBookOpen /> All Courses
          </Link>
        </div>

        <div className="cc-courses-card cc-course-gate-card">
          <div className="cc-course-gate-icon">
            <FaShieldAlt />
          </div>
          <span className="cc-courses-eyebrow" style={{ color: "#58a6ff" }}>
            Administrator Privileges
          </span>
          <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "8px 0" }}>{course.title}</h2>
          <p style={{ color: "var(--cc-muted)", fontSize: "14px", marginBottom: "20px" }}>
            You are logged in as an <strong>{user.role}</strong>. You have full access to view, test, and manage all{" "}
            {course.topics?.length || 0} modules and lessons.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <Link to={`/courses/${id}`} className="cc-course-primary-btn">
              Go to Course Content &rarr;
            </Link>
            <Link to={`/admin/courses/${id}/edit`} className="cc-course-secondary-btn">
              Edit Curriculum
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const courseImage = course.image
    ? optimizedImageUrl(course.image, 500)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(course.title)}&background=0078d4&color=fff&size=500`;

  return (
    <div className="cc-courses-shell">
      {/* ── Page Heading (matches Profile header) ── */}
      <div className="cc-courses-heading">
        <div>
          <span className="cc-courses-eyebrow">
            {isExpired ? "Access Renewal" : "Curriculum Enrollment"}
          </span>
          <h1>{isExpired ? `Renew Access: ${course.title}` : `Enroll in ${course.title}`}</h1>
          <p>
            {isExpired
              ? "Your previous access has ended. Extend your access to resume learning."
              : "Unlock full curriculum access, interactive exercises, and verified credentials."}
          </p>
        </div>
        <Link to="/courses" className="cc-courses-action">
          <FaBookOpen /> Browse All Courses
        </Link>
      </div>

      {/* ── Two Column Enrollment Card Layout ── */}
      <div className="row g-4" style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Course Summary Card */}
        <div className="col-lg-6">
          <div className="cc-courses-card h-100">
            <div className="cc-course-card-cover" style={{ height: 180 }}>
              <img src={courseImage} alt={course.title} />
              <span className={`cc-course-badge ${isExpired ? "expired" : "enrolled"}`}>
                {isExpired ? "Renewal Mode" : "Official Track"}
              </span>
            </div>
            <div className="p-4 d-flex flex-column" style={{ flex: 1 }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 10px" }}>{course.title}</h2>
              <p style={{ color: "var(--cc-muted)", fontSize: "13px", lineHeight: 1.6, marginBottom: "16px" }}>
                {course.description}
              </p>

              <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                <span className="cc-course-topic-pill">
                  <FaLayerGroup /> {course.topics?.length || 0} Modules
                </span>
                <span className="cc-course-topic-pill">
                  <FaClock /> Flexible Duration
                </span>
                <span className="cc-course-topic-pill">
                  <FaGraduationCap /> Certificate Track
                </span>
              </div>

              <div style={{ marginTop: "auto", borderTop: "1px solid var(--cc-border)", paddingTop: "14px" }}>
                <h4 style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 800, color: "var(--cc-muted)", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Curriculum Highlights
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "12px", color: "var(--cc-text)" }}>
                  <li className="d-flex align-items-center gap-2 mb-2">
                    <FaCheckCircle style={{ color: "#3fb950" }} /> Comprehensive real-world production projects
                  </li>
                  <li className="d-flex align-items-center gap-2 mb-2">
                    <FaCheckCircle style={{ color: "#3fb950" }} /> Hands-on code blocks and configuration samples
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <FaCheckCircle style={{ color: "#3fb950" }} /> Trackable subtopic completion and progress tracking
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollment Action Card */}
        <div className="col-lg-6">
          <div className="cc-courses-card p-4 h-100 d-flex flex-column">
            <div className="cc-courses-section-title" style={{ padding: "0 0 14px 0", marginBottom: "16px" }}>
              <h2>{isExpired ? "Renew Course Access" : "Configure Access Duration"}</h2>
              <span className="text-primary font-monospace">{days} Days</span>
            </div>

            {isExpired && (
              <div
                style={{
                  background: "rgba(217, 119, 6, 0.12)",
                  border: "1px solid rgba(217, 119, 6, 0.3)",
                  borderRadius: "4px",
                  padding: "10px 14px",
                  fontSize: "12px",
                  color: "#d97706",
                  marginBottom: "16px",
                }}
              >
                <strong>Access Expired:</strong> Your previous access to this track has ended. Selecting a duration below will immediately reactivate your curriculum progress.
              </div>
            )}

            <form onSubmit={enroll} className="d-flex flex-column" style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px", color: "var(--cc-text)" }}>
                Select Duration Preset:
              </label>
              <div className="d-flex gap-2 mb-3 flex-wrap">
                {[30, 60, 90, 180, 365].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`cc-courses-tab ${days === d ? "active" : ""}`}
                    style={{ flex: 1, minWidth: "60px", textAlign: "center" }}
                  >
                    {d} Days
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label style={{ fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "var(--cc-text)" }}>
                  Custom Access Duration (Days):
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid var(--cc-border)",
                    borderRadius: "4px",
                    background: "var(--cc-surface-muted)",
                    color: "var(--cc-text)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: "11px", color: "var(--cc-muted)", marginTop: "4px", display: "block" }}>
                  Standard duration is 90 days. You will enjoy complete access to all course materials and code snippets.
                </span>
              </div>

              <div style={{ marginTop: "auto" }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="cc-course-primary-btn w-100"
                  style={{ minHeight: "44px", fontSize: "14px" }}
                >
                  {loading
                    ? isExpired
                      ? "Renewing Access..."
                      : "Enrolling..."
                    : isExpired
                    ? "Confirm Renewal & Access Course"
                    : "Confirm Enrollment"}
                </button>

                <div className="text-center mt-3">
                  <Link to={`/courses/${id}`} style={{ fontSize: "12px", color: "var(--cc-muted)" }}>
                    Cancel and view course outline
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
