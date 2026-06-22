import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ─── Inline styles ─────────────────────────────────────────────────── */
const S = {
  page: {
    background: "linear-gradient(135deg, #f0f4ff 0%, #fafbff 100%)",
    minHeight: "100vh",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  banner: {
    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)",
    borderRadius: "1.25rem",
    padding: "1.75rem 2rem",
    color: "#fff",
    marginBottom: "1.75rem",
    boxShadow: "0 8px 32px rgba(59,130,246,0.25)",
    position: "relative",
    overflow: "hidden",
  },
  bannerGlow: {
    position: "absolute",
    top: "-40px",
    right: "-40px",
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    pointerEvents: "none",
  },
  sidebar: {
    background: "#fff",
    borderRadius: "1.25rem",
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
    border: "1px solid #e8edf5",
    padding: "1.25rem",
    position: "sticky",
    top: "20px",
    zIndex: 100,
    maxHeight: "calc(100vh - 140px)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignSelf: "start",
  },
  sidebarTitle: {
    fontWeight: 700,
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6366f1",
    marginBottom: "0.75rem",
  },
  searchInput: {
    border: "1.5px solid #e2e8f0",
    borderRadius: "0.75rem",
    padding: "0.5rem 0.85rem",
    fontSize: "0.85rem",
    outline: "none",
    width: "100%",
    marginBottom: "0.85rem",
    background: "#f8fafc",
    color: "#1e293b",
  },
  topicBtn: (active) => ({
    background: active ? "linear-gradient(90deg, #eef2ff, #e0e7ff)" : "transparent",
    border: "none",
    borderRadius: "0.6rem",
    padding: "0.55rem 0.85rem",
    fontWeight: 700,
    fontSize: "0.82rem",
    color: active ? "#4f46e5" : "#374151",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.15s",
    letterSpacing: "0.01em",
  }),
  subtopicBtn: (active) => ({
    background: active ? "linear-gradient(90deg, #6366f1, #8b5cf6)" : "transparent",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.4rem 0.75rem 0.4rem 1.25rem",
    fontSize: "0.8rem",
    color: active ? "#fff" : "#64748b",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    marginBottom: "2px",
    fontWeight: active ? 600 : 400,
    transition: "all 0.15s",
    boxShadow: active ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  }),
  contentCard: {
    background: "#fff",
    borderRadius: "1.25rem",
    boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
    border: "1px solid #e8edf5",
    padding: "2.5rem",
    minHeight: "60vh",
  },
  subtopicTitle: {
    fontWeight: 800,
    fontSize: "1.75rem",
    color: "#1e293b",
    marginBottom: "0.25rem",
    lineHeight: 1.3,
  },
  topicBadge: {
    display: "inline-block",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    color: "#fff",
    borderRadius: "999px",
    padding: "0.25rem 0.85rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    marginBottom: "1.5rem",
    letterSpacing: "0.03em",
  },
  divider: {
    border: "none",
    borderTop: "2px solid #f1f5f9",
    margin: "2rem 0",
  },
  codeHeader: (dark) => ({
    background: dark
      ? "linear-gradient(90deg, #0f172a, #1e293b)"
      : "linear-gradient(90deg, #e2e8f0, #f1f5f9)",
    borderRadius: "0.85rem 0.85rem 0 0",
    padding: "0.6rem 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }),
  langBadge: (dark) => ({
    background: dark ? "#334155" : "#cbd5e1",
    color: dark ? "#94a3b8" : "#475569",
    borderRadius: "4px",
    padding: "2px 8px",
    fontSize: "0.72rem",
    fontFamily: "monospace",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  }),
  copyBtn: (copied) => ({
    background: copied ? "#22c55e" : "rgba(255,255,255,0.1)",
    border: "1px solid " + (copied ? "#22c55e" : "rgba(255,255,255,0.2)"),
    color: copied ? "#fff" : "#94a3b8",
    borderRadius: "5px",
    padding: "3px 10px",
    fontSize: "0.72rem",
    cursor: "pointer",
    transition: "all 0.2s",
    fontWeight: 600,
  }),
  imgFrame: {
    borderRadius: "1rem",
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
    marginBottom: "2rem",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  navBtn: (variant) => ({
    background: variant === "next"
      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
      : "#fff",
    border: variant === "next" ? "none" : "1.5px solid #e2e8f0",
    borderRadius: "0.85rem",
    padding: "0.75rem 1.25rem",
    cursor: "pointer",
    boxShadow: variant === "next"
      ? "0 4px 16px rgba(99,102,241,0.35)"
      : "0 2px 8px rgba(0,0,0,0.06)",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: variant === "next" ? "flex-end" : "flex-start",
    minWidth: "160px",
  }),
  progressBar: {
    height: "4px",
    background: "#f1f5f9",
    borderRadius: "999px",
    overflow: "hidden",
    marginBottom: "1.5rem",
  },
  progressFill: (pct) => ({
    height: "100%",
    width: pct + "%",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    borderRadius: "999px",
    transition: "width 0.4s ease",
  }),
};

/* ─── Copy Button with feedback ──────────────────────────────────────── */
function CopyButton({ code, dark }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button style={S.copyBtn(copied)} onClick={handle}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

/* ─── Styled body renderer ───────────────────────────────────────────── */
function StyledBody({ body }) {
  if (!body) return null;

  const lines = body.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) { i++; continue; }

    // Numbered list item: "1." "2." etc
    if (/^\d+\.\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={i} style={{ paddingLeft: "1.5rem", margin: "1rem 0", color: "#374151" }}>
          {items.map((item, k) => (
            <li key={k} style={{ marginBottom: "0.4rem", fontSize: "1rem", lineHeight: 1.7 }}>
              {item}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list item: "•", "-", "*"
    if (/^[•\-\*]\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[•\-\*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[•\-\*]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={i} style={{ paddingLeft: "1.5rem", margin: "1rem 0", listStyle: "none" }}>
          {items.map((item, k) => (
            <li key={k} style={{
              marginBottom: "0.4rem", fontSize: "1rem", lineHeight: 1.7,
              color: "#374151", display: "flex", alignItems: "flex-start", gap: "0.5rem",
            }}>
              <span style={{
                color: "#6366f1", fontWeight: 700, marginTop: "2px", flexShrink: 0, fontSize: "0.85rem",
              }}>▸</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Arrow-separated "A -> B" definition-style line
    if (trimmed.includes(" -> ") || trimmed.includes(" → ")) {
      const parts = trimmed.split(/\s*[→\->]+\s*/);
      elements.push(
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          margin: "0.35rem 0", fontSize: "0.95rem",
        }}>
          <span style={{
            background: "#eef2ff", color: "#4f46e5", borderRadius: "5px",
            padding: "2px 10px", fontWeight: 600, fontSize: "0.85rem",
          }}>{parts[0]}</span>
          <span style={{ color: "#94a3b8", fontWeight: 700 }}>→</span>
          <span style={{ color: "#374151" }}>{parts.slice(1).join(" → ")}</span>
        </div>
      );
      i++; continue;
    }

    // Short standalone "keyword" lines (all caps or single word categories)
    if (trimmed.length < 30 && /^[A-Z]/.test(trimmed) && !trimmed.endsWith(":") && !/\s{2,}/.test(trimmed) && lines[i + 1]?.trim() === "") {
      elements.push(
        <div key={i} style={{
          display: "inline-block",
          background: "linear-gradient(90deg, #f0fdf4, #dcfce7)",
          color: "#166534",
          borderRadius: "6px",
          padding: "3px 12px",
          fontSize: "0.82rem",
          fontWeight: 700,
          fontFamily: "monospace",
          margin: "3px 3px",
          border: "1px solid #bbf7d0",
        }}>
          {trimmed}
        </div>
      );
      i++; continue;
    }

    // Section heading line ending with ":"
    if (trimmed.endsWith(":") && trimmed.length < 60 && !trimmed.includes(".")) {
      elements.push(
        <div key={i} style={{
          fontWeight: 800, fontSize: "1.05rem", color: "#1e293b",
          marginTop: "1.5rem", marginBottom: "0.35rem",
          borderLeft: "4px solid #6366f1",
          paddingLeft: "0.75rem",
          letterSpacing: "0.01em",
        }}>
          {trimmed.slice(0, -1)}
        </div>
      );
      i++; continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{
        fontSize: "1rem", lineHeight: 1.85, color: "#374151",
        margin: "0.5rem 0",
      }}>
        {trimmed}
      </p>
    );
    i++;
  }

  return <div style={{ marginTop: "1rem" }}>{elements}</div>;
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [expired, setExpired] = useState(false);
  const [darkCode, setDarkCode] = useState(true);
  const [activeSubtopic, setActiveSubtopic] = useState(null);
  const [activeTopicTitle, setActiveTopicTitle] = useState("");
  const [expandedTopics, setExpandedTopics] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useContext(AuthContext);
  const nav = useNavigate();
  const contentRef = useRef(null);

  useEffect(() => {
    api.get(`/courses/${id}`).then((res) => {
      setCourse(res.data);
      if (res.data?.topics?.length > 0) {
        const sorted = [...res.data.topics].sort((a, b) => a.order - b.order);
        const first = sorted.find((t) => t.subtopics?.length > 0);
        if (first) {
          const firstSub = [...first.subtopics].sort((a, b) => a.order - b.order)[0];
          setActiveSubtopic(firstSub);
          setActiveTopicTitle(first.title);
          setExpandedTopics({ [first._id]: true });
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
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );

  if (!user)
    return (
      <div className="container py-5 text-center">
        <p className="text-muted fs-5">Please login to access this course.</p>
        <a href="/login" className="btn btn-primary rounded-pill px-4">Login</a>
      </div>
    );

  if (!enrolled)
    return (
      <div className="container py-5 text-center">
        <p className="text-muted fs-5">You are not enrolled in this course.</p>
        <button className="btn btn-primary rounded-pill px-4" onClick={() => nav(`/enroll/${id}`)}>
          Enroll Now
        </button>
      </div>
    );

  if (expired)
    return (
      <div className="container py-5 text-center">
        <p className="text-danger fs-5">Your access to this course has expired.</p>
      </div>
    );

  const toggleTopic = (topicId) =>
    setExpandedTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }));

  const handleSelectSubtopic = (sub, topicId, topicTitle) => {
    setActiveSubtopic(sub);
    setActiveTopicTitle(topicTitle);
    setExpandedTopics((prev) => ({ ...prev, [topicId]: true }));
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getSubtopicList = () => {
    if (!course?.topics) return [];
    return [...course.topics]
      .sort((a, b) => a.order - b.order)
      .flatMap((t) =>
        [...t.subtopics]
          .sort((a, b) => a.order - b.order)
          .map((s) => ({ ...s, topicId: t._id, topicTitle: t.title }))
      );
  };

  const flatList = getSubtopicList();
  const curIdx = flatList.findIndex((s) => s._id === activeSubtopic?._id);
  const prevSub = curIdx > 0 ? flatList[curIdx - 1] : null;
  const nextSub = curIdx < flatList.length - 1 ? flatList[curIdx + 1] : null;
  const progressPct = flatList.length > 1 ? Math.round(((curIdx + 1) / flatList.length) * 100) : 100;

  const filteredTopics = course.topics
    ?.map((t) => {
      const sorted = [...t.subtopics].sort((a, b) => a.order - b.order);
      const matched = sorted.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.body && s.body.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      const topicMatch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (topicMatch || matched.length > 0)
        return { ...t, subtopics: topicMatch ? sorted : matched };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);

  return (
    <div style={S.page}>
      <div style={{ width: "100%", padding: "1.25rem 1.5rem" }}>
        {/* ── Banner ── */}
        <div style={S.banner}>
          <div style={S.bannerGlow} />
          <div className="d-flex align-items-center gap-3">
            {course.image && (
              <img
                src={course.image}
                alt={course.title}
                style={{
                  width: 64, height: 64, objectFit: "cover", borderRadius: "0.75rem",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.25)", flexShrink: 0
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontWeight: 800, fontSize: "1.45rem", margin: 0, color: "#fff", lineHeight: 1.3 }}>
                {course.title}
              </h1>
              <p style={{ margin: "0.25rem 0 0", color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>
                {course.description}
              </p>
            </div>
            <button
              onClick={() => setDarkCode((d) => !d)}
              style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff", borderRadius: "0.6rem", padding: "0.4rem 0.9rem",
                cursor: "pointer", fontSize: "0.82rem", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {darkCode ? "☀️ Light Code" : "🌙 Dark Code"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.25rem", alignItems: "start" }}>
          {/* ── Sidebar ── */}
          <div style={{ minWidth: 0 }}>
            <div style={S.sidebar}>
              <div style={S.sidebarTitle}>Course Syllabus</div>
              <input
                style={S.searchInput}
                placeholder="Search syllabus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div style={{ overflowY: "auto", flex: 1 }}>
                {filteredTopics?.length > 0 ? (
                  filteredTopics.map((topic) => {
                    const isOpen = expandedTopics[topic._id] || searchQuery.trim() !== "";
                    return (
                      <div key={topic._id} style={{ marginBottom: "4px" }}>
                        <button
                          style={S.topicBtn(false)}
                          onClick={() => toggleTopic(topic._id)}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {topic.title}
                          </span>
                          <span style={{ color: "#9ca3af", fontSize: "0.7rem", flexShrink: 0 }}>
                            {isOpen ? "▲" : "▼"}
                          </span>
                        </button>
                        {isOpen && topic.subtopics?.map((sub) => {
                          const active = activeSubtopic?._id === sub._id;
                          return (
                            <button
                              key={sub._id}
                              style={S.subtopicBtn(active)}
                              onClick={() => handleSelectSubtopic(sub, topic._id, topic.title)}
                            >
                              <span style={{ flexShrink: 0, fontSize: "0.65rem" }}>
                                {active ? "●" : "○"}
                              </span>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {sub.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", color: "#9ca3af", padding: "1rem", fontSize: "0.85rem" }}>
                    No matching topics
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div style={{ minWidth: 0 }} ref={contentRef}>
            {activeSubtopic ? (
              <div style={S.contentCard}>
                {/* Progress */}
                <div style={S.progressBar}>
                  <div style={S.progressFill(progressPct)} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                  <div>
                    <span style={S.topicBadge}>{activeTopicTitle}</span>
                    <h2 style={S.subtopicTitle}>{activeSubtopic.title}</h2>
                  </div>
                  <span style={{ color: "#9ca3af", fontSize: "0.8rem", whiteSpace: "nowrap", marginTop: "0.25rem" }}>
                    {curIdx + 1} / {flatList.length}
                  </span>
                </div>

                <hr style={S.divider} />

                {/* Images */}
                {activeSubtopic.images?.length > 0 && (
                  <div
                    id={`carousel-${activeSubtopic._id}`}
                    className="carousel slide"
                    data-bs-ride="carousel"
                    style={{ ...S.imgFrame, maxWidth: 640, margin: "0 auto 2rem" }}
                  >
                    <div className="carousel-inner">
                      {activeSubtopic.images.map((img, i) => (
                        <div className={`carousel-item${i === 0 ? " active" : ""}`} key={i}>
                          <img
                            src={img}
                            className="d-block w-100"
                            alt={`Slide ${i + 1}`}
                            style={{ maxHeight: 360, objectFit: "contain", background: "#f8fafc" }}
                          />
                        </div>
                      ))}
                    </div>
                    {activeSubtopic.images.length > 1 && (
                      <>
                        <button className="carousel-control-prev" type="button"
                          data-bs-target={`#carousel-${activeSubtopic._id}`} data-bs-slide="prev">
                          <span className="carousel-control-prev-icon" />
                        </button>
                        <button className="carousel-control-next" type="button"
                          data-bs-target={`#carousel-${activeSubtopic._id}`} data-bs-slide="next">
                          <span className="carousel-control-next-icon" />
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Code Blocks */}
                {activeSubtopic.codeBlocks?.length > 0 &&
                  activeSubtopic.codeBlocks.map((cb, ci) => (
                    <div key={ci} style={{
                      marginBottom: "1.75rem",
                      borderRadius: "0.85rem",
                      overflow: "hidden",
                      boxShadow: darkCode
                        ? "0 4px 24px rgba(0,0,0,0.35)"
                        : "0 2px 12px rgba(0,0,0,0.08)",
                      border: darkCode ? "1px solid #1e293b" : "1px solid #e2e8f0",
                    }}>
                      <div style={S.codeHeader(darkCode)}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ color: "#ef4444", fontSize: "0.55rem" }}>●</span>
                          <span style={{ color: "#f59e0b", fontSize: "0.55rem" }}>●</span>
                          <span style={{ color: "#22c55e", fontSize: "0.55rem" }}>●</span>
                          <span style={S.langBadge(darkCode)}>{cb.language || "code"}</span>
                        </div>
                        <CopyButton code={cb.code} dark={darkCode} />
                      </div>
                      <SyntaxHighlighter
                        language={cb.language || "javascript"}
                        style={darkCode ? vscDarkPlus : oneLight}
                        showLineNumbers
                        customStyle={{
                          margin: 0,
                          borderRadius: 0,
                          fontSize: "0.88rem",
                          background: darkCode ? "#0d1117" : "#f8fafc",
                          padding: "1.25rem 1rem",
                        }}
                        lineNumberStyle={{ color: darkCode ? "#4a5568" : "#cbd5e1", minWidth: "2.5em" }}
                      >
                        {cb.code}
                      </SyntaxHighlighter>
                    </div>
                  ))}

                {/* Body */}
                {activeSubtopic.body && (
                  <div style={{
                    background: "linear-gradient(135deg, #fafbff 0%, #f8fafc 100%)",
                    border: "1px solid #e8edf5",
                    borderRadius: "1rem",
                    padding: "1.75rem 2rem",
                    marginTop: "0.5rem",
                  }}>
                    <StyledBody body={activeSubtopic.body} />
                  </div>
                )}

                {/* Navigation */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "2.5rem",
                  paddingTop: "1.5rem",
                  borderTop: "2px solid #f1f5f9",
                  gap: "1rem",
                }}>
                  {prevSub ? (
                    <button
                      style={S.navBtn("prev")}
                      onClick={() => handleSelectSubtopic(prevSub, prevSub.topicId, prevSub.topicTitle)}
                    >
                      <span style={{ fontSize: "0.72rem", color: "#9ca3af", marginBottom: "2px" }}>← Previous</span>
                      <span style={{
                        fontWeight: 700, color: "#374151", fontSize: "0.9rem",
                        maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>
                        {prevSub.title}
                      </span>
                    </button>
                  ) : <div />}
                  {nextSub ? (
                    <button
                      style={S.navBtn("next")}
                      onClick={() => handleSelectSubtopic(nextSub, nextSub.topicId, nextSub.topicTitle)}
                    >
                      <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", marginBottom: "2px" }}>Next →</span>
                      <span style={{
                        fontWeight: 700, color: "#fff", fontSize: "0.9rem",
                        maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>
                        {nextSub.title}
                      </span>
                    </button>
                  ) : <div />}
                </div>
              </div>
            ) : (
              <div style={{
                ...S.contentCard, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", minHeight: "60vh"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚀</div>
                <h4 style={{ fontWeight: 700, color: "#1e293b" }}>Welcome to {course.title}</h4>
                <p style={{ color: "#64748b" }}>Select a topic from the syllabus to begin learning!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
