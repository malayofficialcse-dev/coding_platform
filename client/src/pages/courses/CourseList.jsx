import React, { useEffect, useState, useContext, useMemo, useCallback } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import {
  FaBookOpen,
  FaGraduationCap,
  FaCheckCircle,
  FaShieldAlt,
  FaSearch,
  FaArrowRight,
  FaClock,
  FaLayerGroup,
  FaPlus,
  FaIdCard,
  FaCopy,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { optimizedImageUrl } from "../../utils/imageUrl";
import { CourseStatsSkeleton, CourseGridSkeleton } from "../../components/skeletons/CourseSkeleton";
import "./Courses.css";

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsError, setEnrollmentsError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "enrolled" | "unenrolled"
  const [myEnrollmentNumber, setMyEnrollmentNumber] = useState(null);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupNumber, setLookupNumber] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const { user } = useContext(AuthContext);

  const isAdmin = user && ["admin", "super_admin"].includes(user.role);

  useEffect(() => {
    setCoursesLoading(true);
    api
      .get("/courses")
      .then((res) => {
        if (!Array.isArray(res.data)) {
          setCourses([]);
          setCoursesError("The API returned an unexpected course response. Check the API Gateway URL and service logs.");
          return;
        }
        setCourses(res.data);
        setCoursesError("");
      })
      .catch((error) => {
        setCourses([]);
        const status = error.response?.status;
        setCoursesError(
          status
            ? `Could not load courses (HTTP ${status}). Check the deployed API Gateway URL and CORS settings.`
            : "Could not reach the API Gateway. Check the deployed API URL and try again."
        );
      })
      .finally(() => {
        setCoursesLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      setEnrollments([]);
      setEnrollmentsError("");
      return;
    }
    api
      .get("/enrollments/my")
      .then((res) => {
        if (!Array.isArray(res.data)) {
          setEnrollments([]);
          setEnrollmentsError("Enrollment data was returned in an unexpected format.");
          return;
        }
        setEnrollments(res.data);
        setEnrollmentsError("");
      })
      .catch((error) => {
        setEnrollments([]);
        console.warn("Could not load enrollments:", error.message);
        // Only set error message if it's an unauthorized state or critical, otherwise gracefully treat as no active enrollments
        if (error.response?.status && error.response.status !== 500) {
          setEnrollmentsError(`Enrollments temporarily unavailable (HTTP ${error.response.status}).`);
        }
      });

    // Check my permanent student enrollment number
    api
      .get("/enrollments/my-enrollment-number")
      .then((res) => {
        if (res.data?.enrollmentNumber) {
          setMyEnrollmentNumber(res.data.enrollmentNumber);
        }
      })
      .catch(() => { });
  }, [user]);

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    const q = lookupNumber.trim().toUpperCase();
    if (!q) return;
    setLookupLoading(true);
    setLookupError("");
    setLookupResults(null);
    try {
      const res = await api.get(`/enrollments/by-number/${encodeURIComponent(q)}`);
      setLookupResults(res.data);
    } catch (err) {
      setLookupError(
        err.response?.data?.message ||
        "No enrolled courses found for this Enrollment Number."
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const getEnrollmentForCourse = useCallback((courseId) => {
    return enrollments.find((e) => {
      const cId = e.course?._id || e.course;
      return String(cId) === String(courseId);
    });
  }, [enrollments]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === "all") return true;
      const enr = getEnrollmentForCourse(c._id);
      if (activeTab === "enrolled") return !!enr;
      if (activeTab === "unenrolled") return !enr;
      return true;
    });
  }, [courses, search, activeTab, getEnrollmentForCourse]);

  const completedModulesCount = useMemo(() => {
    return enrollments.reduce((sum, enr) => sum + (enr.completedSubtopics?.length || 0), 0);
  }, [enrollments]);

  const getCourseImage = (course) => {
    if (course.image && (course.image.startsWith("http://") || course.image.startsWith("https://"))) {
      return optimizedImageUrl(course.image, 500);
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(course.title)}&background=0078d4&color=fff&size=500`;
  };

  return (
    <div className="cc-courses-shell">
      {/* ── Page Heading (matches Profile header) ── */}
      <div className="cc-courses-heading">
        <div>
          <span className="cc-courses-eyebrow">Code Campus Academy</span>
          <h1>Curated Courses &amp; Learning Tracks</h1>
          <p>Master modern software engineering, DevOps, algorithms, and cloud architectures with structured tracks.</p>

          {myEnrollmentNumber && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "var(--cc-surface-muted)",
                border: "1px solid var(--cc-border)",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                marginTop: "8px",
              }}
            >
              <FaIdCard style={{ color: "var(--cc-primary, #0078d4)" }} />
              <span style={{ color: "var(--cc-muted)" }}>Permanent Student ID:</span>
              <strong style={{ fontFamily: "monospace", letterSpacing: "0.06em", color: "var(--cc-text)" }}>
                {myEnrollmentNumber}
              </strong>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(myEnrollmentNumber);
                  setCopiedNumber(true);
                  setTimeout(() => setCopiedNumber(false), 2000);
                }}
                title="Copy Student Enrollment Number"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: copiedNumber ? "#22c55e" : "var(--cc-muted)",
                  padding: "0 4px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {copiedNumber ? <FaCheck /> : <FaCopy />}
              </button>
            </div>
          )}
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            className="cc-courses-action"
            onClick={() => setShowLookupModal(true)}
            style={{ cursor: "pointer", border: "1px solid var(--cc-border)" }}
          >
            <FaIdCard /> Lookup Student ID
          </button>
          <Link className="cc-courses-action" to="/profile">
            <FaGraduationCap /> My Learning Profile
          </Link>
          {isAdmin && (
            <Link className="cc-courses-action" to="/admin/courses/new">
              <FaPlus /> Create Course
            </Link>
          )}
        </div>
      </div>

      {/* ── Metric Stat Grid (matches Profile Stat Grid) ── */}
          {coursesLoading ? (
            <CourseStatsSkeleton />
          ) : (
        <div className="cc-courses-stat-grid">
          <div className="cc-courses-stat">
            <FaBookOpen />
            <small>Curated Courses</small>
            <strong>{courses.length}</strong>
            <span>Structured tracks</span>
          </div>
          <div className="cc-courses-stat green">
            <FaGraduationCap />
            <small>Enrolled Tracks</small>
            <strong>{enrollments.length}</strong>
            <span>Connected to profile</span>
          </div>
          <div className="cc-courses-stat orange">
            <FaCheckCircle />
            <small>Completed Lessons</small>
            <strong>{completedModulesCount}</strong>
            <span>Hands-on completions</span>
          </div>
          <div className="cc-courses-stat purple">
            <FaShieldAlt />
            <small>Access Level</small>
            <strong style={{ fontSize: "16px", marginTop: "2px" }}>
              {isAdmin ? "Super / Admin" : user ? "Verified Student" : "Guest"}
            </strong>
            <span>{isAdmin ? "Unrestricted learning" : "Certificate eligible"}</span>
          </div>
        </div>
      )}

        {enrollmentsError && (
          <p role="alert" className="text-danger">
            {enrollmentsError}
          </p>
        )}

        {/* ── Filter and Search Bar ── */}
        <div className="cc-courses-filter-bar">
          <div className="cc-courses-search-wrap">
            <FaSearch className="cc-courses-search-icon" />
            <input
              placeholder="Search courses, technologies, topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="cc-courses-tabs">
            <button
              type="button"
              className={`cc-courses-tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Tracks ({coursesLoading ? "..." : courses.length})
            </button>
            {user && (
              <>
                <button
                  type="button"
                  className={`cc-courses-tab ${activeTab === "enrolled" ? "active" : ""}`}
                  onClick={() => setActiveTab("enrolled")}
                >
                  My Enrolled ({enrollments.length})
                </button>
                <button
                  type="button"
                  className={`cc-courses-tab ${activeTab === "unenrolled" ? "active" : ""}`}
                  onClick={() => setActiveTab("unenrolled")}
                >
                  Available ({coursesLoading ? "..." : courses.length - enrollments.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Courses Grid ── */}
        {coursesError ? (
          <div className="cc-courses-card text-center py-5" role="alert">
            <h3 style={{ fontWeight: 800 }}>Courses are temporarily unavailable</h3>
            <p style={{ color: "var(--cc-muted)" }}>{coursesError}</p>
          </div>
        ) : coursesLoading ? (
          <CourseGridSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <div className="cc-courses-card text-center py-5">
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔍</div>
            <h3 style={{ fontWeight: 800 }}>No courses found</h3>
            <p style={{ color: "var(--cc-muted)" }}>Try searching with different keywords or switch filters.</p>
          </div>
        ) : (
          <div className="cc-courses-grid">
            {filtered.map((course) => {
              const enr = getEnrollmentForCourse(course._id);
              const isEnrolled = !!enr;
              const isExpired = enr?.expiresAt ? new Date(enr.expiresAt) < new Date() : false;
              const progress = enr ? Math.min(100, Math.max(0, Number(enr.progress || 0))) : 0;

              return (
                <div className="cc-course-card" key={course._id}>
                  {/* Cover Image & Status Badge */}
                  <div className="cc-course-card-cover">
                    <img src={getCourseImage(course)} alt={course.title} loading="lazy" />
                    {isAdmin ? (
                      <span className="cc-course-badge admin">
                        <FaShieldAlt /> Admin Access
                      </span>
                    ) : isEnrolled && !isExpired ? (
                      <span className="cc-course-badge enrolled">
                        <FaCheckCircle /> Enrolled ✓
                      </span>
                    ) : isEnrolled && isExpired ? (
                      <span className="cc-course-badge expired">
                        <FaClock /> Access Expired
                      </span>
                    ) : null}
                  </div>

                  {/* Card Body */}
                  <div className="cc-course-card-body">
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>

                    <div className="d-flex align-items-center gap-2 mb-3 flex-wrap" style={{ fontSize: "11px", color: "var(--cc-muted)" }}>
                      <span className="d-inline-flex align-items-center gap-1">
                        <FaLayerGroup /> {course.topics?.length || 0} Modules
                      </span>
                      <span>•</span>
                      <span className="d-inline-flex align-items-center gap-1">
                        <FaClock /> 90 Days Standard
                      </span>
                    </div>

                    {/* Progress bar for enrolled learners */}
                    {isEnrolled && (
                      <div className="cc-course-progress-wrap">
                        <div className="cc-course-progress-label">
                          <span>Course Progress</span>
                          <strong>{progress}% complete</strong>
                        </div>
                        <div className="cc-course-progress-bar">
                          <i className={isExpired ? "expired" : ""} style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="cc-course-card-actions">
                      {isAdmin ? (
                        <Link to={`/courses/${course._id}`} className="cc-course-primary-btn">
                          Open Course <FaArrowRight />
                        </Link>
                      ) : isEnrolled && !isExpired ? (
                        <Link to={`/courses/${course._id}`} className="cc-course-success-btn">
                          Continue Learning <FaArrowRight />
                        </Link>
                      ) : isEnrolled && isExpired ? (
                        <>
                          <Link to={`/enroll/${course._id}`} className="cc-course-primary-btn">
                            Renew Access
                          </Link>
                          <Link to={`/courses/${course._id}`} className="cc-course-secondary-btn">
                            Details
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link to={`/enroll/${course._id}`} className="cc-course-primary-btn">
                            Enroll Now
                          </Link>
                          <Link to={`/courses/${course._id}`} className="cc-course-secondary-btn">
                            Preview
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Lookup Student by Enrollment Number Modal ── */}
        {showLookupModal && (
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
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowLookupModal(false);
            }}
          >
            <div
              style={{
                background: "var(--cc-surface)",
                border: "1px solid var(--cc-border)",
                borderRadius: "16px",
                maxWidth: "560px",
                width: "100%",
                padding: "28px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaIdCard style={{ fontSize: "20px", color: "var(--cc-primary)" }} />
                  <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "var(--cc-text)" }}>
                    Lookup Student Courses
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLookupModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--cc-muted)",
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <p style={{ fontSize: "13px", color: "var(--cc-muted)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                Enter a Student Enrollment Number (e.g. <code>CC-2026-A8F3C9</code>) to retrieve all aggregated courses enrolled under that student ID.
              </p>

              <form onSubmit={handleLookup} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                <input
                  type="text"
                  placeholder="Enter Enrollment Number..."
                  value={lookupNumber}
                  onChange={(e) => setLookupNumber(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    border: "1px solid var(--cc-border)",
                    borderRadius: "8px",
                    background: "var(--cc-surface-muted)",
                    color: "var(--cc-text)",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    textTransform: "uppercase",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={lookupLoading || !lookupNumber.trim()}
                  className="cc-course-primary-btn"
                  style={{ minHeight: "42px", padding: "0 18px", whiteSpace: "nowrap" }}
                >
                  {lookupLoading ? "Searching..." : "Lookup"}
                </button>
              </form>

              {lookupError && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.12)",
                    color: "#ef4444",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    marginBottom: "16px",
                  }}
                >
                  {lookupError}
                </div>
              )}

              {lookupResults && (
                <div>
                  <div
                    style={{
                      background: "var(--cc-surface-muted)",
                      border: "1px solid var(--cc-border)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      marginBottom: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--cc-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                        Student ID
                      </span>
                      <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "15px", color: "var(--cc-primary)" }}>
                        {lookupResults.enrollmentNumber}
                      </div>
                    </div>
                    <span
                      style={{
                        background: "rgba(34, 197, 94, 0.15)",
                        color: "#22c55e",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {lookupResults.totalCourses} {lookupResults.totalCourses === 1 ? "Course" : "Courses"} Linked
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {lookupResults.courses?.length === 0 ? (
                      <div style={{ textAlign: "center", color: "var(--cc-muted)", padding: "16px" }}>
                        No courses found for this enrollment number.
                      </div>
                    ) : (
                      lookupResults.courses?.map((c) => {
                        const isExpired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
                        return (
                          <div
                            key={c._id || c.enrollmentId}
                            style={{
                              background: "var(--cc-surface)",
                              border: "1px solid var(--cc-border)",
                              borderRadius: "8px",
                              padding: "12px 14px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px 0", color: "var(--cc-text)" }}>
                                {c.courseTitle || c.course?.title || "Course Track"}
                              </h4>
                              <div style={{ fontSize: "11px", color: "var(--cc-muted)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                <span>Progress: <strong>{c.progress || 0}%</strong></span>
                                <span>Enrolled: {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A"}</span>
                                <span>
                                  Status:{" "}
                                  <strong style={{ color: isExpired ? "#ef4444" : "#22c55e" }}>
                                    {isExpired ? "Expired" : "Active"}
                                  </strong>
                                </span>
                              </div>
                            </div>
                            <Link
                              to={`/courses/${c.courseId || c.course?._id || c.course}`}
                              className="cc-course-secondary-btn"
                              style={{ padding: "6px 12px", fontSize: "12px", whiteSpace: "nowrap" }}
                              onClick={() => setShowLookupModal(false)}
                            >
                              View
                            </Link>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      );
}
