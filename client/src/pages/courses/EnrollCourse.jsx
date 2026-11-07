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
  FaCopy,
  FaCheck,
  FaIdCard,
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
  const [enrollmentNumberInput, setEnrollmentNumberInput] = useState("");
  const [existingNumber, setExistingNumber] = useState(null);
  const [enrolledSuccessData, setEnrolledSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);
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

    // Fetch existing student enrollment number if any
    api
      .get("/enrollments/my-enrollment-number")
      .then((res) => {
        if (res.data?.enrollmentNumber) {
          setExistingNumber(res.data.enrollmentNumber);
          setEnrollmentNumberInput(res.data.enrollmentNumber);
        }
      })
      .catch(() => { });
  }, [user, id, nav, isAdmin]);

  const enroll = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/enrollments", {
        courseId: id,
        days,
        enrollmentNumber: enrollmentNumberInput.trim() || undefined,
      });

      const assignedNumber =
        res.data?.enrollmentNumber ||
        res.data?.enrollment?.enrollmentNumber ||
        existingNumber;

      if (assignedNumber) {
        setEnrolledSuccessData({
          enrollmentNumber: assignedNumber,
          courseTitle: course?.title || "Course",
          days,
        });
      } else {
        nav(`/courses/${id}`, { replace: true });
      }
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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

            {/* ── Student Enrollment Number / Carry-Forward Section ── */}
            {existingNumber ? (
              <div
                style={{
                  background: "var(--cc-primary-soft, #e6f2fb)",
                  border: "1.5px solid var(--cc-primary, #0078d4)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--cc-primary, #0078d4)", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 5 }}>
                    <FaIdCard /> Permanent Student ID
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--cc-text)", marginTop: "2px", fontFamily: "monospace", letterSpacing: "0.05em" }}>
                    {existingNumber}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--cc-muted)", marginTop: "2px" }}>
                    This course will automatically carry forward under your student profile.
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    background: "#22c55e",
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  ✓ Carried Forward
                </span>
              </div>
            ) : (
              <div
                style={{
                  background: "var(--cc-surface-muted)",
                  border: "1px solid var(--cc-border)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--cc-muted)", letterSpacing: "0.05em", marginBottom: "6px", display: "flex", alignItems: "center", gap: 5 }}>
                  <FaIdCard /> Student Enrollment Number
                </div>
                <input
                  type="text"
                  placeholder="Paste existing ID (e.g. CC-2026-A8F3C9) or leave blank"
                  value={enrollmentNumberInput}
                  onChange={(e) => setEnrollmentNumberInput(e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--cc-border)",
                    borderRadius: "4px",
                    background: "var(--cc-surface)",
                    color: "var(--cc-text)",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: "11px", color: "var(--cc-muted)", marginTop: "6px", display: "block", lineHeight: 1.4 }}>
                  💡 <strong>Have an existing Enrollment Number?</strong> Paste it above to link this course to your learning profile. If this is your first course, leave it blank and we'll generate one for you!
                </span>
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

      {/* ── Success Confirmation Modal with Permanent Student Enrollment Number ── */}
      {enrolledSuccessData && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--cc-surface)",
              border: "1px solid var(--cc-border)",
              borderRadius: "16px",
              maxWidth: "480px",
              width: "100%",
              padding: "32px 28px",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(34, 197, 94, 0.15)",
                color: "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                margin: "0 auto 16px auto",
              }}
            >
              <FaCheckCircle />
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px 0", color: "var(--cc-text)" }}>
              Enrollment Confirmed!
            </h2>
            <p style={{ fontSize: "14px", color: "var(--cc-muted)", margin: "0 0 24px 0", lineHeight: 1.5 }}>
              You now have full access to <strong>{enrolledSuccessData.courseTitle}</strong> for {enrolledSuccessData.days} days.
            </p>

            {/* Permanent Student ID Card */}
            <div
              style={{
                background: "var(--cc-surface-muted)",
                border: "1px dashed var(--cc-primary)",
                borderRadius: "12px",
                padding: "18px 20px",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--cc-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <FaIdCard style={{ color: "var(--cc-primary)" }} /> Permanent Student ID
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  fontFamily: "monospace",
                  color: "var(--cc-primary)",
                  letterSpacing: "0.1em",
                  marginBottom: "12px",
                }}
              >
                {enrolledSuccessData.enrollmentNumber}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(enrolledSuccessData.enrollmentNumber)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: copied ? "#22c55e" : "var(--cc-surface)",
                  color: copied ? "#fff" : "var(--cc-text)",
                  border: "1px solid var(--cc-border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {copied ? <FaCheck /> : <FaCopy />} {copied ? "Copied to Clipboard!" : "Copy Enrollment Number"}
              </button>
              <div style={{ fontSize: "11px", color: "var(--cc-muted)", marginTop: "12px", lineHeight: 1.4 }}>
                Keep this enrollment number handy. Whenever you enroll in new courses, paste this number to carry forward your learning journey under a single student profile.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={() => nav(`/courses/${id}`, { replace: true })}
                className="cc-course-primary-btn w-100"
                style={{
                  minHeight: "44px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                Go to Course Curriculum <FaArrowRight />
              </button>
              <button
                type="button"
                onClick={() => nav("/courses")}
                style={{
                  background: "transparent",
                  border: "1px solid var(--cc-border)",
                  color: "var(--cc-text)",
                  padding: "10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                View All Courses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
