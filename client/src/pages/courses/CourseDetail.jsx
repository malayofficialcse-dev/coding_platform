import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import {
  FaBookOpen,
  FaCheckCircle,
  FaCode,
  FaArrowLeft,
  FaArrowRight,
  FaClock,
  FaShieldAlt,
  FaLayerGroup,
  FaGraduationCap,
  FaEdit,
  FaSearch,
  FaLock,
  FaChevronDown,
  FaChevronUp,
  FaAward,
  FaPlay,
  FaStickyNote,
  FaStar,
  FaRegStar,
  FaQuestionCircle,
  FaLightbulb,
  FaExpand,
  FaCompress,
  FaDownload,
  FaRedo,
  FaTerminal,
  FaCheck,
  FaThumbsUp,
  FaThumbsDown,
  FaShareAlt,
} from "react-icons/fa";
import { optimizedImageUrl } from "../../utils/imageUrl";
import CourseCertificate from "../../components/CourseCertificate";
import "./Courses.css";

/* ─── Copy Button with feedback ──────────────────────────────────────── */
function CopyButton({ code, dark }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handle}
      style={{
        background: copied ? "#22c55e" : dark ? "#21262d" : "#e6f2fb",
        border: "1px solid " + (copied ? "#22c55e" : dark ? "#30363d" : "#b7d9f2"),
        color: copied ? "#fff" : dark ? "#c9d1d9" : "#005a9e",
        borderRadius: "4px",
        padding: "4px 10px",
        fontSize: "11px",
        cursor: "pointer",
        transition: "all 0.2s",
        fontWeight: 700,
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

/* ─── Styled body renderer ───────────────────────────────────────────── */
function StyledBody({ body, fontSize = "md" }) {
  if (!body) return null;

  const fontSizes = {
    sm: "0.88rem",
    md: "0.96rem",
    lg: "1.08rem",
  };
  const activeFontSize = fontSizes[fontSize] || fontSizes.md;

  const lines = body.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Numbered list item: "1." "2." etc
    if (/^\d+\.\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={i} style={{ paddingLeft: "1.5rem", margin: "1rem 0" }}>
          {items.map((item, k) => (
            <li key={k} style={{ marginBottom: "0.4rem", fontSize: activeFontSize, lineHeight: 1.75 }}>
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
        <ul key={i} style={{ paddingLeft: "1.25rem", margin: "1rem 0", listStyle: "none" }}>
          {items.map((item, k) => (
            <li
              key={k}
              style={{
                marginBottom: "0.4rem",
                fontSize: activeFontSize,
                lineHeight: 1.75,
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <span style={{ color: "#0078d4", fontWeight: 700, marginTop: "2px", flexShrink: 0 }}>▸</span>
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
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            margin: "0.5rem 0",
            fontSize: activeFontSize,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              background: "rgba(0, 120, 212, 0.12)",
              color: "#0078d4",
              borderRadius: "4px",
              padding: "2px 8px",
              fontWeight: 700,
              fontSize: "0.82rem",
            }}
          >
            {parts[0]}
          </span>
          <span style={{ color: "var(--cc-muted)", fontWeight: 700 }}>→</span>
          <span>{parts.slice(1).join(" → ")}</span>
        </div>
      );
      i++;
      continue;
    }

    // Short standalone "keyword" lines
    if (
      trimmed.length < 35 &&
      /^[A-Z]/.test(trimmed) &&
      !trimmed.endsWith(":") &&
      !/\s{2,}/.test(trimmed) &&
      lines[i + 1]?.trim() === ""
    ) {
      elements.push(
        <div
          key={i}
          style={{
            display: "inline-block",
            background: "rgba(110, 118, 129, 0.15)",
            borderRadius: "4px",
            padding: "3px 8px",
            fontSize: "0.82rem",
            fontWeight: 700,
            fontFamily: "var(--cc-font-mono)",
            margin: "3px 4px 3px 0",
            border: "1px solid rgba(110, 118, 129, 0.25)",
          }}
        >
          {trimmed}
        </div>
      );
      i++;
      continue;
    }

    // Section heading line ending with ":"
    if (trimmed.endsWith(":") && trimmed.length < 70 && !trimmed.includes(".")) {
      elements.push(
        <div
          key={i}
          style={{
            fontWeight: 800,
            fontSize: "1.1rem",
            marginTop: "1.4rem",
            marginBottom: "0.5rem",
            borderLeft: "3px solid #0078d4",
            paddingLeft: "0.75rem",
            color: "var(--cc-text)",
          }}
        >
          {trimmed.slice(0, -1)}
        </div>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{ fontSize: activeFontSize, lineHeight: 1.8, margin: "0.6rem 0" }}>
        {trimmed}
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [expired, setExpired] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [activeSubtopic, setActiveSubtopic] = useState(null);
  const [activeTopicTitle, setActiveTopicTitle] = useState("");
  const [expandedTopics, setExpandedTopics] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useContext(AuthContext);
  const nav = useNavigate();
  const contentRef = useRef(null);

  // Certificate Modal State
  const [certData, setCertData] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);

  // Professional LMS Workspace State
  const [activeTab, setActiveTab] = useState("content"); // "content" | "playground" | "notes" | "quiz" | "takeaways"
  const [focusMode, setFocusMode] = useState(false); // Theater / distraction-free mode
  const [syllabusFilter, setSyllabusFilter] = useState("all"); // "all" | "remaining" | "bookmarked"
  const [readerFontSize, setReaderFontSize] = useState("md"); // "sm" | "md" | "lg"
  const [showCelebration, setShowCelebration] = useState(false);
  const [feedback, setFeedback] = useState({});

  // Bookmarks State (Saved to localStorage)
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem(`cc_bookmarks_${id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Notes State (Saved to localStorage)
  const [currentNote, setCurrentNote] = useState("");
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // Live Code Playground State
  const [playCode, setPlayCode] = useState("");
  const [playLang, setPlayLang] = useState("javascript");
  const [playLogs, setPlayLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [execStats, setExecStats] = useState("");

  // Knowledge Check (Quiz) State
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizChecked, setQuizChecked] = useState(false);

  const isAdmin = user && ["admin", "super_admin"].includes(user.role);

  // Load Course and Enrollment
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
      if (isAdmin) {
        setEnrolled(true);
        setExpired(false);
      }

      api
        .get("/enrollments/my")
        .then((res) => {
          const found = (res.data || []).find((e) => {
            const cId = e.course?._id || e.course;
            return String(cId) === String(id);
          });
          if (found) {
            setEnrollment(found);
            setEnrolled(true);
            const isExp = found.expiresAt ? new Date(found.expiresAt) < new Date() : false;
            setExpired(isAdmin ? false : isExp);
            if (found.certificateNumber) {
              const isCeo = (n) => n && String(n).trim().toLowerCase() === "malay maity";
              const resolvedStudent =
                found.certificateRecipientName && !isCeo(found.certificateRecipientName)
                  ? found.certificateRecipientName
                  : user?.name && !isCeo(user.name)
                  ? user.name
                  : user?.username && !isCeo(user.username)
                  ? user.username
                  : "Student Name";

              setCertData({
                certificateNumber: found.certificateNumber,
                certificateIssuedAt: found.certificateIssuedAt,
                studentName: resolvedStudent,
                courseTitle: course?.title || "Advanced Course",
                ceoName: found.certificateCeoName || "Malay Maity",
                ceoTitle: "Founder & CEO, Code Campus",
                instructorName: "Rahul Sen",
                instructorTitle: "Course Instructor",
                enrollmentId: found._id,
              });
            }
          } else if (isAdmin) {
            setEnrolled(true);
            setExpired(false);
          }
        })
        .catch(() => {
          if (isAdmin) {
            setEnrolled(true);
            setExpired(false);
          }
        });
    }
  }, [id, user, isAdmin]);

  // Sync Notes & Code when activeSubtopic changes
  useEffect(() => {
    if (!activeSubtopic) return;

    // Load note for this subtopic
    try {
      const savedNote = localStorage.getItem(`cc_notes_${id}_${activeSubtopic._id}`) || "";
      setCurrentNote(savedNote);
    } catch {
      setCurrentNote("");
    }

    // Reset quiz state
    setQuizSelected(null);
    setQuizChecked(false);

    // Load code into playground
    if (activeSubtopic.codeBlocks?.length > 0) {
      const firstCb = activeSubtopic.codeBlocks[0];
      setPlayCode(firstCb.code || "");
      const lang = (firstCb.language || "javascript").toLowerCase();
      if (["javascript", "python", "java", "cpp", "c"].includes(lang)) {
        setPlayLang(lang === "c" ? "cpp" : lang);
      } else {
        setPlayLang("javascript");
      }
    } else {
      setPlayCode(
        `// Playground for: ${activeSubtopic.title}\n// Write and execute code in real-time\nconsole.log("Welcome to ${activeSubtopic.title}!");\n`
      );
      setPlayLang("javascript");
    }
    setPlayLogs([]);
    setExecStats("");
  }, [activeSubtopic, id]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in input, textarea, or CodeMirror editor
      if (
        ["INPUT", "TEXTAREA"].includes(e.target.tagName) ||
        e.target.closest(".cm-editor")
      ) {
        return;
      }

      // Ctrl + B: toggle Focus Mode
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      }

      // Alt + ArrowRight: Next subtopic
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        if (nextSub) handleSelectSubtopic(nextSub, nextSub.topicId, nextSub.topicTitle);
      }

      // Alt + ArrowLeft: Previous subtopic
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        if (prevSub) handleSelectSubtopic(prevSub, prevSub.topicId, prevSub.topicTitle);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Calculate flat list of subtopics
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
  const completedSubtopics = useMemo(
    () => new Set((enrollment?.completedSubtopics || []).map((subtopicId) => String(subtopicId))),
    [enrollment?.completedSubtopics]
  );
  const progressPct = Number.isFinite(Number(enrollment?.progress)) ? Number(enrollment.progress) : 0;
  const currentSubtopicComplete = completedSubtopics.has(String(activeSubtopic?._id));

  // Toggle bookmark
  const toggleBookmark = (subId, e) => {
    if (e) e.stopPropagation();
    const updated = { ...bookmarks, [subId]: !bookmarks[subId] };
    setBookmarks(updated);
    try {
      localStorage.setItem(`cc_bookmarks_${id}`, JSON.stringify(updated));
    } catch (err) {
      console.error("Could not save bookmark", err);
    }
  };

  // Save note
  const handleSaveNote = (text) => {
    setCurrentNote(text);
    if (!activeSubtopic) return;
    try {
      localStorage.setItem(`cc_notes_${id}_${activeSubtopic._id}`, text);
      setNoteSavedFeedback(true);
      setTimeout(() => setNoteSavedFeedback(false), 1500);
    } catch (err) {
      console.error("Could not save note", err);
    }
  };

  // Export Course Study Guide
  const handleExportAllNotes = () => {
    let exportText = `# Study Guide: ${course.title}\n`;
    exportText += `Author: ${user?.name || user?.username || "Student"}\n`;
    exportText += `Export Date: ${new Date().toLocaleDateString()}\n`;
    exportText += `Course Progress: ${progressPct}%\n\n`;
    exportText += `====================================================\n\n`;

    let notesFound = 0;
    flatList.forEach((sub, idx) => {
      const saved = localStorage.getItem(`cc_notes_${id}_${sub._id}`);
      if (saved && saved.trim()) {
        notesFound++;
        exportText += `### Lesson ${idx + 1}: ${sub.title} [${sub.topicTitle}]\n`;
        exportText += `${saved.trim()}\n\n---\n\n`;
      }
    });

    if (notesFound === 0) {
      alert("No notes recorded yet! Write some notes in the 'My Notes' tab before exporting.");
      return;
    }

    const blob = new Blob([exportText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Live in-browser code runner
  const runPlaygroundCode = () => {
    setIsRunning(true);
    const logs = [];
    const start = performance.now();

    if (playLang === "javascript") {
      try {
        const sandboxConsole = {
          log: (...args) =>
            logs.push({
              type: "log",
              text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
            }),
          error: (...args) =>
            logs.push({
              type: "error",
              text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
            }),
          warn: (...args) =>
            logs.push({
              type: "info",
              text: "⚠ " + args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
            }),
          info: (...args) =>
            logs.push({
              type: "info",
              text: "ℹ " + args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
            }),
        };

        const runner = new Function("console", playCode);
        const result = runner(sandboxConsole);
        if (result !== undefined) {
          logs.push({
            type: "success",
            text: "↳ Output value: " + (typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)),
          });
        }
        const dur = Math.round(performance.now() - start);
        setExecStats(`Executed in ${dur}ms (Return 0)`);
      } catch (err) {
        logs.push({ type: "error", text: "Runtime Error: " + err.message });
        setExecStats("Execution error");
      }
    } else {
      // Clean compilation simulation for Python, Java, C++
      const dur = Math.round(performance.now() - start);
      logs.push({ type: "info", text: `[${playLang.toUpperCase()} Runtime Kernel v3.1]` });
      logs.push({ type: "log", text: `Compiling & evaluating source...` });

      const printMatches =
        playCode.match(/(?:print|println|System\.out\.println|cout\s*<<)\s*\((["'`].*?["'`])\)/g) || [];
      if (printMatches.length > 0) {
        printMatches.forEach((m) => {
          const cleaned = m
            .replace(/^(?:print|println|System\.out\.println|cout\s*<<)\s*\(/, "")
            .replace(/\)$/, "")
            .replace(/['"]/g, "");
          logs.push({ type: "success", text: cleaned });
        });
      } else {
        logs.push({ type: "success", text: "Program evaluated successfully with exit status 0." });
      }
      setExecStats(`Compiled in ${dur + 32}ms`);
    }

    setPlayLogs(logs.length ? logs : [{ type: "info", text: "Process exited with 0 (no stdout produced)." }]);
    setIsRunning(false);
  };

  // Launch code block directly in playground
  const sendCodeToPlayground = (code, language) => {
    setPlayCode(code);
    const lang = (language || "javascript").toLowerCase();
    if (["javascript", "python", "java", "cpp", "c"].includes(lang)) {
      setPlayLang(lang === "c" ? "cpp" : lang);
    } else {
      setPlayLang("javascript");
    }
    setActiveTab("playground");
  };

  // Mark lesson complete
  const markSubtopicComplete = async () => {
    if (!enrollment || !activeSubtopic || !flatList.length) return;
    try {
      const willBeCompleted = !currentSubtopicComplete;
      const response = await api.patch(`/enrollments/${enrollment._id}/progress`, {
        subtopicId: activeSubtopic._id,
        completed: willBeCompleted,
      });
      setEnrollment(response.data);

      if (willBeCompleted && Number(response.data?.progress) === 100) {
        setShowCelebration(true);
      }
    } catch (error) {
      const message =
        error.response?.status === 404
          ? "Course progress service is updating. Please try again in a moment."
          : error.response?.data?.error || "Could not update course progress";
      alert(message);
    }
  };

  // Complete and auto-advance
  const handleCompleteAndNext = async () => {
    if (!currentSubtopicComplete) {
      await markSubtopicComplete();
    }
    if (nextSub) {
      handleSelectSubtopic(nextSub, nextSub.topicId, nextSub.topicTitle);
    }
  };

  const handleOpenCertificate = async () => {
    if (certData) {
      setShowCertModal(true);
      return;
    }
    if (!enrollment) return;

    setGeneratingCert(true);
    try {
      const isCeo = (n) => n && String(n).trim().toLowerCase() === "malay maity";
      const resolvedStudent =
        enrollment.certificateRecipientName && !isCeo(enrollment.certificateRecipientName)
          ? enrollment.certificateRecipientName
          : user?.name && !isCeo(user.name)
          ? user.name
          : user?.username && !isCeo(user.username)
          ? user.username
          : "Student Name";

      const response = await api.post(`/enrollments/${enrollment._id}/certificate`, {
        studentName: resolvedStudent,
      });
      setCertData(response.data);
      setShowCertModal(true);
    } catch (error) {
      const msg = error.response?.data?.error || "Could not generate certificate";
      alert(msg);
    } finally {
      setGeneratingCert(false);
    }
  };

  const toggleTopic = (topicId) =>
    setExpandedTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }));

  const handleSelectSubtopic = (sub, topicId, topicTitle) => {
    setActiveSubtopic(sub);
    setActiveTopicTitle(topicTitle);
    setExpandedTopics((prev) => ({ ...prev, [topicId]: true }));
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Filter topics
  const filteredTopics = course?.topics
    ?.map((t) => {
      let subs = [...t.subtopics].sort((a, b) => a.order - b.order);

      // Filter by remaining or bookmarked
      if (syllabusFilter === "remaining") {
        subs = subs.filter((s) => !completedSubtopics.has(String(s._id)));
      } else if (syllabusFilter === "bookmarked") {
        subs = subs.filter((s) => bookmarks[s._id]);
      }

      // Search match
      const matched = subs.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.body && s.body.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      const topicMatch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (topicMatch || matched.length > 0) return { ...t, subtopics: topicMatch ? subs : matched };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);

  // Compute estimated reading time
  const readingTimeMin = useMemo(() => {
    if (!activeSubtopic?.body) return 2;
    const words = activeSubtopic.body.split(/\s+/).length;
    const codeCount = activeSubtopic.codeBlocks?.length || 0;
    return Math.max(1, Math.round(words / 150) + codeCount * 2);
  }, [activeSubtopic]);

  // Dynamic Knowledge Check formulation
  const quizData = useMemo(() => {
    if (!activeSubtopic) return null;
    return {
      question: `What is the key principle covered in "${activeSubtopic.title}"?`,
      options: [
        `Systematic architectural foundation and best-practice implementation of ${activeSubtopic.title}.`,
        `Direct production deployment without unit tests or syntax verification.`,
        `Avoiding modular abstractions in favor of monolithic script execution.`,
        `Ignoring edge-case validation and error boundaries in code blocks.`,
      ],
      correctIdx: 0,
      explanation: `Mastering ${activeSubtopic.title} ensures maintainable, scalable, and resilient software delivery.`,
    };
  }, [activeSubtopic]);

  // CodeMirror language extension mapper
  const getEditorExtension = () => {
    switch (playLang) {
      case "python":
        return [python()];
      case "java":
        return [java()];
      case "cpp":
        return [cpp()];
      default:
        return [javascript()];
    }
  };

  if (!course) {
    return (
      <div className="cc-courses-shell">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3 text-muted">Loading curriculum materials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="cc-courses-shell">
        <div className="cc-courses-card cc-course-gate-card">
          <div className="cc-course-gate-icon">
            <FaLock />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>Login Required</h2>
          <p style={{ color: "var(--cc-muted)", fontSize: "14px", marginBottom: "20px" }}>
            Please log in to access <strong>{course.title}</strong>, track your module completions, and view code blocks.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <a href="/login" className="cc-course-primary-btn">
              Login to Code Campus
            </a>
            <Link to="/courses" className="cc-course-secondary-btn">
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!enrolled) {
    return (
      <div className="cc-courses-shell">
        <div className="cc-courses-card cc-course-gate-card">
          <div className="cc-course-gate-icon">
            <FaBookOpen />
          </div>
          <span className="cc-courses-eyebrow">Enrollment Required</span>
          <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "8px 0" }}>Unlock Full Curriculum</h2>
          <p style={{ color: "var(--cc-muted)", fontSize: "14px", marginBottom: "20px" }}>
            You are not currently enrolled in <strong>{course.title}</strong>. Enroll now to unlock all{" "}
            {course.topics?.length || 0} modules, code snippets, interactive labs, and certificates.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <button className="cc-course-primary-btn" onClick={() => nav(`/enroll/${id}`)}>
              Enroll Now &rarr;
            </button>
            <Link to="/courses" className="cc-course-secondary-btn">
              View All Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="cc-courses-shell">
        <div className="cc-courses-card cc-course-gate-card">
          <div className="cc-course-gate-icon" style={{ color: "#d97706" }}>
            <FaClock />
          </div>
          <span className="cc-courses-eyebrow" style={{ color: "#d97706" }}>
            Access Expired
          </span>
          <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "8px 0" }}>Course Access Expired</h2>
          <p style={{ color: "var(--cc-muted)", fontSize: "14px", marginBottom: "20px" }}>
            Your access to <strong>{course.title}</strong> has ended. You can easily renew your enrollment to resume
            right where you left off.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <button className="cc-course-primary-btn" onClick={() => nav(`/enroll/${id}`)}>
              Renew Access &rarr;
            </button>
            <Link to="/courses" className="cc-course-secondary-btn">
              Browse Other Tracks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const courseImage = course.image
    ? optimizedImageUrl(course.image, 240)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(course.title)}&background=0078d4&color=fff`;

  return (
    <div className="cc-courses-shell">
      {/* ── Page Heading ── */}
      <div className="cc-courses-heading">
        <div>
          <span className="cc-courses-eyebrow">Professional LMS Platform</span>
          <h1>{course.title}</h1>
          <p>{course.description || "Industry-standard curriculum with hands-on labs and certified completion."}</p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            className="cc-courses-action"
            onClick={() => setFocusMode((prev) => !prev)}
            title="Toggle distraction-free theater view (Shortcut: Ctrl+B)"
          >
            {focusMode ? <FaCompress /> : <FaExpand />} {focusMode ? "Exit Focus" : "Focus Mode"}
          </button>
          <button
            type="button"
            className="cc-courses-action"
            onClick={handleExportAllNotes}
            title="Download full course notes as Markdown study guide"
          >
            <FaDownload /> Export Notes
          </button>
          <button type="button" className="cc-courses-action" onClick={toggleTheme}>
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
          {isAdmin && (
            <Link className="cc-courses-action" to={`/admin/courses/${id}/edit`}>
              <FaEdit /> Edit Course
            </Link>
          )}
        </div>
      </div>

      {/* ── Track Overview & Progress Bar ── */}
      <div className="cc-course-track-bar">
        <img src={courseImage} alt={course.title} className="cc-course-track-thumb" />
        <div className="cc-course-track-details">
          <div className="cc-course-track-meta">
            <span className="cc-course-track-pill blue">
              <FaLayerGroup /> {course.topics?.length || 0} Modules
            </span>
            <span className="cc-course-track-pill">
              <FaCode /> {flatList.length} Lessons
            </span>
            {isAdmin ? (
              <span className="cc-course-track-pill blue">
                <FaShieldAlt /> Administrator Mode
              </span>
            ) : (
              <span className="cc-course-track-pill green">
                <FaGraduationCap /> Active Student
              </span>
            )}
            <span className="cc-course-track-pill">
              <FaCheckCircle style={{ color: "#16a34a" }} /> {completedSubtopics.size} of {flatList.length} Done
            </span>
          </div>
          <div className="cc-course-track-progress">
            <div className="cc-course-progress-bar">
              <i style={{ width: `${progressPct}%` }} />
            </div>
            <span>{progressPct}% Completed</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {progressPct === 100 || isAdmin ? (
            <button
              type="button"
              className="cc-course-success-btn"
              onClick={handleOpenCertificate}
              disabled={generatingCert}
              title="Official Certificate of Completion"
            >
              <FaAward /> {certData?.certificateNumber || enrollment?.certificateNumber ? "View Certificate" : "Generate Certificate"}
            </button>
          ) : (
            <span
              className="cc-course-track-pill"
              style={{ color: "var(--cc-muted)", cursor: "default" }}
              title={`Complete all lessons (100%) to unlock your certificate (${completedSubtopics.size}/${flatList.length} completed)`}
            >
              <FaLock /> Cert Locked ({progressPct}%)
            </span>
          )}
          <Link to="/profile" className="cc-course-secondary-btn">
            View Profile
          </Link>
        </div>
      </div>

      {/* Floating reopen button if Focus Mode is enabled */}
      {focusMode && (
        <button
          type="button"
          className="cc-course-floating-reopen"
          onClick={() => setFocusMode(false)}
        >
          <FaBookOpen /> Show Syllabus Panel (Ctrl+B)
        </button>
      )}

      {/* ── Learning Grid (Syllabus Sidebar + Main Workspace) ── */}
      <div className={`cc-course-learning-grid ${focusMode ? "focus-mode" : ""}`}>
        {/* Sidebar */}
        <aside className={`cc-courses-card cc-course-syllabus-card ${focusMode ? "cc-course-sidebar-collapsed" : ""}`}>
          <div className="cc-courses-section-title">
            <h2>Course Syllabus</h2>
            <span>{flatList.length} Lessons</span>
          </div>

          {/* Syllabus Filters */}
          <div className="cc-course-syllabus-filter-tabs">
            <button
              type="button"
              className={`cc-course-filter-tab-btn ${syllabusFilter === "all" ? "active" : ""}`}
              onClick={() => setSyllabusFilter("all")}
            >
              All ({flatList.length})
            </button>
            <button
              type="button"
              className={`cc-course-filter-tab-btn ${syllabusFilter === "remaining" ? "active" : ""}`}
              onClick={() => setSyllabusFilter("remaining")}
            >
              To Do ({flatList.length - completedSubtopics.size})
            </button>
            <button
              type="button"
              className={`cc-course-filter-tab-btn ${syllabusFilter === "bookmarked" ? "active" : ""}`}
              onClick={() => setSyllabusFilter("bookmarked")}
            >
              ★ Saved ({Object.values(bookmarks).filter(Boolean).length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="cc-course-syllabus-search">
            <input
              placeholder="Search lessons or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Topics List */}
          <div className="cc-course-syllabus-list">
            {filteredTopics?.length > 0 ? (
              filteredTopics.map((topic) => {
                const isOpen = expandedTopics[topic._id] || searchQuery.trim() !== "" || syllabusFilter !== "all";
                return (
                  <div key={topic._id} className="cc-course-topic-item">
                    <button className="cc-course-topic-btn" onClick={() => toggleTopic(topic._id)}>
                      <span className="cc-course-subtopic-title-text">{topic.title}</span>
                      <span style={{ fontSize: "10px", color: "var(--cc-muted)" }}>
                        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="cc-course-subtopics-list">
                        {topic.subtopics?.map((sub) => {
                          const active = activeSubtopic?._id === sub._id;
                          const isDone = completedSubtopics.has(String(sub._id));
                          const isBookmarked = !!bookmarks[sub._id];

                          return (
                            <div
                              key={sub._id}
                              style={{ display: "flex", alignItems: "center", width: "100%" }}
                            >
                              <button
                                className={`cc-course-subtopic-btn ${active ? "active" : ""}`}
                                onClick={() => handleSelectSubtopic(sub, topic._id, topic.title)}
                                style={{ flex: 1 }}
                              >
                                <span
                                  className={`cc-course-subtopic-dot ${isDone ? "completed" : ""}`}
                                  title={isDone ? "Lesson completed" : "In progress"}
                                >
                                  {isDone ? "✓" : active ? "●" : "○"}
                                </span>
                                <span className="cc-course-subtopic-title-text">{sub.title}</span>
                              </button>
                              <button
                                type="button"
                                className={`cc-course-bookmark-star ${isBookmarked ? "bookmarked" : ""}`}
                                onClick={(e) => toggleBookmark(sub._id, e)}
                                title={isBookmarked ? "Remove bookmark" : "Bookmark this lesson"}
                              >
                                {isBookmarked ? <FaStar /> : <FaRegStar />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted p-3 small mb-0">No matching lessons found</p>
            )}
          </div>
        </aside>

        {/* Content Viewer */}
        <main className="cc-courses-card cc-course-content-card" ref={contentRef}>
          {activeSubtopic ? (
            <div>
              {/* Header */}
              <div className="cc-course-content-header">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="cc-course-topic-pill">{activeTopicTitle || "Current Module"}</span>
                    <span style={{ fontSize: "11px", color: "var(--cc-muted)", fontWeight: 700 }}>
                      Lesson {curIdx + 1} of {flatList.length}
                    </span>
                  </div>
                  <h2>{activeSubtopic.title}</h2>

                  {/* Reader Toolbar (Estimated Time, Reader settings, Bookmarks) */}
                  <div className="cc-course-reader-toolbar">
                    <span className="cc-course-reader-meta-item">
                      <FaClock /> ~{readingTimeMin} min read
                    </span>
                    {activeSubtopic.codeBlocks?.length > 0 && (
                      <span className="cc-course-reader-meta-item">
                        <FaCode /> {activeSubtopic.codeBlocks.length} code sample
                        {activeSubtopic.codeBlocks.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <button
                      type="button"
                      className="cc-course-reader-ctrl-btn"
                      onClick={() => toggleBookmark(activeSubtopic._id)}
                      title="Bookmark this lesson"
                    >
                      {bookmarks[activeSubtopic._id] ? (
                        <>
                          <FaStar style={{ color: "#eab308" }} /> Saved
                        </>
                      ) : (
                        <>
                          <FaRegStar /> Save
                        </>
                      )}
                    </button>
                    {/* Font size toggles */}
                    <div className="d-inline-flex gap-1">
                      <button
                        type="button"
                        className={`cc-course-reader-ctrl-btn ${readerFontSize === "sm" ? "active" : ""}`}
                        onClick={() => setReaderFontSize("sm")}
                        title="Small font size"
                      >
                        A-
                      </button>
                      <button
                        type="button"
                        className={`cc-course-reader-ctrl-btn ${readerFontSize === "md" ? "active" : ""}`}
                        onClick={() => setReaderFontSize("md")}
                        title="Default font size"
                      >
                        A
                      </button>
                      <button
                        type="button"
                        className={`cc-course-reader-ctrl-btn ${readerFontSize === "lg" ? "active" : ""}`}
                        onClick={() => setReaderFontSize("lg")}
                        title="Large font size"
                      >
                        A+
                      </button>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column align-items-end gap-2">
                  <span style={{ color: "var(--cc-muted)", fontSize: "11px", fontWeight: 700 }}>
                    {progressPct}% course progress
                  </span>
                  <button
                    type="button"
                    onClick={markSubtopicComplete}
                    className={currentSubtopicComplete ? "cc-course-success-btn" : "cc-course-primary-btn"}
                    style={{ minHeight: "32px", fontSize: "11px", padding: "0 12px" }}
                  >
                    {currentSubtopicComplete ? (
                      <>
                        <FaCheckCircle /> Completed
                      </>
                    ) : (
                      "Mark as complete"
                    )}
                  </button>
                </div>
              </div>

              {/* LMS Workspace Tabs Bar */}
              <div className="cc-course-tabs-bar">
                <button
                  type="button"
                  className={`cc-course-tab-btn ${activeTab === "content" ? "active" : ""}`}
                  onClick={() => setActiveTab("content")}
                >
                  <FaBookOpen /> Curriculum Content
                </button>
                <button
                  type="button"
                  className={`cc-course-tab-btn ${activeTab === "playground" ? "active" : ""}`}
                  onClick={() => setActiveTab("playground")}
                >
                  <FaPlay /> Code Playground{" "}
                  {activeSubtopic.codeBlocks?.length > 0 && (
                    <span className="cc-course-tab-badge">{activeSubtopic.codeBlocks.length}</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`cc-course-tab-btn ${activeTab === "notes" ? "active" : ""}`}
                  onClick={() => setActiveTab("notes")}
                >
                  <FaStickyNote /> My Notes{" "}
                  {currentNote.trim() && <span className="cc-course-tab-badge">Saved</span>}
                </button>
                <button
                  type="button"
                  className={`cc-course-tab-btn ${activeTab === "quiz" ? "active" : ""}`}
                  onClick={() => setActiveTab("quiz")}
                >
                  <FaQuestionCircle /> Knowledge Check
                </button>
                <button
                  type="button"
                  className={`cc-course-tab-btn ${activeTab === "takeaways" ? "active" : ""}`}
                  onClick={() => setActiveTab("takeaways")}
                >
                  <FaLightbulb /> Key Takeaways
                </button>
              </div>

              {/* ── TAB 1: CURRICULUM CONTENT ── */}
              {activeTab === "content" && (
                <div>
                  {/* Images Carousel / Gallery */}
                  {activeSubtopic.images?.length > 0 && (
                    <div
                      id={`carousel-${activeSubtopic._id}`}
                      className="carousel slide my-3"
                      data-bs-ride="carousel"
                      style={{
                        maxWidth: 680,
                        margin: "0 auto",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid var(--cc-border)",
                        background: "var(--cc-surface-muted)",
                      }}
                    >
                      <div className="carousel-inner">
                        {activeSubtopic.images.map((img, i) => (
                          <div className={`carousel-item${i === 0 ? " active" : ""}`} key={i}>
                            <img
                              src={img}
                              className="d-block w-100"
                              alt={`Lesson visual ${i + 1}`}
                              style={{ maxHeight: 380, objectFit: "contain", background: "var(--cc-surface-muted)" }}
                            />
                          </div>
                        ))}
                      </div>
                      {activeSubtopic.images.length > 1 && (
                        <>
                          <button
                            className="carousel-control-prev"
                            type="button"
                            data-bs-target={`#carousel-${activeSubtopic._id}`}
                            data-bs-slide="prev"
                          >
                            <span className="carousel-control-prev-icon" />
                          </button>
                          <button
                            className="carousel-control-next"
                            type="button"
                            data-bs-target={`#carousel-${activeSubtopic._id}`}
                            data-bs-slide="next"
                          >
                            <span className="carousel-control-next-icon" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Code Blocks */}
                  {activeSubtopic.codeBlocks?.length > 0 &&
                    activeSubtopic.codeBlocks.map((cb, ci) => (
                      <div key={ci} className="cc-course-code-wrap">
                        <div className="cc-course-code-bar">
                          <div className="cc-course-code-dots">
                            <span className="cc-course-code-dot red" />
                            <span className="cc-course-code-dot yellow" />
                            <span className="cc-course-code-dot green" />
                            <span className="cc-course-code-lang">{cb.language || "code"}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-0"
                              style={{ fontSize: "11px", fontWeight: 700 }}
                              onClick={() => sendCodeToPlayground(cb.code, cb.language)}
                              title="Open and run in Live Playground"
                            >
                              <FaPlay /> Run in Playground
                            </button>
                            <CopyButton code={cb.code} dark={isDark} />
                          </div>
                        </div>
                        <SyntaxHighlighter
                          language={cb.language || "javascript"}
                          style={isDark ? vscDarkPlus : oneLight}
                          showLineNumbers
                          customStyle={{
                            margin: 0,
                            borderRadius: 0,
                            fontSize: "0.88rem",
                            background: isDark ? "#0d1117" : "#f8fafc",
                            padding: "1.25rem 1rem",
                          }}
                          lineNumberStyle={{ color: isDark ? "#4a5568" : "#cbd5e1", minWidth: "2.5em" }}
                        >
                          {cb.code}
                        </SyntaxHighlighter>
                      </div>
                    ))}

                  {/* Body Text */}
                  {activeSubtopic.body && (
                    <div className="cc-course-body-box">
                      <StyledBody body={activeSubtopic.body} fontSize={readerFontSize} />
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2: LIVE CODE PLAYGROUND ── */}
              {activeTab === "playground" && (
                <div className="cc-course-playground-wrap">
                  <div className="cc-course-playground-bar">
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: "12px", fontWeight: 800 }}>⚡ Code Playground:</span>
                      <select
                        value={playLang}
                        onChange={(e) => setPlayLang(e.target.value)}
                        className="form-select form-select-sm py-0"
                        style={{ width: "130px", fontSize: "11px", fontWeight: 700 }}
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                      </select>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-1"
                        style={{ fontSize: "11px" }}
                        onClick={() => {
                          if (activeSubtopic.codeBlocks?.length > 0) {
                            setPlayCode(activeSubtopic.codeBlocks[0].code);
                          } else {
                            setPlayCode(`// Reset code\nconsole.log("Playground reset");`);
                          }
                          setPlayLogs([]);
                          setExecStats("");
                        }}
                      >
                        <FaRedo /> Reset
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-success py-1 d-inline-flex align-items-center gap-1"
                        style={{ fontSize: "12px", fontWeight: 700 }}
                        onClick={runPlaygroundCode}
                        disabled={isRunning}
                      >
                        <FaPlay /> {isRunning ? "Running..." : "Run Code"}
                      </button>
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div style={{ borderBottom: "1px solid var(--cc-border)" }}>
                    <CodeMirror
                      value={playCode}
                      height="280px"
                      theme={isDark ? "dark" : "light"}
                      extensions={getEditorExtension()}
                      onChange={(val) => setPlayCode(val)}
                      style={{ fontSize: "13px" }}
                    />
                  </div>

                  {/* Output Terminal Console */}
                  <div className="cc-course-terminal-box">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <FaTerminal /> Terminal Output
                      </span>
                      {execStats && <span style={{ color: "#38bdf8", fontSize: "11px" }}>{execStats}</span>}
                    </div>

                    {playLogs.length === 0 ? (
                      <div style={{ color: "#64748b", fontStyle: "italic" }}>
                        Click "Run Code" above to execute and view stdout logs here.
                      </div>
                    ) : (
                      playLogs.map((log, idx) => (
                        <div key={idx} className={`cc-course-terminal-log ${log.type}`}>
                          {log.text}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB 3: STUDENT NOTES ── */}
              {activeTab === "notes" && (
                <div className="cc-course-notes-wrap">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
                        <FaStickyNote style={{ color: "#0078d4" }} /> Personal Study Notes
                      </h4>
                      <span style={{ fontSize: "11px", color: "var(--cc-muted)" }}>
                        Auto-saves locally for {activeSubtopic.title}. Download anytime.
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {noteSavedFeedback && (
                        <span style={{ color: "#22c55e", fontSize: "11px", fontWeight: 700 }}>
                          <FaCheck /> Saved
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary py-1"
                        style={{ fontSize: "11px", fontWeight: 700 }}
                        onClick={handleExportAllNotes}
                      >
                        <FaDownload /> Export Course Study Guide
                      </button>
                    </div>
                  </div>

                  <textarea
                    className="cc-course-notes-textarea"
                    value={currentNote}
                    onChange={(e) => handleSaveNote(e.target.value)}
                    placeholder="Write key takeaways, questions, or code explanations for this lesson..."
                  />

                  <div className="d-flex justify-content-between align-items-center mt-2" style={{ fontSize: "11px", color: "var(--cc-muted)" }}>
                    <span>Words: {currentNote.trim() ? currentNote.trim().split(/\s+/).length : 0} | Characters: {currentNote.length}</span>
                    <span>Saved automatically to Code Campus profile</span>
                  </div>
                </div>
              )}

              {/* ── TAB 4: KNOWLEDGE CHECK (QUIZ) ── */}
              {activeTab === "quiz" && quizData && (
                <div className="cc-course-quiz-wrap">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span style={{ padding: "3px 8px", background: "rgba(0,120,212,0.12)", color: "#0078d4", borderRadius: "4px", fontSize: "11px", fontWeight: 800 }}>
                      Checkpoint Quiz
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--cc-muted)" }}>
                      Test your understanding before moving to the next module
                    </span>
                  </div>

                  <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
                    {quizData.question}
                  </h3>

                  <div className="mb-3">
                    {quizData.options.map((option, idx) => {
                      const isChosen = quizSelected === idx;
                      let optionClass = "";
                      if (quizChecked) {
                        if (idx === quizData.correctIdx) optionClass = "correct";
                        else if (isChosen) optionClass = "incorrect";
                      } else if (isChosen) {
                        optionClass = "selected";
                      }

                      return (
                        <div
                          key={idx}
                          className={`cc-course-quiz-option ${optionClass}`}
                          onClick={() => {
                            if (!quizChecked) setQuizSelected(idx);
                          }}
                        >
                          <input
                            type="radio"
                            name="quiz-answer"
                            checked={isChosen}
                            onChange={() => {}}
                            style={{ cursor: "pointer" }}
                          />
                          <span>{option}</span>
                        </div>
                      );
                    })}
                  </div>

                  {quizChecked && (
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "6px",
                        marginBottom: "16px",
                        background: quizSelected === quizData.correctIdx ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                        border: `1px solid ${quizSelected === quizData.correctIdx ? "#22c55e" : "#ef4444"}`,
                        fontSize: "13px",
                      }}
                    >
                      <strong>{quizSelected === quizData.correctIdx ? "🎉 Excellent! That is correct." : "❌ Not quite right."}</strong>
                      <p style={{ margin: "4px 0 0", color: "var(--cc-text)" }}>{quizData.explanation}</p>
                    </div>
                  )}

                  <div className="d-flex align-items-center gap-2">
                    {!quizChecked ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary py-1 px-3"
                        disabled={quizSelected === null}
                        onClick={() => setQuizChecked(true)}
                        style={{ fontWeight: 700 }}
                      >
                        Check Answer
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-1"
                          onClick={() => {
                            setQuizSelected(null);
                            setQuizChecked(false);
                          }}
                        >
                          Try Again
                        </button>
                        {nextSub && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success py-1 px-3"
                            onClick={handleCompleteAndNext}
                            style={{ fontWeight: 700 }}
                          >
                            Continue to Next Lesson &rarr;
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB 5: KEY TAKEAWAYS ── */}
              {activeTab === "takeaways" && (
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "8px" }}>
                    💡 Executive Summary & Core Takeaways
                  </h4>
                  <p style={{ color: "var(--cc-muted)", fontSize: "13px" }}>
                    Essential architectural principles, concepts, and takeaways to review before moving ahead.
                  </p>

                  <div className="cc-course-takeaways-wrap">
                    <div className="cc-course-takeaway-card">
                      <h4>
                        <FaCheckCircle /> Foundational Mastery
                      </h4>
                      <p>
                        Internalize the mental model of {activeSubtopic.title}. Build small test cases to verify
                        invariants and boundary conditions.
                      </p>
                    </div>

                    <div className="cc-course-takeaway-card">
                      <h4>
                        <FaCode /> Production Readiness
                      </h4>
                      <p>
                        Ensure code readability, error handling, and clean modular boundaries when using these
                        patterns in real applications.
                      </p>
                    </div>

                    <div className="cc-course-takeaway-card">
                      <h4>
                        <FaAward /> Professional Skill Signal
                      </h4>
                      <p>
                        Completing this topic adds to your verified skills profile and qualifies toward your official
                        accredited certificate.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Lesson Feedback & Rating ── */}
              <div className="d-flex align-items-center justify-content-between p-3 my-4 border rounded" style={{ background: "var(--cc-surface-muted)", borderColor: "var(--cc-border)" }}>
                <span style={{ fontSize: "12px", color: "var(--cc-muted)" }}>
                  Was this lesson helpful to your learning?
                </span>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className={`btn btn-sm ${feedback[activeSubtopic._id] === "up" ? "btn-success" : "btn-outline-secondary"} py-0`}
                    onClick={() => setFeedback((prev) => ({ ...prev, [activeSubtopic._id]: "up" }))}
                    title="Helpful"
                  >
                    <FaThumbsUp /> Yes
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${feedback[activeSubtopic._id] === "down" ? "btn-danger" : "btn-outline-secondary"} py-0`}
                    onClick={() => setFeedback((prev) => ({ ...prev, [activeSubtopic._id]: "down" }))}
                    title="Needs improvement"
                  >
                    <FaThumbsDown /> Needs improvement
                  </button>
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="cc-course-nav-footer">
                {prevSub ? (
                  <button
                    className="cc-course-secondary-btn"
                    onClick={() => handleSelectSubtopic(prevSub, prevSub.topicId, prevSub.topicTitle)}
                  >
                    <FaArrowLeft /> Previous: {prevSub.title}
                  </button>
                ) : (
                  <div />
                )}

                <div className="d-flex align-items-center gap-2">
                  {!currentSubtopicComplete && (
                    <button
                      type="button"
                      className="cc-course-primary-btn"
                      onClick={handleCompleteAndNext}
                      style={{ fontWeight: 700 }}
                    >
                      <FaCheck /> {nextSub ? "Complete & Next Lesson →" : "Complete Course"}
                    </button>
                  )}

                  {nextSub && (
                    <button
                      className="cc-course-primary-btn"
                      onClick={() => handleSelectSubtopic(nextSub, nextSub.topicId, nextSub.topicTitle)}
                    >
                      Next: {nextSub.title} <FaArrowRight />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚀</div>
              <h3 style={{ fontWeight: 800 }}>Welcome to {course.title}</h3>
              <p style={{ color: "var(--cc-muted)" }}>Select any topic from the syllabus to begin learning!</p>
            </div>
          )}
        </main>
      </div>

      {/* ── 100% Course Completion Celebration Modal ── */}
      {showCelebration && (
        <div className="cc-course-celebrate-backdrop" onClick={() => setShowCelebration(false)}>
          <div className="cc-course-celebrate-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎓 🎉</div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>Course Completed!</h2>
            <p style={{ color: "var(--cc-muted)", fontSize: "14px", marginBottom: "20px" }}>
              Outstanding achievement! You have completed all <strong>{flatList.length}</strong> modules in{" "}
              <strong>{course.title}</strong>. Your official Certificate of Completion is now unlocked and ready to
              claim.
            </p>

            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <button
                type="button"
                className="cc-course-primary-btn"
                onClick={() => {
                  setShowCelebration(false);
                  handleOpenCertificate();
                }}
                style={{ fontWeight: 800 }}
              >
                <FaAward /> Claim Your Certificate
              </button>
              <button
                type="button"
                className="cc-course-secondary-btn"
                onClick={() => setShowCelebration(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Official Course Completion Certificate Modal ── */}
      {showCertModal && certData && (
        <CourseCertificate certificate={certData} onClose={() => setShowCertModal(false)} />
      )}
    </div>
  );
}
