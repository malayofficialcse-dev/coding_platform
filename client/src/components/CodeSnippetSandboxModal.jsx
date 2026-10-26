import React, { useState } from "react";
import { Link } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import api from "../api/api";
import { FaPlay, FaTimes, FaTerminal, FaCopy, FaCheck, FaExternalLinkAlt } from "react-icons/fa";

const LANG_CONFIG = {
  javascript: { name: "JavaScript (Node 18)", ext: javascript },
  js: { name: "JavaScript (Node 18)", ext: javascript },
  python: { name: "Python (3.10)", ext: python },
  py: { name: "Python (3.10)", ext: python },
  java: { name: "Java (15)", ext: java },
  cpp: { name: "C++ (GCC 10.2)", ext: cpp },
  "c++": { name: "C++ (GCC 10.2)", ext: cpp },
  c: { name: "C (GCC 10.2)", ext: cpp },
};

export default function CodeSnippetSandboxModal({ show, onClose, initialCode = "", initialLanguage = "javascript" }) {
  const normLang = (initialLanguage || "javascript").toLowerCase();
  const [language, setLanguage] = useState(LANG_CONFIG[normLang] ? normLang : "javascript");
  const [code, setCode] = useState(initialCode || "");
  const [stdin, setStdin] = useState("");
  const [showStdin, setShowStdin] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!show) return null;

  const handleRun = async () => {
    setRunning(true);
    setOutput(null);
    try {
      const res = await api.post("/posts/execute-snippet", {
        language,
        code,
        stdin,
      });
      setOutput({
        stdout: res.data.stdout || "",
        stderr: res.data.stderr || "",
        output: res.data.output || "(Process finished with no output)",
        exitCode: res.data.exitCode,
      });
    } catch (err) {
      setOutput({
        stderr: err.response?.data?.details || err.response?.data?.error || err.message,
        exitCode: 1,
      });
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getExtension = () => {
    const entry = LANG_CONFIG[language] || LANG_CONFIG.javascript;
    return entry.ext();
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="rounded-3 shadow-lg d-flex flex-column"
        style={{
          background: "var(--cc-surface, #ffffff)",
          color: "var(--cc-text, #1b1b1b)",
          width: "95%",
          maxWidth: 900,
          maxHeight: "92vh",
          overflow: "hidden",
          border: "1px solid var(--cc-border, #d6dbe1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom"
          style={{ background: "var(--cc-surface-muted, #f8fafc)" }}
        >
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <FaTerminal size={14} />
            </span>
            <div>
              <div className="fw-bold" style={{ fontSize: "0.95rem" }}>
                Interactive Code Sandbox
              </div>
              <div className="text-muted" style={{ fontSize: "0.74rem" }}>
                Edit & run this code snippet live in the cloud
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ width: "auto", fontSize: "0.8rem", fontWeight: 600 }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>

            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={handleCopy}
              title="Copy snippet"
            >
              {copied ? <FaCheck size={12} color="#16a34a" /> : <FaCopy size={12} />}
              <span style={{ fontSize: "0.75rem" }}>{copied ? "Copied" : "Copy"}</span>
            </button>

            <Link
              to="/coding"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              title="Open full coding workspace"
              style={{ fontSize: "0.75rem" }}
            >
              <FaExternalLinkAlt size={11} /> Problems
            </Link>

            <button
              className="btn btn-sm btn-light border"
              onClick={onClose}
              style={{ borderRadius: "50%", width: 30, height: 30, padding: 0 }}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Code Editor */}
        <div style={{ flex: 1, minHeight: 260, maxHeight: 380, overflow: "auto" }}>
          <CodeMirror
            value={code}
            height="100%"
            minHeight="260px"
            theme="dark"
            extensions={[getExtension()]}
            onChange={(val) => setCode(val)}
          />
        </div>

        {/* Stdin Drawer Toggle */}
        <div className="px-3 py-1 bg-light border-top border-bottom d-flex align-items-center justify-content-between">
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none text-muted p-0"
            onClick={() => setShowStdin(!showStdin)}
            style={{ fontSize: "0.75rem" }}
          >
            {showStdin ? "▼ Hide Standard Input (stdin)" : "▶ Provide Standard Input (stdin)"}
          </button>

          <button
            className="btn btn-sm btn-primary d-flex align-items-center gap-2 px-3 fw-bold shadow-sm"
            onClick={handleRun}
            disabled={running}
            style={{ fontSize: "0.82rem" }}
          >
            <FaPlay size={10} />
            {running ? "Running in Sandbox…" : "Run Snippet"}
          </button>
        </div>

        {showStdin && (
          <div className="p-2 border-bottom bg-white">
            <textarea
              className="form-control form-control-sm font-monospace"
              rows="2"
              placeholder="Enter standard input here..."
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              style={{ fontSize: "0.8rem" }}
            />
          </div>
        )}

        {/* Terminal Output */}
        <div
          style={{
            background: "#0d1117",
            color: "#c9d1d9",
            padding: "10px 14px",
            maxHeight: 200,
            overflowY: "auto",
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontSize: "0.82rem",
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-1 text-muted" style={{ fontSize: "0.72rem" }}>
            <span>OUTPUT TERMINAL</span>
            {output && (
              <span style={{ color: output.exitCode === 0 ? "#3fb950" : "#f85149", fontWeight: 700 }}>
                {output.exitCode === 0 ? "✓ Succeeded (exit 0)" : `✗ Exited with error (${output.exitCode})`}
              </span>
            )}
          </div>

          {running ? (
            <div className="text-info py-2">Executing snippet on cloud runtime…</div>
          ) : output ? (
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {output.stderr && <div style={{ color: "#f85149", marginBottom: 4 }}>{output.stderr}</div>}
              {output.stdout && <div style={{ color: "#e6edf3" }}>{output.stdout}</div>}
              {!output.stdout && !output.stderr && <div className="text-muted">{output.output}</div>}
            </div>
          ) : (
            <div className="text-secondary py-2">Click "Run Snippet" above to compile and execute this code.</div>
          )}
        </div>
      </div>
    </div>
  );
}
