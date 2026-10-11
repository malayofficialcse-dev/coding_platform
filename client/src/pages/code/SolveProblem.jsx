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
    return `/**\n * Problem: ${title}\n * Standard I/O (reads from stdin)\n */\nconst fs = require('fs');\n\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim();\n  if (!input) return;\n  // Your logic here\n  console.log(input);\n}\n\nsolve();\n`;
  }
  if (language === "python3") {
    return `import sys\n\ndef solve():\n    # Read all input from standard input\n    input_data = sys.stdin.read().strip()\n    if not input_data:\n        return\n    # Your logic here\n    print(input_data)\n\nif __name__ == '__main__':\n    solve()\n`;
  }
  if (language === "cpp") {
    return `#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string line;\n    if (getline(cin, line)) {\n        // Your logic here\n        cout << line << "\\n";\n    }\n    return 0;\n}\n`;
  }
  if (language === "java") {
    return `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        if (scanner.hasNextLine()) {\n            String line = scanner.nextLine();\n            // Your logic here\n            System.out.println(line);\n        }\n    }\n}\n`;
  }
  return "";
}

function getDefaultEditorial(problem, language) {
  const title = problem?.title || "Challenge";
  const topic = problem?.dsaTopic || "Algorithms";
  const diff = problem?.difficulty || "Easy";

  let codeSnippet = "";
  if (language === "javascript") {
    codeSnippet = `const fs = require('fs');\n\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim();\n  if (!input) return;\n  console.log(input);\n}\n\nsolve();`;
  } else if (language === "python3") {
    codeSnippet = `import sys\n\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    for line in lines:\n        if line:\n            print(line)\n\nif __name__ == '__main__':\n    solve()`;
  } else if (language === "cpp") {
    codeSnippet = `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string s;\n    while (getline(cin, s)) {\n        cout << s << "\\n";\n    }\n    return 0;\n}`;
  } else {
    codeSnippet = `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        while (sc.hasNextLine()) {\n            System.out.println(sc.nextLine());\n        }\n    }\n}`;
  }

  return {
    approach: `For "${title}" (${topic}), analyze input constraints and handle stream tokens sequentially. Process edge cases such as empty lines, trailing whitespaces, and boundary inputs.`,
    timeComplexity: diff === "Hard" ? "O(N log N)" : "O(N)",
    spaceComplexity: "O(1) Auxiliary",
    code: problem?.solutionCodes?.[language] || codeSnippet,
  };
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
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("description"); // description, editorial, submissions, discussions
  const [testCaseIndex, setTestCaseIndex] = useState(0); // 0..N, or 'custom'
  const [customInput, setCustomInput] = useState("42\nhello world");
  const [customResult, setCustomResult] = useState(null);

  // Submissions state
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Editorial state
  const [editorialLang, setEditorialLang] = useState("javascript");
  const [copiedSolution, setCopiedSolution] = useState(false);

  // Personal notes
  const [userNotes, setUserNotes] = useState("");

  // Stopwatch timer for interview mock practice
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  // Fetch all problems list for Next/Prev navigation
  useEffect(() => {
    api
      .get("/coding/problems")
      .then((res) => setAllProblems(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch problem details
  useEffect(() => {
    if (!id) {
      navigate("/coding");
      return;
    }
    api
      .get(`/coding/problems/${id}`)
      .then((res) => {
        setProblem(res.data);
        setCode(getDefaultBoilerplate(res.data, language));
        setTestCaseIndex(0);
        setResult(null);
        setCustomResult(null);

        // Load saved notes from localStorage
        const savedNotes = localStorage.getItem(`codecampus_notes_${id}`);
        if (savedNotes) setUserNotes(savedNotes);
        else setUserNotes("");
      })
      .catch((error) => {
        console.error(error);
        alert("Failed to load problem");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  // When language changes, update boilerplate if editor matches previous default
  useEffect(() => {
    if (problem) {
      setCode(getDefaultBoilerplate(problem, language));
    }
  }, [language, problem]);

  // Fetch submissions when submissions tab is active
  useEffect(() => {
    if (activeTab === "submissions" && user) {
      setLoadingSubmissions(true);
      api
        .get("/coding/submissions/my")
        .then((res) => {
          const list = (res.data || []).filter(
            (s) => String(s.problem?._id || s.problem) === String(id)
          );
          setSubmissions(list);
        })
        .catch((err) => console.error("Error fetching submissions:", err))
        .finally(() => setLoadingSubmissions(false));
    }
  }, [activeTab, id, user]);

  const saveNotes = (val) => {
    setUserNotes(val);
    localStorage.setItem(`codecampus_notes_${id}`, val);
  };

  const testCases = useMemo(() => {
    return problem?.sampleTestCases?.length
      ? problem.sampleTestCases
      : problem?.testCases || [];
  }, [problem]);

  // Navigation helpers
  const currentIndex = allProblems.findIndex((p) => p._id === id);
  const prevProblem = currentIndex > 0 ? allProblems[currentIndex - 1] : null;
  const nextProblem =
    currentIndex >= 0 && currentIndex < allProblems.length - 1
      ? allProblems[currentIndex + 1]
      : null;

  async function runCode({ save = undefined, saveIfAllPassed = false } = {}) {
    setRunning(true);
    setResult(null);
    setCustomResult(null);
    const existingToken = localStorage.getItem("token");
    try {
      if (token) localStorage.setItem("token", token);
      const params = [];
      if (save === false) params.push("save=false");
      if (saveIfAllPassed) params.push("saveIfAllPassed=true");
      const query = params.length ? `?${params.join("&")}` : "";

      const response = await api.post(`/coding/problems/${id}/submit${query}`, {
        code,
        language,
      });
      setResult(response.data);

      // If user got Accepted and saved, refresh submissions if user is logged in
      if (response.data?.result === "Accepted" && user) {
        api.get("/coding/submissions/my").then((res) => {
          const list = (res.data || []).filter(
            (s) => String(s.problem?._id || s.problem) === String(id)
          );
          setSubmissions(list);
        });
      }
    } catch (error) {
      console.error(error);
      alert("Execution failed: " + (error?.response?.data?.error || error.message));
    } finally {
      if (existingToken) localStorage.setItem("token", existingToken);
      else localStorage.removeItem("token");
      setRunning(false);
    }
  }

  async function runWithCustomStdin() {
    setRunning(true);
    setCustomResult(null);
    try {
      const response = await api.post(`/coding/problems/${id}/submit`, {
        code,
        language,
        customInput,
      });
      setCustomResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Custom run failed: " + (error?.response?.data?.error || error.message));
    } finally {
      setRunning(false);
    }
  }

  function loadBoilerplate() {
    const boilerplate = getDefaultBoilerplate(problem, language);
    if (boilerplate) {
      if (window.confirm("Replace current editor code with fresh boilerplate?")) {
        setCode(boilerplate);
      }
    }
  }

  const editorialData = useMemo(() => {
    return getDefaultEditorial(problem, editorialLang);
  }, [problem, editorialLang]);

  const copyEditorialCode = () => {
    navigator.clipboard?.writeText(editorialData.code);
    setCopiedSolution(true);
    setTimeout(() => setCopiedSolution(false), 2000);
  };

  const loadEditorialIntoEditor = () => {
    if (window.confirm("Load reference solution into your editor?")) {
      setCode(editorialData.code);
      setLanguage(editorialLang);
    }
  };

  if (!problem) return <div className="cc-coding-loading">Loading coding workspace…</div>;

  const currentCase = testCaseIndex !== "custom" ? testCases[testCaseIndex] : null;
  const acceptance = problem.acceptanceRate || problem.acceptance || "—";
  const timeLimit = problem.timeLimit || "2.0s";
  const memoryLimit = problem.memoryLimit || "256 MB";

  return (
    <main className="cc-coding-shell">
      {/* Top Header Bar */}
      <div className="cc-coding-topbar">
        <div className="cc-topbar-left">
          <div className="cc-coding-breadcrumb">
            <Link to="/coding" className="text-decoration-none text-muted">
              Practice
            </Link>{" "}
            <span>/</span> DSA <span>/</span> {problem.dsaTopic || "Problems"}{" "}
            <span>/</span> <strong>{problem.title}</strong>
          </div>

          <div className="cc-problem-nav-btns">
            <button
              className="cc-nav-arrow-btn"
              disabled={!prevProblem}
              onClick={() => prevProblem && navigate(`/coding/problems/${prevProblem._id}`)}
              title={prevProblem ? `Previous: ${prevProblem.title}` : "First problem"}
            >
              <FaArrowLeft /> Prev
            </button>
            <button
              className="cc-nav-arrow-btn"
              disabled={!nextProblem}
              onClick={() => nextProblem && navigate(`/coding/problems/${nextProblem._id}`)}
              title={nextProblem ? `Next: ${nextProblem.title}` : "Last problem"}
            >
              Next <FaArrowRight />
            </button>
          </div>
        </div>

        <div className="cc-coding-meta">
          {/* Interview Stopwatch */}
          <div className="cc-timer-badge" title="Interview Practice Stopwatch">
            <span>⏱ {formatTimer(timerSeconds)}</span>
            <button
              className="cc-timer-ctrl-btn"
              onClick={() => setTimerRunning((r) => !r)}
              title={timerRunning ? "Pause stopwatch" : "Start stopwatch"}
            >
              {timerRunning ? <FaPause /> : <FaPlay />}
            </button>
            <button
              className="cc-timer-ctrl-btn"
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(0);
              }}
              title="Reset stopwatch"
            >
              <FaRedo />
            </button>
          </div>

          <span className={`cc-status-chip ${String(problem.difficulty || "Easy").toLowerCase()}`}>
            {problem.difficulty || "Easy"}
          </span>
          <span>✓ Acceptance: {acceptance}{typeof acceptance === "number" ? "%" : ""}</span>
          <span>◷ Limit: {timeLimit}</span>
          <span>◈ Memory: {memoryLimit}</span>
        </div>
      </div>

      {/* Problem Title Row */}
      <div className="cc-coding-title-row">
        <div>
          <h1>{problem.title}</h1>
          <p>Practice, test, and submit your code in a dedicated engineering workspace.</p>
        </div>
        <label className="cc-token-field">
          <span>API token</span>
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Optional custom token"
            type="password"
          />
        </label>
      </div>

      {/* Tabs */}
      <div className="cc-coding-tabs" role="tablist">
        <button
          className={activeTab === "description" ? "active" : ""}
          onClick={() => setActiveTab("description")}
        >
          <FaBookOpen /> Description
        </button>
        <button
          className={activeTab === "editorial" ? "active" : ""}
          onClick={() => setActiveTab("editorial")}
        >
          <FaLightbulb /> Editorial <span className="cc-tab-tag">SOLUTIONS</span>
        </button>
        <button
          className={activeTab === "submissions" ? "active" : ""}
          onClick={() => setActiveTab("submissions")}
        >
          <FaHistory /> Submissions {submissions.length > 0 && `(${submissions.length})`}
        </button>
        <button
          className={activeTab === "discussions" ? "active" : ""}
          onClick={() => setActiveTab("discussions")}
        >
          <FaStickyNote /> Notes & Tips
        </button>
      </div>

      {/* Main Workspace (Left: Problem Context, Right: Editor + Output) */}
      <div className="cc-coding-workspace">
        {/* Left Column */}
        <section className="cc-problem-column">
          {/* TAB 1: DESCRIPTION */}
          {activeTab === "description" && (
            <>
              <article className="cc-problem-card cc-description-card">
                <div className="cc-section-kicker">Problem Statement</div>
                <div className="cc-problem-description">
                  {problem.description || "Read input from stdin and write the expected result to stdout."}
                </div>
              </article>

              <article className="cc-problem-card">
                <div className="cc-section-heading">
                  <span>Sample Examples</span>
                  <span className="cc-muted">{testCases.length} verified test cases</span>
                </div>
                <div className="cc-example-list">
                  {testCases.map((testCase, index) => (
                    <button
                      key={index}
                      className={`cc-example-card ${testCaseIndex === index ? "active" : ""}`}
                      onClick={() => setTestCaseIndex(index)}
                    >
                      <span>Example {index + 1}</span>
                      <span className="cc-example-badge">
                        {testCase.visible === false ? "Hidden Case" : "Verified Test Case"}
                      </span>
                      <code>Input: {testCase.input}</code>
                      <code>Output: {testCase.visible === false ? "Hidden" : testCase.output}</code>
                    </button>
                  ))}
                </div>
              </article>

              <article className="cc-problem-card">
                <div className="cc-section-heading">Test Matrix & Custom Stdin</div>
                <div className="cc-test-tabs">
                  {testCases.map((_, index) => (
                    <button
                      key={index}
                      className={testCaseIndex === index ? "active" : ""}
                      onClick={() => setTestCaseIndex(index)}
                    >
                      Case {index + 1}
                    </button>
                  ))}
                  <button
                    className={`cc-custom-tab-btn ${testCaseIndex === "custom" ? "active" : ""}`}
                    onClick={() => setTestCaseIndex("custom")}
                  >
                    + Custom input
                  </button>
                </div>

                {testCaseIndex === "custom" ? (
                  <div className="cc-custom-input-box">
                    <span className="text-muted" style={{ fontSize: "11px", fontWeight: "600" }}>
                      CUSTOM STDIN (STANDARD INPUT):
                    </span>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Type custom input values to feed directly to stdin..."
                    />
                    <div className="d-flex justify-content-between align-items-center">
                      <button
                        className="cc-run-custom-btn"
                        onClick={runWithCustomStdin}
                        disabled={running}
                      >
                        {running ? "Running Custom…" : "Run Custom Stdin"}
                      </button>
                      <span className="text-muted" style={{ fontSize: "11px" }}>
                        Runs your editor code against your custom input without grading.
                      </span>
                    </div>

                    {customResult && (
                      <div className="mt-3">
                        <span className="text-muted" style={{ fontSize: "10px", fontWeight: "700" }}>
                          CUSTOM EXECUTION OUTPUT:
                        </span>
                        <code
                          style={{
                            display: "block",
                            background: "var(--code-bg)",
                            border: "1px solid var(--code-border)",
                            borderRadius: "6px",
                            padding: "10px",
                            fontSize: "12px",
                            marginTop: "4px",
                            color: customResult.status === "Failed" ? "#ef4444" : "var(--ink)",
                          }}
                        >
                          {customResult.userOutput || customResult.error || "(No stdout produced)"}
                        </code>
                      </div>
                    )}
                  </div>
                ) : currentCase ? (
                  <div className="cc-test-preview">
                    <div>
                      <span>INPUT PARAMETERS</span>
                      <code>{currentCase.input}</code>
                    </div>
                    <div>
                      <span>EXPECTED RESULT</span>
                      <code>
                        {currentCase.visible === false ? "Hidden test case" : currentCase.output}
                      </code>
                    </div>
                    <div>
                      <span>LAST TEST RUN OUTPUT</span>
                      <code>{result?.details?.[testCaseIndex]?.userOutput || "—"}</code>
                    </div>
                  </div>
                ) : (
                  <p className="cc-muted">No test cases have been configured.</p>
                )}
              </article>
            </>
          )}

          {/* TAB 2: EDITORIAL */}
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
                    <p className="cc-complexity-desc">Single pass processing through stdin input stream.</p>
                  </div>
                  <div className="cc-complexity-box">
                    <span className="cc-complexity-title">Space Complexity</span>
                    <div className="cc-complexity-val">{editorialData.spaceComplexity}</div>
                    <p className="cc-complexity-desc">Uses constant memory buffer without extra state.</p>
                  </div>
                </div>
              </div>

              <div className="cc-editorial-section mt-2">
                <h4>Reference Solution</h4>
                <div className="cc-solution-code-block">
                  <div className="cc-solution-code-header">
                    <select
                      value={editorialLang}
                      onChange={(e) => setEditorialLang(e.target.value)}
                    >
                      <option value="javascript">JavaScript (Node.js)</option>
                      <option value="python3">Python 3</option>
                      <option value="cpp">C++ (std=c++17)</option>
                      <option value="java">Java 15</option>
                    </select>

                    <div className="cc-solution-actions">
                      <button onClick={copyEditorialCode} title="Copy reference solution">
                        <FaCopy /> {copiedSolution ? "Copied!" : "Copy"}
                      </button>
                      <button onClick={loadEditorialIntoEditor} title="Load solution into editor">
                        Load to Editor
                      </button>
                    </div>
                  </div>
                  <pre className="cc-solution-code-pre">{editorialData.code}</pre>
                </div>
              </div>
            </article>
          )}

          {/* TAB 3: SUBMISSIONS */}
          {activeTab === "submissions" && (
            <article className="cc-problem-card">
              <div className="cc-section-kicker">Submissions History</div>
              {!user ? (
                <div className="text-center py-4">
                  <p className="cc-muted">Please log in to track and view your past submission attempts.</p>
                </div>
              ) : loadingSubmissions ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" role="status" />
                  <p className="cc-muted mt-2">Loading past submissions…</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="cc-muted">
                    No submissions found for this problem yet. Run test cases and submit your solution!
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="cc-submissions-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Language</th>
                        <th>Test Cases</th>
                        <th>Submitted At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr key={sub._id}>
                          <td>
                            <span
                              className={
                                sub.result === "Accepted"
                                  ? "badge bg-success"
                                  : "badge bg-danger"
                              }
                            >
                              {sub.result}
                            </span>
                          </td>
                          <td>{languageNames[sub.language] || sub.language}</td>
                          <td>
                            {sub.passedCount ?? 0} / {sub.totalCount ?? 0}
                          </td>
                          <td>{new Date(sub.createdAt).toLocaleString()}</td>
                          <td>
                            {sub.code && (
                              <button
                                className="cc-load-code-btn"
                                onClick={() => {
                                  if (window.confirm("Load this previous submission code into editor?")) {
                                    setCode(sub.code);
                                    if (sub.language) setLanguage(sub.language);
                                  }
                                }}
                              >
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

          {/* TAB 4: DISCUSSIONS & NOTES */}
          {activeTab === "discussions" && (
            <article className="cc-problem-card">
              <div className="cc-section-kicker">My Scratchpad & Strategy Notes</div>
              <p className="cc-muted mb-2">
                Jot down your intuition, edge case checklist, or interview notes. These are automatically saved locally on your device for this problem.
              </p>
              <textarea
                className="cc-notes-textarea"
                placeholder="E.g. Remember to handle negative numbers and single-element inputs..."
                value={userNotes}
                onChange={(e) => saveNotes(e.target.value)}
              />

              <div className="mt-4">
                <div className="cc-section-kicker">Common Edge Cases & Tips</div>
                <div className="cc-tip-list">
                  <div className="cc-tip-item">
                    <strong>Empty or Whitespace Inputs:</strong> Always check if input tokens are empty before accessing indices.
                  </div>
                  <div className="cc-tip-item">
                    <strong>Single Element Streams:</strong> Ensure loops and pointer bounds correctly process array length = 1.
                  </div>
                  <div className="cc-tip-item">
                    <strong>Fast I/O:</strong> In C++, use <code>cin.tie(NULL);</code>. In Node.js, use <code>fs.readFileSync(0)</code> for competitive performance.
                  </div>
                </div>
              </div>
            </article>
          )}
        </section>

        {/* Right Column: Code Editor & Execution Panel */}
        <section className="cc-editor-column">
          {/* Editor Toolbar */}
          <div className="cc-editor-toolbar">
            <label>
              <span>Language</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="python3">Python 3</option>
                <option value="cpp">C++ (GCC)</option>
                <option value="java">Java</option>
              </select>
            </label>

            <label>
              <span>Theme</span>
              <select value={theme} onChange={(event) => setTheme(event.target.value)}>
                <option value="dracula">Dracula (Dark)</option>
                <option value="monokai">Monokai (Dark)</option>
                <option value="tomorrow_night">Tomorrow Night (Dark)</option>
                <option value="github">GitHub (Light)</option>
                <option value="xcode">Xcode (Light)</option>
                <option value="solarized_light">Solarized Light</option>
              </select>
            </label>

            <div className="cc-editor-actions">
              <button title="Increase font size" onClick={() => setFont((v) => Math.min(v + 1, 24))}>
                A+
              </button>
              <button title="Decrease font size" onClick={() => setFont((v) => Math.max(v - 1, 11))}>
                A-
              </button>
              <button
                title="Copy code"
                onClick={() => {
                  navigator.clipboard?.writeText(code);
                  alert("Code copied to clipboard!");
                }}
              >
                <img src={CopyButton} alt="Copy" />
              </button>
              <button onClick={loadBoilerplate} title="Reset to standard starter boilerplate">
                Reset Starter
              </button>
            </div>
          </div>

          {/* Ace Editor Canvas */}
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
              height="min(56vh, 580px)"
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                showPrintMargin: false,
                tabSize: 4,
              }}
            />
          </div>

          {/* Editor Status Bar */}
          <div className="cc-editor-status">
            <span>{running ? "Compiling and running test cases…" : "Ready to run"}</span>
            <span>{languageNames[language]} · UTF-8 · Tab: 4 spaces</span>
          </div>

          {/* Output Diagnostics Panel */}
          <div className="cc-output-panel">
            <div className="cc-output-heading">
              <strong>Execution Diagnostics</strong>
              {result && (
                <span className={result.result === "Accepted" ? "success" : "danger"}>
                  {result.result}
                </span>
              )}
            </div>

            {!result ? (
              <p className="cc-muted">
                Run your solution to see test cases output, execution diagnostics, and correctness validation.
              </p>
            ) : (
              <>
                <div className="cc-output-summary">
                  {result.passedCount || 0}/{result.totalCount || 0} test cases passed
                  <span>
                    {" "}
                    · Similarity: {typeof result.plagiarism === "number" ? `${result.plagiarism}%` : "Not checked"}
                  </span>
                </div>

                {result.result === "Accepted" && (
                  <div className="alert alert-success py-2 px-3 my-2 d-flex justify-content-between align-items-center">
                    <div>
                      <strong>🎉 Problem Solved! All test cases passed.</strong>
                    </div>
                    {nextProblem && (
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => navigate(`/coding/problems/${nextProblem._id}`)}
                      >
                        Next Challenge →
                      </button>
                    )}
                  </div>
                )}

                <div className="cc-result-list">
                  {(result.details || []).map((detail, index) => (
                    <div key={index} className="cc-result-row">
                      <span className={detail.status === "Passed" ? "success" : "danger"}>●</span>
                      <span>Test {index + 1}</span>
                      <span className={detail.status === "Passed" ? "success" : "danger"}>
                        {detail.status}
                      </span>
                      <code>{detail.userOutput || "(No stdout)"}</code>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Submit Action Bar */}
          <div className="cc-submit-bar">
            <div>
              <button
                className="cc-run-button"
                onClick={() => runCode({ save: false })}
                disabled={running}
              >
                <img src={RunButton} alt="" />
                {running ? "Running…" : "Run Code"}
              </button>
              <button
                className="cc-submit-button"
                onClick={() => runCode({ saveIfAllPassed: true })}
                disabled={running}
              >
                {running ? "Testing…" : "Submit Solution"}
              </button>
            </div>
            <span>Runs all tests against the judge engine.</span>
          </div>
        </section>
      </div>
    </main>
  );
}

export default SolveProblem;
