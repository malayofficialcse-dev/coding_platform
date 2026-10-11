import React, { useEffect, useState, useContext, useMemo } from "react";
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
} from "react-icons/fa";
import { optimizedImageUrl } from "../../utils/imageUrl";
import "./Courses.css";

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "enrolled" | "unenrolled"
  const { user } = useContext(AuthContext);

  const isAdmin = user && ["admin", "super_admin"].includes(user.role);

  useEffect(() => {
    api
      .get("/courses")
      .then((res) => setCourses(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setEnrollments([]);
      return;
    }
    api
      .get("/enrollments/my")
      .then((res) => setEnrollments(res.data || []))
      .catch(() => setEnrollments([]));
  }, [user]);

  const getEnrollmentForCourse = (courseId) => {
    return enrollments.find((e) => {
      const cId = e.course?._id || e.course;
      return String(cId) === String(courseId);
    });
  };

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
  }, [courses, search, activeTab, enrollments]);

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
        </div>
        <div className="d-flex align-items-center gap-2">
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
            All Tracks ({courses.length})
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
                Available ({courses.length - enrollments.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Courses Grid ── */}
      {filtered.length === 0 ? (
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
    </div>
  );
}
