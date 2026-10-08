import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AceEditor from "react-ace";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import RunButton from "../../assets/play-solid-full.svg";
import CopyButton from "../../assets/copy-regular-full.svg";
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

const languageNames = { javascript: "JavaScript", python3: "Python 3", cpp: "C++", java: "Java" };

function mapAceMode(language) {
  if (language === "python3") return "python";
  if (language === "cpp") return "c_cpp";
  if (language === "java") return "java";
  return "javascript";
}

function getBoilerplate(problem, language) {
  return problem?.boilerplateCodes?.[language] || "";
}

export function SolveProblem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext || {});
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("github");
  const [font, setFont] = useState(15);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [testCaseIndex, setTestCaseIndex] = useState(0);

  useEffect(() => {
    if (!id) { navigate("/"); return; }
    api.get(`/coding/problems/${id}`).then((res) => {
      setProblem(res.data);
      setCode(getBoilerplate(res.data, language));
    }).catch((error) => { console.error(error); alert("Failed to load problem"); });
  // The initial problem load should not reset the editor whenever language changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  useEffect(() => { if (problem) setCode(getBoilerplate(problem, language)); }, [language, problem]);

  const testCases = useMemo(() => problem?.sampleTestCases?.length ? problem.sampleTestCases : problem?.testCases || [], [problem]);

  async function runCode({ save = undefined, saveIfAllPassed = false } = {}) {
    setRunning(true); setResult(null);
    const existingToken = localStorage.getItem("token");
    try {
      if (token) localStorage.setItem("token", token);
      const params = [];
      if (save === false) params.push("save=false");
      if (saveIfAllPassed) params.push("saveIfAllPassed=true");
      const query = params.length ? `?${params.join("&")}` : "";
      const response = await api.post(`/coding/problems/${id}/submit${query}`, { code, language });
      setResult(response.data);
    } catch (error) {
      console.error(error); alert("Execution failed: " + (error?.response?.data?.error || error.message));
    } finally {
      if (existingToken) localStorage.setItem("token", existingToken); else localStorage.removeItem("token");
      setRunning(false);
    }
  }

  function loadBoilerplate() {
    const boilerplate = getBoilerplate(problem, language);
    if (boilerplate) setCode(boilerplate); else alert(`No boilerplate available for ${languageNames[language]}`);
  }

  if (!problem) return <div className="cc-coding-loading">Loading coding workspace…</div>;

  const currentCase = testCases[testCaseIndex];
  const acceptance = problem.acceptanceRate || problem.acceptance || "—";
  const timeLimit = problem.timeLimit || problem.time || "2.0s";
  const memoryLimit = problem.memoryLimit || problem.memory || "256 MB";

  return (
    <main className="cc-coding-shell">
      <div className="cc-coding-topbar">
        <div className="cc-coding-breadcrumb">Practice <span>/</span> DSA <span>/</span> {problem.dsaTopic || "Problems"} <span>/</span> <strong>{problem.title}</strong></div>
        <div className="cc-coding-meta"><span className={`cc-status-chip ${String(problem.difficulty || "Easy").toLowerCase()}`}>{problem.difficulty || "Easy"}</span><span>✓ Acceptance: {acceptance}{typeof acceptance === "number" ? "%" : ""}</span><span>◷ Limit: {timeLimit}</span><span>◈ Memory: {memoryLimit}</span></div>
      </div>

      <div className="cc-coding-title-row"><div><h1>{problem.title}</h1><p>Practice, test, and submit your solution in a focused coding workspace.</p></div><label className="cc-token-field"><span>API token</span><input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Optional" type="password" /></label></div>

      <div className="cc-coding-tabs" role="tablist">{["description", "editorial", "submissions", "discussions"].map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab[0].toUpperCase() + tab.slice(1)}{tab === "editorial" ? "  NEW" : ""}</button>)}</div>

      <div className="cc-coding-workspace">
        <section className="cc-problem-column">
          {activeTab === "description" ? <>
            <article className="cc-problem-card cc-description-card"><div className="cc-section-kicker">Problem statement</div><div className="cc-problem-description">{problem.description || "No description provided."}</div></article>
            <article className="cc-problem-card"><div className="cc-section-heading"><span>Examples</span><span className="cc-muted">{testCases.length} test cases</span></div><div className="cc-example-list">{testCases.map((testCase, index) => <button key={index} className={`cc-example-card ${testCaseIndex === index ? "active" : ""}`} onClick={() => setTestCaseIndex(index)}><span>Example {index + 1}</span><span className="cc-example-badge">{testCase.visible === false ? "Hidden" : "Verified Test Case"}</span><code>Input: {testCase.input}</code><code>Output: {testCase.visible === false ? "Hidden" : testCase.output}</code></button>)}</div></article>
            <article className="cc-problem-card"><div className="cc-section-heading">Test matrix harness</div><div className="cc-test-tabs">{testCases.map((_, index) => <button key={index} className={testCaseIndex === index ? "active" : ""} onClick={() => setTestCaseIndex(index)}>Case {index + 1}</button>)}<button>+ Custom input</button></div>{currentCase ? <div className="cc-test-preview"><div><span>INPUT PARAMETERS</span><code>{currentCase.input}</code></div><div><span>EXPECTED RESULT</span><code>{currentCase.visible === false ? "Hidden test" : currentCase.output}</code></div><div><span>LAST OUTPUT</span><code>{result?.details?.[testCaseIndex]?.userOutput || "—"}</code></div></div> : <p className="cc-muted">No test cases have been configured.</p>}</article>
          </> : <article className="cc-problem-card cc-empty-tab"><div className="cc-section-kicker">{activeTab}</div><h2>{activeTab === "editorial" ? "Editorial is coming soon" : "Nothing here yet"}</h2><p>This workspace is ready for the next learning resource and will keep your problem context available.</p></article>}
        </section>

        <section className="cc-editor-column">
          <div className="cc-editor-toolbar"><label><span>Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="javascript">JavaScript</option><option value="python3">Python 3</option><option value="cpp">C++</option><option value="java">Java</option></select></label><label><span>Theme</span><select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="github">GitHub Light</option><option value="xcode">Xcode</option><option value="solarized_light">Solarized Light</option><option value="monokai">Monokai</option><option value="dracula">Dracula</option><option value="tomorrow_night">Tomorrow Night</option></select></label><div className="cc-editor-actions"><button title="Increase font size" onClick={() => setFont((value) => Math.min(value + 1, 24))}>A+</button><button title="Decrease font size" onClick={() => setFont((value) => Math.max(value - 1, 11))}>A-</button><button title="Copy code" onClick={() => navigator.clipboard?.writeText(code)}><img src={CopyButton} alt="Copy" /></button><button onClick={loadBoilerplate}>Load Boilerplate</button></div></div>
          <div className="cc-editor-frame"><AceEditor mode={mapAceMode(language)} theme={theme} value={code} fontSize={font} onChange={setCode} name="coding-problem-editor" editorProps={{ $blockScrolling: true }} width="100%" height="min(56vh, 590px)" setOptions={{ enableBasicAutocompletion: true, enableLiveAutocompletion: true, showPrintMargin: false }} /></div>
          <div className="cc-editor-status"><span>{running ? "Running test cases…" : "Ready to run"}</span><span>{languageNames[language]} · UTF-8 · Spaces: 4</span></div>
          <div className="cc-output-panel"><div className="cc-output-heading"><strong>Execution diagnostics</strong>{result && <span className={result.result === "Passed" ? "success" : "danger"}>{result.result}</span>}</div>{!result ? <p className="cc-muted">Run your solution to see compiler output, test results, and performance diagnostics.</p> : <><div className="cc-output-summary">{result.passedCount || 0}/{result.totalCount || 0} test cases passed <span>· Plagiarism: {result.plagiarism || "Not checked"}</span></div><div className="cc-result-list">{(result.details || []).map((detail, index) => <div key={index} className="cc-result-row"><span className={detail.status === "Passed" ? "success" : "danger"}>●</span><span>Test {index + 1}</span><span>{detail.status}</span><code>{detail.userOutput || "—"}</code></div>)}</div></>}</div>
          <div className="cc-submit-bar"><div><button className="cc-run-button" onClick={() => runCode({ save: false })} disabled={running}><img src={RunButton} alt="" />{running ? "Running…" : "Run Code"}</button><button className="cc-submit-button" onClick={() => runCode({ saveIfAllPassed: true })} disabled={running || user === undefined}>Submit Solution</button></div><span>Solutions are saved automatically when all tests pass.</span></div>
        </section>
      </div>
    </main>
  );
}
