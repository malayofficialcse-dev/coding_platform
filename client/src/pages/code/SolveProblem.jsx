import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AceEditor from "react-ace";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import RunButton from "../../assets/play-solid-full.svg";
import CopyButton from "../../assets/copy-regular-full.svg";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaPlay,
  FaPause,
  FaRedo,
  FaArrowLeft,
  FaArrowRight,
  FaCopy,
  FaBookOpen,
  FaLightbulb,
  FaHistory,
  FaStickyNote,
  FaExclamationTriangle,
  FaClock,
  FaMemory,
  FaBolt,
  FaCode,
  FaTerminal,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import "./SolveProblem.css";

import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/theme-solarized_light";
import "ace-builds/src-noconflict/theme-tomorrow_night";

const languageNames = {
  javascript: "JavaScript",
  python3: "Python 3",
  cpp: "C++",
  java: "Java",
};

function mapAceMode(language) {
  if (language === "python3") return "python";
  if (language === "cpp") return "c_cpp";
  if (language === "java") return "java";
  return "javascript";
}

function getDefaultBoilerplate(problem, language) {
  if (problem?.boilerplateCodes?.[language]) {
    return problem.boilerplateCodes[language];
  }
  const title = problem?.title || "Solution";
  if (language === "javascript") {
    return `/**\n * Problem: ${title}\n * Read from stdin, write to stdout\n */\nconst lines = require('fs').readFileSync(0, 'utf-8').trim().split('\\n');\n\nfunction solve(lines) {\n  // TODO: implement your solution\n  // Example: parse inputs from lines[]\n  const n = parseInt(lines[0]);\n  const nums = lines[1].split(' ').map(Number);\n  \n  // Your logic here...\n  \n  console.log(/* your answer */);\n}\n\nsolve(lines);\n`;
  }
  if (language === "python3") {
    return `import sys\ninput = sys.stdin.read().split('\\n')\n\ndef solve():\n    # TODO: implement your solution\n    # Example: parse inputs\n    n = int(input[0])\n    nums = list(map(int, input[1].split()))\n    \n    # Your logic here...\n    \n    print(# your answer)\n\nsolve()\n`;
  }
  if (language === "cpp") {
    return `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // TODO: read input\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int& x : a) cin >> x;\n    \n    // Your logic here...\n    \n    // Output answer\n    cout << /* answer */ << "\\n";\n    return 0;\n}\n`;
  }
  if (language === "java") {
    return `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n        // TODO: read input\n        int n = sc.nextInt();\n        int[] a = new int[n];\n        for (int i = 0; i < n; i++) a[i] = sc.nextInt();\n        \n        // Your logic here...\n        \n        // Output answer\n        System.out.println(/* answer */);\n    }\n}\n`;
  }
  return "";
}

function getDefaultEditorial(problem, language) {
  const title = problem?.title || "Challenge";
  const topic = problem?.dsaTopic || "Algorithms";
  const diff = problem?.difficulty || "Easy";

  let codeSnippet = "";
  if (language === "javascript") {
    codeSnippet = `const lines = require('fs').readFileSync(0, 'utf-8').trim().split('\\n');\n\nfunction solve(lines) {\n  const n = parseInt(lines[0]);\n  const nums = lines[1].split(' ').map(Number);\n  \n  // Optimal approach for ${title}\n  let result = 0;\n  // ... implementation\n  \n  console.log(result);\n}\n\nsolve(lines);`;
  } else if (language === "python3") {
    codeSnippet = `import sys\ninput = sys.stdin.read().split('\\n')\n\ndef solve():\n    n = int(input[0])\n    nums = list(map(int, input[1].split()))\n    \n    # Optimal approach for ${title}\n    result = 0\n    # ... implementation\n    \n    print(result)\n\nsolve()`;
  } else if (language === "cpp") {
    codeSnippet = `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int& x : a) cin >> x;\n    \n    // Optimal approach for ${title}\n    int result = 0;\n    // ... implementation\n    \n    cout << result << "\\n";\n    return 0;\n}`;
  } else {
    codeSnippet = `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] a = new int[n];\n        for (int i = 0; i < n; i++) a[i] = sc.nextInt();\n        \n        // Optimal approach for ${title}\n        int result = 0;\n        // ... implementation\n        \n        System.out.println(result);\n    }\n}`;
  }

  return {
    approach: `For "${title}" (${topic} - ${diff}): Analyze the constraints carefully. Identify the key insight that reduces brute-force complexity. Consider edge cases: empty arrays, single elements, and boundary values.`,
    timeComplexity: diff === "Hard" ? "O(N log N)" : diff === "Medium" ? "O(N)" : "O(N)",
    spaceComplexity: "O(1) Auxiliary",
    code: problem?.solutionCodes?.[language] || codeSnippet,
  };
}

// ---- Verdict color map ----
const VERDICT_CONFIG = {
  Accepted:            { color: "#22c55e", bg: "rgba(34,197,94,0.12)",   icon: "✓",  label: "Accepted" },
  "Wrong Answer":      { color: "#ef4444", bg: "rgba(239,68,68,0.12)",    icon: "✗",  label: "Wrong Answer" },
  "Compilation Error": { color: "#f97316", bg: "rgba(249,115,22,0.12)",   icon: "⚠",  label: "Compilation Error" },
  "Runtime Error":     { color: "#a855f7", bg: "rgba(168,85,247,0.12)",   icon: "⚡", label: "Runtime Error" },
  "Time Limit Exceeded":{ color: "#eab308", bg: "rgba(234,179,8,0.12)",   icon: "⏱", label: "Time Limit Exceeded" },
  "Skipped":           { color: "#6b7280", bg: "rgba(107,114,128,0.12)",  icon: "—",  label: "Skipped" },
  Executed:            { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",   icon: "▶",  label: "Executed" },
};

function VerdictChip({ verdict, size = "md" }) {
  const cfg = VERDICT_CONFIG[verdict] || { color: "#9ca3af", bg: "rgba(156,163,175,0.12)", icon: "?", label: verdict };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}40`,
        borderRadius: 6,
        padding: size === "lg" ? "6px 14px" : "3px 10px",
        fontSize: size === "lg" ? 15 : 12,
        fontWeight: 600,
        letterSpacing: "0.01em",
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ---- Test Case Result Item ----
function TestResultItem({ result, index, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG["Wrong Answer"];
  const passed = result.verdict === "Accepted";

  return (
    <div
      style={{
        border: `1px solid ${cfg.color}40`,
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: cfg.bg,
          border: "none",
          cursor: "pointer",
          color: "var(--ink)",
          textAlign: "left",
        }}
      >
        <span style={{ color: cfg.color, fontWeight: 700, fontSize: 14 }}>{cfg.icon}</span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Case {index + 1}</span>
        <VerdictChip verdict={result.verdict} />
        <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: 12 }}>
          {open ? <FaChevronDown /> : <FaChevronRight />}
        </span>
      </button>

      {open && (
        <div style={{ padding: "12px 14px", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 10 }}>
          {result.input && result.input !== "[Hidden]" && result.input !== "[Skipped]" && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Input</div>
              <pre style={{ margin: 0, padding: "8px 12px", background: "var(--code-bg, #1a1a2e)", borderRadius: 6, fontSize: 13, color: "#e2e8f0", overflowX: "auto", maxHeight: 120, overflowY: "auto" }}>{result.input}</pre>
            </div>
          )}
          {result.expectedOutput && result.expectedOutput !== "[Hidden]" && result.expectedOutput !== "[Skipped]" && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Expected Output</div>
              <pre style={{ margin: 0, padding: "8px 12px", background: "var(--code-bg, #1a1a2e)", borderRadius: 6, fontSize: 13, color: "#22c55e", overflowX: "auto" }}>{result.expectedOutput}</pre>
            </div>
          )}
          {result.actualOutput !== undefined && result.verdict !== "Skipped" && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Output</div>
              <pre style={{ margin: 0, padding: "8px 12px", background: "var(--code-bg, #1a1a2e)", borderRadius: 6, fontSize: 13, color: passed ? "#22c55e" : "#ef4444", overflowX: "auto" }}>
                {result.actualOutput || "(empty output)"}
              </pre>
            </div>
          )}
          {result.stderr && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Error / Stderr</div>
              <pre style={{ margin: 0, padding: "8px 12px", background: "#1a0a2e", borderRadius: 6, fontSize: 12, color: "#c4b5fd", overflowX: "auto", maxHeight: 150, overflowY: "auto" }}>{result.stderr}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SolveProblem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext || {});

  const [problem, setProblem] = useState(null);
  const [allProblems, setAllProblems] = useState([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("dracula");
  const [font, setFont] = useState(15);

  // Judge state
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [customResult, setCustomResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runMode, setRunMode] = useState(null); // 'run' | 'submit' | 'custom'

  const [activeTab, setActiveTab] = useState("description");
  const [outputTab, setOutputTab] = useState("testcases"); // 'testcases' | 'custom'
  const [customInput, setCustomInput] = useState("");
  const [selectedResultCase, setSelectedResultCase] = useState(0);

  // Submissions state
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Editorial
  const [editorialLang, setEditorialLang] = useState("javascript");
  const [copiedSolution, setCopiedSolution] = useState(false);

  // Notes
  const [userNotes, setUserNotes] = useState("");

  // Stopwatch
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => setTimerSeconds((p) => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const p = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${p(h)}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
  };

  useEffect(() => {
    api.get("/coding/problems").then((r) => setAllProblems(r.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!id) { navigate("/coding"); return; }
    api.get(`/coding/problems/${id}`).then((r) => {
      setProblem(r.data);
      setCode(getDefaultBoilerplate(r.data, language));
      setRunResult(null);
      setSubmitResult(null);
      setCustomResult(null);
      setSelectedResultCase(0);
      const notes = localStorage.getItem(`codecampus_notes_${id}`);
      setUserNotes(notes || "");
    }).catch(() => alert("Failed to load problem"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  useEffect(() => {
    if (problem) setCode(getDefaultBoilerplate(problem, language));
  }, [language, problem]);

  useEffect(() => {
    if (activeTab === "submissions" && user) {
      setLoadingSubmissions(true);
      api.get("/coding/submissions/my")
        .then((r) => {
          setSubmissions((r.data || []).filter((s) => String(s.problem?._id || s.problem) === String(id)));
        })
        .catch(console.error)
        .finally(() => setLoadingSubmissions(false));
    }
  }, [activeTab, id, user]);

  const saveNotes = (val) => {
    setUserNotes(val);
    localStorage.setItem(`codecampus_notes_${id}`, val);
  };

  const sampleTestCases = useMemo(() => {
    const cases = problem?.sampleTestCases?.length
      ? problem.sampleTestCases
      : problem?.testCases?.slice(0, 3) || [];
    return cases.filter((tc) => tc.visible !== false);
  }, [problem]);

  const currentIndex = allProblems.findIndex((p) => p._id === id);
  const prevProblem = currentIndex > 0 ? allProblems[currentIndex - 1] : null;
  const nextProblem = currentIndex >= 0 && currentIndex < allProblems.length - 1 ? allProblems[currentIndex + 1] : null;

  // ---- Run Code (sample tests only) ----
  async function handleRun() {
    if (!code.trim()) return alert("Please write some code first.");
    setRunning(true);
    setRunMode("run");
    setRunResult(null);
    setSubmitResult(null);
    setCustomResult(null);
    setOutputTab("testcases");
    try {
      const res = await api.post(`/coding/problems/${id}/run`, { code, language });
      setRunResult(res.data);
      setSelectedResultCase(0);
    } catch (e) {
      setRunResult({ error: e?.response?.data?.error || e.message });
    } finally {
      setRunning(false);
      setRunMode(null);
    }
  }

  // ---- Submit Code (all tests) ----
  async function handleSubmit() {
    if (!code.trim()) return alert("Please write some code first.");
    if (!user) return alert("Please log in to submit solutions.");
    setRunning(true);
    setRunMode("submit");
    setRunResult(null);
    setSubmitResult(null);
    setCustomResult(null);
    setOutputTab("testcases");
    try {
      const res = await api.post(`/coding/problems/${id}/submit`, { code, language });
      setSubmitResult(res.data);
      setSelectedResultCase(0);
      if (res.data?.result === "Accepted") {
        api.get("/coding/submissions/my").then((r) => {
          setSubmissions((r.data || []).filter((s) => String(s.problem?._id || s.problem) === String(id)));
        });
      }
    } catch (e) {
      setSubmitResult({ error: e?.response?.data?.error || e.message });
    } finally {
      setRunning(false);
      setRunMode(null);
    }
  }

  // ---- Run Custom Input ----
  async function handleCustomRun() {
    if (!code.trim()) return alert("Please write some code first.");
    setRunning(true);
    setRunMode("custom");
    setCustomResult(null);
    setOutputTab("custom");
    try {
      const res = await api.post(`/coding/problems/${id}/run`, { code, language, customInput });
      setCustomResult(res.data);
    } catch (e) {
      setCustomResult({ error: e?.response?.data?.error || e.message });
    } finally {
      setRunning(false);
      setRunMode(null);
    }
  }

  const editorialData = useMemo(() => getDefaultEditorial(problem, editorialLang), [problem, editorialLang]);

  if (!problem) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh", flexDirection: "column", gap: 16 }}>
      <div className="sp-spinner" />
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading coding workspace…</p>
    </div>
  );

  const acceptance = problem.acceptanceRate || "—";
  const currentActiveResult = runResult || submitResult;
  const currentResultCases = currentActiveResult?.results || [];

  return (
    <main className="cc-coding-shell">
      {/* ── Top Header Bar ── */}
      <div className="cc-coding-topbar">
        <div className="cc-topbar-left">
          <div className="cc-coding-breadcrumb">
            <Link to="/coding" className="text-decoration-none text-muted">Practice</Link>{" "}
            <span>/</span> {problem.dsaTopic || "Problems"}{" "}
            <span>/</span> <strong>{problem.title}</strong>
          </div>
          <div className="cc-problem-nav-btns">
            <button
              className="cc-nav-arrow-btn"
              disabled={!prevProblem}
              onClick={() => prevProblem && navigate(`/coding/problems/${prevProblem._id}`)}
              title={prevProblem?.title}
            >
              <FaArrowLeft /> Prev
            </button>
            <button
              className="cc-nav-arrow-btn"
              disabled={!nextProblem}
              onClick={() => nextProblem && navigate(`/coding/problems/${nextProblem._id}`)}
              title={nextProblem?.title}
            >
              Next <FaArrowRight />
            </button>
          </div>
        </div>

        <div className="cc-coding-meta">
          <div className="cc-timer-badge">
            <span>⏱ {formatTimer(timerSeconds)}</span>
            <button className="cc-timer-ctrl-btn" onClick={() => setTimerRunning((r) => !r)}>
              {timerRunning ? <FaPause /> : <FaPlay />}
            </button>
            <button className="cc-timer-ctrl-btn" onClick={() => { setTimerRunning(false); setTimerSeconds(0); }}>
              <FaRedo />
            </button>
          </div>
          <span className={`cc-status-chip ${String(problem.difficulty || "Easy").toLowerCase()}`}>
            {problem.difficulty || "Easy"}
          </span>
          <span>✓ {acceptance}{typeof acceptance === "number" ? "%" : ""}</span>
          <span>◷ {problem.timeLimit || "2.0s"}</span>
          <span>◈ {problem.memoryLimit || "256 MB"}</span>
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div className="cc-coding-workspace">
        {/* ─ LEFT: Problem Panel ─ */}
        <section className="cc-problem-column">
          {/* Tab Nav */}
          <div className="cc-coding-tabs" role="tablist">
            <button className={activeTab === "description" ? "active" : ""} onClick={() => setActiveTab("description")}>
              <FaBookOpen /> Description
            </button>
            <button className={activeTab === "editorial" ? "active" : ""} onClick={() => setActiveTab("editorial")}>
              <FaLightbulb /> Editorial
            </button>
            <button className={activeTab === "submissions" ? "active" : ""} onClick={() => setActiveTab("submissions")}>
              <FaHistory /> Submissions {submissions.length > 0 && `(${submissions.length})`}
            </button>
            <button className={activeTab === "discussions" ? "active" : ""} onClick={() => setActiveTab("discussions")}>
              <FaStickyNote /> Notes
            </button>
          </div>

          {/* ── TAB 1: DESCRIPTION ── */}
          {activeTab === "description" && (
            <>
              {/* Problem Meta */}
              <div className="sp-meta-strip">
                <span className={`sp-diff-badge ${String(problem.difficulty).toLowerCase()}`}>{problem.difficulty}</span>
                <span className="sp-topic-badge"><FaCode /> {problem.dsaTopic}</span>
                {(problem.tags || []).map((tag) => (
                  <span key={tag} className="sp-tag-badge">{tag}</span>
                ))}
              </div>

              <article className="cc-problem-card cc-description-card">
                <div className="cc-section-kicker">Problem Statement</div>
                <div className="cc-problem-description" style={{ whiteSpace: "pre-wrap" }}>
                  {problem.description || "Read input from stdin and write the expected result to stdout."}
                </div>
              </article>

              {/* Constraints */}
              {problem.constraints && (
                <article className="cc-problem-card">
                  <div className="cc-section-kicker">Constraints</div>
                  <pre style={{ margin: 0, fontSize: 13, color: "var(--ink)", whiteSpace: "pre-wrap" }}>{problem.constraints}</pre>
                </article>
              )}

              {/* Sample Test Cases */}
              {sampleTestCases.length > 0 && (
                <article className="cc-problem-card">
                  <div className="cc-section-heading">
                    <span>Examples</span>
                    <span className="cc-muted">{sampleTestCases.length} sample cases</span>
                  </div>
                  {sampleTestCases.map((tc, idx) => (
                    <div key={idx} className="sp-example-block">
                      <div className="sp-example-label">Example {idx + 1}</div>
                      <div className="sp-io-row">
                        <div className="sp-io-box">
                          <div className="sp-io-label">Input</div>
                          <pre className="sp-io-code">{tc.input || "(empty)"}</pre>
                        </div>
                        <div className="sp-io-box">
                          <div className="sp-io-label">Output</div>
                          <pre className="sp-io-code">{tc.output || "(empty)"}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </article>
              )}

              {/* Hints */}
              {problem.hints?.length > 0 && (
                <article className="cc-problem-card">
                  <div className="cc-section-kicker">Hints</div>
                  {problem.hints.map((hint, i) => (
                    <details key={i} className="sp-hint-details">
                      <summary>Hint {i + 1}</summary>
                      <p>{hint}</p>
                    </details>
                  ))}
                </article>
              )}
            </>
          )}

          {/* ── TAB 2: EDITORIAL ── */}
          {activeTab === "editorial" && (
            <article className="cc-problem-card cc-editorial-card">
              <div className="cc-section-kicker">Optimal Approach & Complexity</div>
              <div className="cc-editorial-section">
                <h4>Approach & Intuition</h4>
                <p className="cc-problem-description mb-3">{editorialData.approach}</p>
                <div className="cc-complexity-grid">
                  <div className="cc-complexity-box">
                    <span className="cc-complexity-title">Time Complexity</span>
                    <div className="cc-complexity-val">{editorialData.timeComplexity}</div>
                  </div>
                  <div className="cc-complexity-box">
                    <span className="cc-complexity-title">Space Complexity</span>
                    <div className="cc-complexity-val">{editorialData.spaceComplexity}</div>
                  </div>
                </div>
              </div>

              <div className="cc-editorial-section mt-2">
                <h4>Reference Solution</h4>
                <div className="cc-solution-code-block">
                  <div className="cc-solution-code-header">
                    <select value={editorialLang} onChange={(e) => setEditorialLang(e.target.value)}>
                      <option value="javascript">JavaScript</option>
                      <option value="python3">Python 3</option>
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                    </select>
                    <div className="cc-solution-actions">
                      <button onClick={() => { navigator.clipboard?.writeText(editorialData.code); setCopiedSolution(true); setTimeout(() => setCopiedSolution(false), 2000); }}>
                        <FaCopy /> {copiedSolution ? "Copied!" : "Copy"}
                      </button>
                      <button onClick={() => { if (window.confirm("Load reference solution into editor?")) { setCode(editorialData.code); setLanguage(editorialLang); } }}>
                        Load to Editor
                      </button>
                    </div>
                  </div>
                  <pre className="cc-solution-code-pre">{editorialData.code}</pre>
                </div>
              </div>
            </article>
          )}

          {/* ── TAB 3: SUBMISSIONS ── */}
          {activeTab === "submissions" && (
            <article className="cc-problem-card">
              <div className="cc-section-kicker">Submissions History</div>
              {!user ? (
                <div className="text-center py-4"><p className="cc-muted">Please log in to view submissions.</p></div>
              ) : loadingSubmissions ? (
                <div className="text-center py-4"><div className="sp-spinner" /></div>
              ) : submissions.length === 0 ? (
                <div className="sp-empty-state">
                  <FaHistory style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }} />
                  <p>No submissions yet. Write a solution and submit!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="cc-submissions-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Language</th>
                        <th>Tests</th>
                        <th>Submitted</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr key={sub._id}>
                          <td>
                            <VerdictChip verdict={sub.result} />
                          </td>
                          <td>{languageNames[sub.language] || sub.language}</td>
                          <td>
                            <span style={{ color: sub.passedCount === sub.totalCount ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                              {sub.passedCount ?? 0}/{sub.totalCount ?? 0}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(sub.createdAt).toLocaleString()}</td>
                          <td>
                            {sub.code && (
                              <button className="cc-load-code-btn" onClick={() => { if (window.confirm("Load this code into editor?")) { setCode(sub.code); if (sub.language) setLanguage(sub.language); } }}>
                                Restore
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          )}

          {/* ── TAB 4: NOTES ── */}
          {activeTab === "discussions" && (
            <article className="cc-problem-card">
              <div className="cc-section-kicker">My Scratchpad & Notes</div>
              <p className="cc-muted mb-2">Saved locally per problem. Write your intuition, edge cases, or strategy.</p>
              <textarea
                className="cc-notes-textarea"
                placeholder="E.g. Remember to handle negative numbers..."
                value={userNotes}
                onChange={(e) => saveNotes(e.target.value)}
              />
              <div className="mt-4">
                <div className="cc-section-kicker">Tips</div>
                <div className="cc-tip-list">
                  <div className="cc-tip-item"><strong>Stdin Format:</strong> Read all input at once, then parse line by line.</div>
                  <div className="cc-tip-item"><strong>Edge Cases:</strong> Empty arrays, single elements, max constraints.</div>
                  <div className="cc-tip-item"><strong>Fast I/O (C++):</strong> Use <code>ios_base::sync_with_stdio(false); cin.tie(NULL);</code></div>
                </div>
              </div>
            </article>
          )}
        </section>

        {/* ─ RIGHT: Editor + Judge Output ─ */}
        <section className="cc-editor-column">
          {/* Editor Toolbar */}
          <div className="cc-editor-toolbar">
            <label>
              <span>Language</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="python3">Python 3</option>
                <option value="cpp">C++ (GCC)</option>
                <option value="java">Java</option>
              </select>
            </label>
            <label>
              <span>Theme</span>
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="dracula">Dracula</option>
                <option value="monokai">Monokai</option>
                <option value="tomorrow_night">Tomorrow Night</option>
                <option value="github">GitHub (Light)</option>
                <option value="xcode">Xcode (Light)</option>
                <option value="solarized_light">Solarized</option>
              </select>
            </label>
            <div className="cc-editor-actions">
              <button title="Increase font" onClick={() => setFont((v) => Math.min(v + 1, 24))}>A+</button>
              <button title="Decrease font" onClick={() => setFont((v) => Math.max(v - 1, 11))}>A-</button>
              <button title="Copy code" onClick={() => { navigator.clipboard?.writeText(code); }}>
                <img src={CopyButton} alt="Copy" />
              </button>
              <button onClick={() => { if (window.confirm("Reset to starter boilerplate?")) setCode(getDefaultBoilerplate(problem, language)); }} title="Reset boilerplate">
                Reset
              </button>
            </div>
          </div>

          {/* Ace Editor */}
          <div className="cc-editor-frame">
            <AceEditor
              mode={mapAceMode(language)}
              theme={theme}
              value={code}
              fontSize={font}
              onChange={setCode}
              name="coding-problem-editor"
              editorProps={{ $blockScrolling: true }}
              width="100%"
              height="min(52vh, 540px)"
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                showPrintMargin: false,
                tabSize: 4,
              }}
            />
          </div>

          {/* Status Bar */}
          <div className="cc-editor-status">
            <span>
              {running
                ? runMode === "submit"
                  ? "⏳ Running all test cases..."
                  : runMode === "custom"
                  ? "⏳ Running custom input..."
                  : "⏳ Running sample tests..."
                : "Ready"}
            </span>
            <span>{languageNames[language]} · UTF-8</span>
          </div>

          {/* ── Judge Output Panel ── */}
          <div className="sp-judge-panel">
            {/* Output Tab Nav */}
            <div className="sp-output-tabnav">
              <button
                className={outputTab === "testcases" ? "active" : ""}
                onClick={() => setOutputTab("testcases")}
              >
                <FaTerminal /> Test Results
                {currentActiveResult && (
                  <span className="sp-count-badge">
                    {currentActiveResult.passedCount}/{currentActiveResult.totalCount}
                  </span>
                )}
              </button>
              <button
                className={outputTab === "custom" ? "active" : ""}
                onClick={() => setOutputTab("custom")}
              >
                <FaCode /> Custom Input
              </button>
            </div>

            {/* Test Results Tab */}
            {outputTab === "testcases" && (
              <div className="sp-output-body">
                {running && runMode !== "custom" ? (
                  <div className="sp-running-state">
                    <div className="sp-spinner" />
                    <p>{runMode === "submit" ? "Judging all test cases..." : "Running sample tests..."}</p>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>This may take a few seconds</p>
                  </div>
                ) : !currentActiveResult ? (
                  <div className="sp-empty-state">
                    <FaPlay style={{ fontSize: 28, opacity: 0.2, marginBottom: 8 }} />
                    <p>Click <strong>Run</strong> to test with sample cases, or <strong>Submit</strong> to judge all test cases.</p>
                  </div>
                ) : currentActiveResult.error ? (
                  <div className="sp-error-box">
                    <FaExclamationTriangle /> {currentActiveResult.error}
                  </div>
                ) : (
                  <>
                    {/* Overall Verdict */}
                    <div className="sp-verdict-header">
                      <VerdictChip verdict={currentActiveResult.overallVerdict || currentActiveResult.result} size="lg" />
                      <div className="sp-verdict-stats">
                        <span>
                          <FaCheckCircle style={{ color: "#22c55e" }} />
                          {currentActiveResult.passedCount}/{currentActiveResult.totalCount} passed
                        </span>
                        {submitResult?.plagiarism > 0 && (
                          <span style={{ color: "#eab308" }}>
                            Similarity: {submitResult.plagiarism}%
                          </span>
                        )}
                      </div>
                      {(currentActiveResult.result === "Accepted" || currentActiveResult.overallVerdict === "Accepted") && (
                        <div className="sp-accepted-banner">
                          🎉 All test cases passed!
                          {nextProblem && (
                            <button className="sp-next-btn" onClick={() => navigate(`/coding/problems/${nextProblem._id}`)}>
                              Next Problem →
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Compile Error */}
                    {currentActiveResult.compileError && (
                      <div className="sp-compile-error-box">
                        <div className="sp-compile-error-title">
                          <FaExclamationTriangle /> Compilation Error
                        </div>
                        <pre className="sp-compile-error-pre">{currentActiveResult.compileError}</pre>
                      </div>
                    )}

                    {/* First Failure detail (for Submit mode) */}
                    {submitResult?.firstFailure && !currentActiveResult.compileError && (
                      <div className="sp-first-failure">
                        <div className="sp-ff-label">First Failing Case</div>
                        <div className="sp-ff-grid">
                          <div>
                            <div className="sp-ff-key">Input</div>
                            <pre className="sp-ff-val">{submitResult.firstFailure.input || "(empty)"}</pre>
                          </div>
                          <div>
                            <div className="sp-ff-key">Expected</div>
                            <pre className="sp-ff-val green">{submitResult.firstFailure.expectedOutput || "(empty)"}</pre>
                          </div>
                          <div>
                            <div className="sp-ff-key">Your Output</div>
                            <pre className="sp-ff-val red">{submitResult.firstFailure.actualOutput || "(empty)"}</pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Per-test-case breakdown */}
                    {currentResultCases.length > 0 && !currentActiveResult.compileError && (
                      <div className="sp-testcase-list">
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Test Case Breakdown
                        </div>
                        {currentResultCases.map((r, i) => (
                          <TestResultItem
                            key={i}
                            result={r}
                            index={i}
                            defaultOpen={i === 0 && r.verdict !== "Accepted"}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Custom Input Tab */}
            {outputTab === "custom" && (
              <div className="sp-output-body">
                <div className="sp-custom-section">
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Custom Stdin Input
                  </div>
                  <textarea
                    className="sp-custom-input"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder={"Enter your custom input here...\nExample:\n5\n1 2 3 4 5"}
                    rows={6}
                  />
                  <button
                    className="sp-custom-run-btn"
                    onClick={handleCustomRun}
                    disabled={running}
                  >
                    {running && runMode === "custom" ? <><div className="sp-btn-spinner" /> Running...</> : <><FaPlay /> Run Custom Input</>}
                  </button>
                </div>

                {customResult && (
                  <div className="sp-custom-result">
                    {customResult.error ? (
                      <div className="sp-error-box"><FaExclamationTriangle /> {customResult.error}</div>
                    ) : (
                      <>
                        <div className="sp-output-label">
                          <VerdictChip verdict={customResult.verdict || "Executed"} />
                        </div>
                        {customResult.output !== undefined && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, textTransform: "uppercase" }}>Output</div>
                            <pre className="sp-output-pre">{customResult.output || "(empty output)"}</pre>
                          </div>
                        )}
                        {customResult.stderr && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", marginBottom: 4, textTransform: "uppercase" }}>Stderr</div>
                            <pre className="sp-output-pre" style={{ color: "#c4b5fd" }}>{customResult.stderr}</pre>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {running && runMode === "custom" && (
                  <div className="sp-running-state">
                    <div className="sp-spinner" />
                    <p>Running your code...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Submit Action Bar ── */}
          <div className="cc-submit-bar">
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="cc-run-button"
                onClick={handleRun}
                disabled={running}
                title="Run sample test cases"
              >
                {running && runMode === "run"
                  ? <><div className="sp-btn-spinner" /> Running…</>
                  : <><img src={RunButton} alt="" style={{ width: 14, height: 14 }} /> Run</>
                }
              </button>
              <button
                className="cc-submit-button"
                onClick={handleSubmit}
                disabled={running}
                title="Submit against all test cases"
              >
                {running && runMode === "submit"
                  ? <><div className="sp-btn-spinner" /> Judging…</>
                  : "Submit"
                }
              </button>
            </div>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              <strong>Run</strong> tests sample cases · <strong>Submit</strong> judges all {(problem.testCases?.length || 0)} cases
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}

export default SolveProblem;
