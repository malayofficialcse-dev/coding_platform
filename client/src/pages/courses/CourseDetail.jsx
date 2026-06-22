import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  prism,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [expired, setExpired] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [activeSubtopic, setActiveSubtopic] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useContext(AuthContext);
  const nav = useNavigate();
  const contentRef = useRef(null);

  useEffect(() => {
    api.get(`/courses/${id}`).then((res) => {
      setCourse(res.data);
      // Auto-expand first topic with subtopics and select its first subtopic
      if (res.data && res.data.topics && res.data.topics.length > 0) {
        const sortedTopics = [...res.data.topics].sort((a, b) => a.order - b.order);
        const firstTopicWithSubtopics = sortedTopics.find(
          (t) => t.subtopics && t.subtopics.length > 0
        );
        if (firstTopicWithSubtopics) {
          const sortedSubtopics = [...firstTopicWithSubtopics.subtopics].sort(
            (a, b) => a.order - b.order
          );
          if (sortedSubtopics.length > 0) {
            setActiveSubtopic(sortedSubtopics[0]);
            setExpandedTopics({ [firstTopicWithSubtopics._id]: true });
          }
        }
      }
    });

    if (user) {
      api.get("/enrollments/mine").then((res) => {
        const found = res.data.find((e) => e.course && String(e.course._id) === String(id));
        if (found) {
          setEnrolled(true);
          setExpired(new Date(found.expiresAt) < new Date());
        }
      });
    }
  }, [id, user]);

  if (!course)
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <div className="card shadow-sm max-w-md mx-auto p-4 rounded-4">
          <p className="fs-5 text-muted">Please login to access this course.</p>
          <a href="/login" className="btn btn-primary">
            Login
          </a>
        </div>
      </div>
    );
  }

  if (!enrolled) {
    return (
      <div className="container py-5 text-center">
        <div className="card shadow-sm max-w-md mx-auto p-4 rounded-4">
          <p className="fs-5 text-muted">You are not enrolled in this course.</p>
          <button
            className="btn btn-primary"
            onClick={() => nav(`/enroll/${id}`)}
          >
            Enroll Now
          </button>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="container py-5 text-center">
        <div className="card shadow-sm max-w-md mx-auto p-4 rounded-4">
          <p className="text-danger fs-5">Your access to this course has expired.</p>
        </div>
      </div>
    );
  }

  // Toggle Topic accordion expansion
  const toggleTopic = (topicId) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  // Select a subtopic and scroll content area to top
  const handleSelectSubtopic = (subtopic, topicId) => {
    setActiveSubtopic(subtopic);
    setExpandedTopics((prev) => ({ ...prev, [topicId]: true }));
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Helper to compile a flat list of subtopics for navigation
  const getSubtopicList = () => {
    const list = [];
    if (!course || !course.topics) return list;
    const sortedTopics = [...course.topics].sort((a, b) => a.order - b.order);
    for (const topic of sortedTopics) {
      const sortedSubtopics = [...topic.subtopics].sort((a, b) => a.order - b.order);
      for (const sub of sortedSubtopics) {
        list.push({
          ...sub,
          topicId: topic._id,
          topicTitle: topic.title,
        });
      }
    }
    return list;
  };

  const flatSubtopics = getSubtopicList();
  const currentIdx = flatSubtopics.findIndex((s) => s._id === activeSubtopic?._id);
  const prevSub = currentIdx > 0 ? flatSubtopics[currentIdx - 1] : null;
  const nextSub = currentIdx < flatSubtopics.length - 1 ? flatSubtopics[currentIdx + 1] : null;

  // Filter topics and subtopics based on search query
  const filteredTopics = course.topics
    ?.map((topic) => {
      const sortedSubtopics = [...topic.subtopics].sort((a, b) => a.order - b.order);
      const matchedSubtopics = sortedSubtopics.filter(
        (sub) =>
          sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (sub.body && sub.body.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      const isTopicMatch = topic.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (isTopicMatch || matchedSubtopics.length > 0) {
        return {
          ...topic,
          subtopics: isTopicMatch ? sortedSubtopics : matchedSubtopics,
          isMatch: true,
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="container-fluid px-md-4 py-4">
      {/* Course Title Banner */}
      <div className="row mb-4 align-items-center">
        <div className="col-12 col-md-auto mb-3 mb-md-0">
          {course.image && (
            <img
              src={course.image}
              alt={course.title}
              style={{
                width: "80px",
                height: "80px",
                objectFit: "cover",
                borderRadius: "1rem",
              }}
              className="shadow-sm"
            />
          )}
        </div>
        <div className="col">
          <h2 className="fw-bold text-dark m-0">{course.title}</h2>
          <p className="text-muted m-0">{course.description}</p>
        </div>
        <div className="col-auto">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setDarkMode((d) => !d)}
          >
            {darkMode ? "☀️ Light Code" : "🌙 Dark Code"}
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Side Sidebar - Topics Navigation */}
        <div className="col-lg-3 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 sticky-top" style={{ top: "20px", zIndex: 100 }}>
            <h5 className="fw-bold text-primary mb-3">Course Syllabus</h5>
            <input
              type="text"
              className="form-control form-control-sm mb-3 rounded-pill"
              placeholder="Search syllabus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: "calc(100vh - 250px)" }}>
              {filteredTopics && filteredTopics.length > 0 ? (
                filteredTopics.map((topic) => {
                  const isExpanded = expandedTopics[topic._id] || searchQuery.trim() !== "";
                  return (
                    <div key={topic._id} className="mb-2 border-bottom pb-2">
                      <button
                        className="btn btn-link w-100 text-start text-decoration-none fw-bold text-dark d-flex justify-content-between align-items-center p-2 rounded-3 hover-bg-light"
                        onClick={() => toggleTopic(topic._id)}
                      >
                        <span className="text-truncate" style={{ maxWidth: "85%" }}>
                          {topic.title}
                        </span>
                        <span className="text-muted small">{isExpanded ? "▲" : "▼"}</span>
                      </button>
                      {isExpanded && (
                        <div className="ps-2 mt-1 list-group list-group-flush">
                          {topic.subtopics && topic.subtopics.length > 0 ? (
                            topic.subtopics.map((sub) => {
                              const isActive = activeSubtopic?._id === sub._id;
                              return (
                                <button
                                  key={sub._id}
                                  className={`list-group-item list-group-item-action border-0 rounded-3 py-2 px-3 my-1 text-start ${
                                    isActive
                                      ? "bg-primary-subtle text-primary fw-semibold"
                                      : "text-muted"
                                  }`}
                                  onClick={() => handleSelectSubtopic(sub, topic._id)}
                                >
                                  {sub.title}
                                </button>
                              );
                            })
                          ) : (
                            <span className="text-muted small ps-3">No topics</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-muted text-center py-3">No matching topics found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Content Viewer */}
        <div className="col-lg-9 col-md-8" ref={contentRef}>
          {activeSubtopic ? (
            <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
              <h3 className="fw-bold text-dark mb-4">{activeSubtopic.title}</h3>

              {/* Subtopic Images Carousel */}
              {activeSubtopic.images && activeSubtopic.images.length > 0 && (
                <div
                  id={`carousel-subtopic-${activeSubtopic._id}`}
                  className="carousel slide mb-4 bg-light rounded-4 shadow-sm"
                  data-bs-ride="carousel"
                  style={{ maxWidth: "600px", margin: "0 auto" }}
                >
                  <div className="carousel-inner rounded-4">
                    {activeSubtopic.images.map((img, i) => (
                      <div
                        className={`carousel-item${i === 0 ? " active" : ""}`}
                        key={i}
                      >
                        <img
                          src={img}
                          className="d-block w-100"
                          alt={`Slide ${i + 1}`}
                          style={{
                            maxHeight: "350px",
                            objectFit: "contain",
                            borderRadius: "1rem",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  {activeSubtopic.images.length > 1 && (
                    <>
                      <button
                        className="carousel-control-prev"
                        type="button"
                        data-bs-target={`#carousel-subtopic-${activeSubtopic._id}`}
                        data-bs-slide="prev"
                      >
                        <span className="carousel-control-prev-icon bg-dark rounded-circle" aria-hidden="true"></span>
                        <span className="visually-hidden">Previous</span>
                      </button>
                      <button
                        className="carousel-control-next"
                        type="button"
                        data-bs-target={`#carousel-subtopic-${activeSubtopic._id}`}
                        data-bs-slide="next"
                      >
                        <span className="carousel-control-next-icon bg-dark rounded-circle" aria-hidden="true"></span>
                        <span className="visually-hidden">Next</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Subtopic Code Blocks */}
              {activeSubtopic.codeBlocks &&
                activeSubtopic.codeBlocks.length > 0 &&
                activeSubtopic.codeBlocks.map((cb, cidx) => (
                  <div key={cidx} className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="badge bg-secondary font-monospace">
                        {cb.language || "code"}
                      </span>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(cb.code);
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <SyntaxHighlighter
                      language={cb.language || "javascript"}
                      style={darkMode ? vscDarkPlus : prism}
                      showLineNumbers
                      customStyle={{
                        borderRadius: "10px",
                        fontSize: "0.95rem",
                        background: darkMode ? "#1e1e1e" : "#f4f4f4",
                        padding: "1rem",
                      }}
                    >
                      {cb.code}
                    </SyntaxHighlighter>
                  </div>
                ))}

              {/* Subtopic Markdown Body */}
              <div
                className="fs-5 lh-lg markdown-content"
                style={{ color: "#2d3748", textAlign: "left" }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeSubtopic.body}
                </ReactMarkdown>
              </div>

              {/* Bottom Navigation */}
              <div className="d-flex justify-content-between border-top mt-5 pt-4">
                {prevSub ? (
                  <button
                    className="btn btn-outline-primary d-flex flex-column align-items-start"
                    onClick={() => handleSelectSubtopic(prevSub, prevSub.topicId)}
                  >
                    <span className="small text-muted">← Previous</span>
                    <span className="fw-semibold text-truncate" style={{ maxWidth: "200px" }}>{prevSub.title}</span>
                  </button>
                ) : (
                  <div />
                )}
                {nextSub ? (
                  <button
                    className="btn btn-primary d-flex flex-column align-items-end"
                    onClick={() => handleSelectSubtopic(nextSub, nextSub.topicId)}
                  >
                    <span className="small text-white-50">Next →</span>
                    <span className="fw-semibold text-truncate" style={{ maxWidth: "200px" }}>{nextSub.title}</span>
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
              <h4 className="text-muted mb-2">Welcome to {course.title}</h4>
              <p className="text-muted">Select a topic from the syllabus to begin learning!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

