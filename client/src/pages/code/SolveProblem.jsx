import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";

// ACE THEMES — FULL PACK

import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-solarized_dark";
import "ace-builds/src-noconflict/theme-solarized_light";
import "ace-builds/src-noconflict/theme-gruvbox";
import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-noconflict/theme-cobalt";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-tomorrow_night";
import "ace-builds/src-noconflict/theme-tomorrow_night_blue";
import "ace-builds/src-noconflict/theme-tomorrow_night_bright";
import "ace-builds/src-noconflict/theme-tomorrow_night_eighties";
import "ace-builds/src-noconflict/theme-clouds";
import "ace-builds/src-noconflict/theme-clouds_midnight";
import "ace-builds/src-noconflict/theme-eclipse";
import "ace-builds/src-noconflict/theme-chaos";
import "ace-builds/src-noconflict/theme-kr_theme";
import "ace-builds/src-noconflict/theme-crimson_editor";
import "ace-builds/src-noconflict/theme-dawn";
import "ace-builds/src-noconflict/theme-katzenmilch";
import "ace-builds/src-noconflict/theme-sqlserver";

import RunButton from "../../assets/play-solid-full.svg";
import CopyButton from "../../assets/copy-regular-full.svg";
import EyeLogo from "../../assets/eye-solid-full.svg";

export function SolveProblem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext || {});
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("monokai");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [font, setFont] = useState(16);

  useEffect(() => {
    if (!id) {
      alert("Open with /coding/problems/:id");
      navigate("/");
      return;
    }
    fetchProblem(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchProblem(pid) {
    try {
      const res = await api.get(`/coding/problems/${pid}`);
      setProblem(res.data);
      const boilers = res.data.boilerplateCodes
        ? Object.fromEntries(Object.entries(res.data.boilerplateCodes))
        : {};
      setCode(boilers[language] || "");
    } catch (err) {
      console.error(err);
      alert("Failed to load problem");
    }
  }

  useEffect(() => {
    if (problem) {
      const boilers = problem.boilerplateCodes
        ? Object.fromEntries(Object.entries(problem.boilerplateCodes))
        : {};
      setCode(boilers[language] || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  function mapAceMode(lang) {
    if (lang === "python3") return "python";
    if (lang === "javascript") return "javascript";
    if (lang === "cpp" || lang === "c++") return "c_cpp";
    if (lang === "java") return "java";
    return "javascript";
  }

  function escapeHtml(s) {
    return (s || "")
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  async function runCode({ save = undefined, saveIfAllPassed = false } = {}) {
    setRunning(true);
    setResult(null);
    try {
      // temporarily set token in localStorage so api interceptor uses it
      if (token) localStorage.setItem("token", token);
      const params = [];
      if (save === false) params.push("save=false");
      if (saveIfAllPassed) params.push("saveIfAllPassed=true");
      const q = params.length ? `?${params.join("&")}` : "";
      const res = await api.post(`/coding/problems/${id}/submit${q}`, {
        code,
        language,
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Submit failed: " + (err?.response?.data?.error || err.message));
    } finally {
      // remove temporary token if it was not present originally
      if (
        !localStorage.getItem("token") ||
        localStorage.getItem("token") === ""
      ) {
        localStorage.removeItem("token");
      }
      setRunning(false);
    }
  }

  const handleRun = () => runCode({ save: false });
  const handleSubmit = () => runCode({ saveIfAllPassed: true });

  function loadBoiler() {
    const b = problem?.boilerplateCodes
      ? Object.fromEntries(Object.entries(problem.boilerplateCodes))
      : {};
    if (b[language]) setCode(b[language]);
    else alert("No boilerplate for " + language);
  }

  if (!problem)
    return <div className="container py-5 text-center">Loading...</div>;

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between mb-3">
        <h4>
          {problem
            ? `${problem.title} ${
                problem.difficulty ? "(" + problem.difficulty + ")" : ""
              }`
            : "Loading..."}
        </h4>
        <div className="d-flex gap-2 align-items-center">
          <input
            className="form-control form-control-sm"
            style={{ width: 360 }}
            placeholder="JWT (optional)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-5">
          <div className="card p-3 mb-3">
            <h6>Description</h6>
            <div style={{ whiteSpace: "pre-wrap" }}>{problem?.description}</div>
          </div>

          <div className="card p-3 mb-3">
            <h6>Testcases</h6>
            <ul className="list-group">
              {(problem?.testCases || []).map((tc, i) => (
                <li key={i} className="list-group-item">
                  <div>
                    <strong>Case {i + 1}</strong>{" "}
                    {tc.visible ? (
                      <span className="badge  ms-2">
                        <img
                          src={EyeLogo}
                          alt="visible"
                          style={{ height: 18, width: 18 }}
                        />
                      </span>
                    ) : (
                      <span className="badge bg-secondary ms-2">hidden</span>
                    )}
                  </div>
                  <div className="small text-muted">
                    Input: <code>{escapeHtml(tc.input)}</code>
                  </div>
                  <div className="small text-muted">
                    Expected:{" "}
                    {tc.visible ? (
                      <code>{escapeHtml(tc.output)}</code>
                    ) : (
                      <em>hidden</em>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-3">
            <h6>Result</h6>
            {!result && <div className="text-muted">No submission yet.</div>}
            {result && (
              <>
                <div>
                  <strong>{result.result}</strong> — Passed {result.passedCount}
                  /{result.totalCount} — plagiarism: {result.plagiarism}
                </div>
                <div className="mt-2">
                  {(result.details || []).map((d, i) => (
                    <div key={i} className="p-2 mb-2 border rounded">
                      <div>
                        <b>Test {i + 1}:</b>{" "}
                        <span
                          className={
                            d.status === "Passed"
                              ? "text-success"
                              : d.status === "Failed"
                              ? "text-danger"
                              : ""
                          }
                        >
                          {d.status}
                        </span>
                      </div>
                      <div className="small text-muted">
                        Input: <code>{escapeHtml(d.input)}</code>
                      </div>
                      <div className="small text-muted">
                        Expected: <code>{escapeHtml(d.expectedOutput)}</code>
                      </div>
                      <div className="small">
                        Output: <code>{escapeHtml(d.userOutput)}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-lg-7">
          <div className="d-flex gap-2 mb-2 align-items-center">
            <select
              className="form-select form-select-sm"
              style={{ width: 180 }}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python3">Python 3</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>

            <select
              className="form-select form-select-sm"
              style={{ width: 200 }}
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="monokai">Monokai</option>
              <option value="github">GitHub</option>
              <option value="dracula">Dracula</option>
              <option value="solarized_dark">Solarized Dark</option>
              <option value="solarized_light">Solarized Light</option>
              <option value="gruvbox">Gruvbox</option>
              <option value="xcode">Xcode</option>
              <option value="textmate">TextMate</option>
              <option value="cobalt">Cobalt</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="tomorrow_night">Tomorrow Night</option>
              <option value="tomorrow_night_blue">Tomorrow Night Blue</option>
              <option value="tomorrow_night_bright">
                Tomorrow Night Bright
              </option>
              <option value="tomorrow_night_eighties">
                Tomorrow Night 80s
              </option>
              <option value="clouds">Clouds</option>
              <option value="clouds_midnight">Clouds Midnight</option>
              <option value="eclipse">Eclipse</option>
              <option value="ambiance">Ambiance</option>
              <option value="chaos">Chaos</option>
              <option value="kr_theme">KR Theme</option>
              <option value="crimson_editor">Crimson Editor</option>
              <option value="dawn">Dawn</option>
              <option value="katzenmilch">Katzenmilch</option>
              <option value="sqlserver">SQL Server</option>
            </select>

            {/* 🌟 Font Size Controls */}
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setFont((f) => Math.min(f + 1, 40))}
            >
              A+
            </button>

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setFont((f) => Math.max(f - 1, 10))}
            >
              A-
            </button>

            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => navigator.clipboard.writeText(code)}
              style={{ transition: "all 0.15s ease" }}
              onMouseEnter={(e) => {
                const img = e.currentTarget.querySelector("img");
                img.style.transform = "scale(1.20)";
                img.style.filter = "drop-shadow(0px 3px 6px rgba(0,0,0,0.4))";
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget.querySelector("img");
                img.style.transform = "scale(1)";
                img.style.filter = "none";
              }}
            >
              <img
                src={CopyButton}
                alt="Copy"
                style={{ height: 18, width: 18, transition: "all 0.15s ease" }}
              />
            </button>

            {/* Load Boilerplate Button */}
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={loadBoiler}
              style={{
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow =
                  "0px 3px 8px rgba(0,0,0,0.20)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Load Boilerplate
            </button>

            {/* Run Button */}
            <button
              className="btn btn-primary btn-sm ms-auto"
              onClick={handleRun}
              disabled={running}
              style={{ transition: "all 0.15s ease" }}
              onMouseEnter={(e) => {
                if (!running) {
                  const img = e.currentTarget.querySelector("img");
                  img.style.transform = "scale(1.20)";
                  img.style.filter = "drop-shadow(0px 3px 6px rgba(0,0,0,0.4))";
                }
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget.querySelector("img");
                if (img) {
                  img.style.transform = "scale(1)";
                  img.style.filter = "none";
                }
              }}
            >
              {running ? (
                "Running..."
              ) : (
                <img
                  src={RunButton}
                  alt="Run"
                  style={{
                    height: 18,
                    width: 18,
                    transition: "all 0.15s ease",
                  }}
                />
              )}
            </button>
          </div>

          <AceEditor
            mode={mapAceMode(language)}
            theme={theme}
            value={code}
            fontSize={font} // <-- added dynamic font size
            onChange={(v) => setCode(v)}
            name="ace-editor"
            editorProps={{ $blockScrolling: true }}
            width="100%"
            height="60vh"
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
            }}
          />

          <div className="card p-3 d-flex gap-2 mt-5">
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={running || user === undefined}
            >
              Submit
            </button>
            <small className="text-muted">
              Submissions are saved by backend according to query flags
              (default: saved only on all-pass).
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
// ...existing code...
