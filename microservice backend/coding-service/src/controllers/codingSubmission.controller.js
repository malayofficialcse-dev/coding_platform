import axios from "axios";
import { writeFile, unlink } from "fs/promises";
import { spawn } from "child_process";
import os from "os";
import path from "path";
import CodingSubmission from "../models/CodingSubmission.js";
import CodingProblem from "../models/CodingProblem.js";
import { checkPlagiarism } from "../utils/plagiarism.js";

const PISTON_URL = process.env.PISTON_URL || "https://emkc.org/api/v2/piston/execute";
const ENABLE_LOCAL_EXEC = process.env.ENABLE_LOCAL_EXEC === "true";

const PISTON_LANG_MAP = {
  javascript: { language: "javascript", version: "18.15.0" },
  python:     { language: "python",     version: "3.10.0"  },
  python3:    { language: "python",     version: "3.10.0"  },
  cpp:        { language: "c++",        version: "10.2.0"  },
  "c++":      { language: "c++",        version: "10.2.0"  },
  java:       { language: "java",       version: "15.0.2"  },
  c:          { language: "c",          version: "10.2.0"  },
};

// ------------ Verdict detection helpers ------------
function detectVerdict(stdout, stderr, exitCode, expected) {
  if (stderr && /compile|error|syntax/i.test(stderr) && exitCode !== 0 && !stdout) {
    return "Compilation Error";
  }
  if (stderr && /time limit|killed|timeout/i.test(stderr)) {
    return "Time Limit Exceeded";
  }
  if (exitCode !== 0 && stderr && !stdout) {
    return "Runtime Error";
  }
  const actual = (stdout || "").trim();
  const exp    = (expected || "").trim();
  if (actual === exp) return "Accepted";
  return "Wrong Answer";
}

function normalizeOutput(s) {
  return (s || "")
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n+/g, "\n");
}

// ------------ Piston execution ------------
async function runWithPiston(langKey, codeStr, stdin, timeoutMs = 10000) {
  const runtime = PISTON_LANG_MAP[langKey];
  if (!runtime) throw new Error(`Unsupported language: ${langKey}`);

  const response = await axios.post(
    PISTON_URL,
    {
      language: runtime.language,
      version: runtime.version,
      files: [{ name: langKey === "java" ? "Main.java" : "main", content: codeStr }],
      stdin: stdin || "",
      run_timeout: timeoutMs,
      compile_timeout: 10000,
    },
    { timeout: timeoutMs + 8000 }
  );

  const compile = response.data.compile || {};
  const run = response.data.run || {};

  // Compilation error detection
  if (compile.code !== undefined && compile.code !== 0) {
    return {
      stdout: "",
      stderr: (compile.stderr || compile.output || "Compilation failed"),
      exitCode: compile.code,
      verdict: "Compilation Error",
      compileError: (compile.stderr || compile.output || "").trim(),
    };
  }

  const stdout = (run.stdout || "").trim();
  const stderr = (run.stderr || "").trim();
  const exitCode = run.code ?? 0;

  return { stdout, stderr, exitCode, verdict: null, compileError: null };
}

// ------------ Local execution (JS/Python fallback) ------------
async function runLocal(codeStr, langKey, stdin, timeoutMs = 5000) {
  const ext =
    langKey.startsWith("py") || langKey === "python3"
      ? "py"
      : langKey === "javascript"
      ? "js"
      : null;
  if (!ext) throw new Error("Local exec unsupported for language");

  const tmpFile = path.join(
    os.tmpdir(),
    `code-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
  );
  await writeFile(tmpFile, codeStr, "utf8");

  const runner =
    ext === "js"
      ? "node"
      : process.platform === "win32"
      ? "python"
      : "python3";

  return await new Promise((resolve, reject) => {
    const child = spawn(runner, [tmpFile], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "", finished = false;

    const killTimer = setTimeout(() => {
      if (!finished) {
        child.kill("SIGKILL");
        finished = true;
        resolve({ stdout: "", stderr: "Time Limit Exceeded", exitCode: -1 });
      }
    }, timeoutMs);

    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", (e) => {
      clearTimeout(killTimer);
      if (!finished) { finished = true; reject(e); }
    });
    child.on("close", (code) => {
      clearTimeout(killTimer);
      if (finished) return;
      finished = true;
      resolve({ stdout: out.trim(), stderr: err.trim(), exitCode: code });
    });

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  }).finally(async () => {
    try { await unlink(tmpFile); } catch (_) {}
  });
}

// ------------ Execute one test case ------------
async function executeOneTestCase(langKey, code, input, expectedOutput, timeoutMs = 8000) {
  let result;
  try {
    result = await runWithPiston(langKey, code, input, timeoutMs);
  } catch (pistonErr) {
    // Fallback to local execution for JS/Python
    if (ENABLE_LOCAL_EXEC && (langKey === "javascript" || langKey.startsWith("py"))) {
      try {
        result = await runLocal(code, langKey, input, timeoutMs);
      } catch (localErr) {
        return {
          stdout: "",
          stderr: localErr.message,
          exitCode: -1,
          verdict: "Runtime Error",
          compileError: null,
        };
      }
    } else {
      // Check if Piston is unreachable
      const isNetwork = pistonErr.code === "ECONNREFUSED" || pistonErr.code === "ENOTFOUND" || pistonErr.message.includes("timeout");
      return {
        stdout: "",
        stderr: isNetwork ? "Judge server unavailable. Please try again." : pistonErr.message,
        exitCode: -1,
        verdict: "Runtime Error",
        compileError: null,
      };
    }
  }

  // If already has a verdict from piston (Compilation Error)
  if (result.verdict) {
    return result;
  }

  const verdict = detectVerdict(result.stdout, result.stderr, result.exitCode, expectedOutput);
  return { ...result, verdict };
}

// ================================================================
// CONTROLLER: Run Code (sample tests + custom input, no DB save)
// ================================================================
export const runCode = async (req, res) => {
  try {
    const { code, language, customInput } = req.body;
    const { id } = req.params;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "No code provided" });
    }

    const problem = await CodingProblem.findById(id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const langKey = (language || "").toLowerCase();
    if (!PISTON_LANG_MAP[langKey]) {
      return res.status(400).json({ error: "Unsupported programming language" });
    }

    const timeLimit = parseFloat(problem.timeLimit) || 2.0;
    const timeoutMs = Math.min(Math.max(timeLimit * 1000 * 2, 5000), 15000);

    // ---- Custom Input execution ----
    if (customInput !== undefined && customInput !== null) {
      const stdinVal = String(customInput);
      const result = await executeOneTestCase(langKey, code, stdinVal, "", timeoutMs);
      return res.json({
        mode: "custom",
        input: stdinVal,
        output: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        verdict: result.exitCode === 0 ? "Executed" : (result.compileError ? "Compilation Error" : "Runtime Error"),
        compileError: result.compileError || null,
        runtime: null,
      });
    }

    // ---- Sample Test Cases (visible only) ----
    const sampleCases = (problem.sampleTestCases || []).filter((tc) => tc.visible !== false);
    const runCases = sampleCases.length > 0 ? sampleCases : (problem.testCases || []).slice(0, 3);

    const results = [];
    let passedCount = 0;
    let compileError = null;

    for (let i = 0; i < runCases.length; i++) {
      const tc = runCases[i];
      const result = await executeOneTestCase(langKey, code, tc.input, tc.output, timeoutMs);

      if (result.verdict === "Compilation Error" && !compileError) {
        compileError = result.compileError || result.stderr;
        // Stop on compile error, return all remaining as CE
        results.push({
          index: i,
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput: "",
          verdict: "Compilation Error",
          stderr: result.stderr,
          passed: false,
          visible: tc.visible !== false,
        });
        // Fill rest
        for (let j = i + 1; j < runCases.length; j++) {
          results.push({
            index: j,
            input: runCases[j].input,
            expectedOutput: runCases[j].output,
            actualOutput: "",
            verdict: "Compilation Error",
            stderr: "",
            passed: false,
            visible: runCases[j].visible !== false,
          });
        }
        break;
      }

      const passed = result.verdict === "Accepted";
      if (passed) passedCount++;

      results.push({
        index: i,
        input: tc.input,
        expectedOutput: (tc.output || "").trim(),
        actualOutput: result.stdout,
        verdict: result.verdict,
        stderr: result.stderr,
        passed,
        visible: tc.visible !== false,
      });

      // Stop early on first Runtime Error (like LeetCode)
      if (result.verdict === "Runtime Error" || result.verdict === "Time Limit Exceeded") {
        for (let j = i + 1; j < runCases.length; j++) {
          results.push({
            index: j,
            input: runCases[j].input,
            expectedOutput: runCases[j].output,
            actualOutput: "",
            verdict: "Skipped",
            stderr: "",
            passed: false,
            visible: runCases[j].visible !== false,
          });
        }
        break;
      }
    }

    const overallVerdict =
      compileError ? "Compilation Error" :
      passedCount === results.filter(r => r.verdict !== "Skipped").length ? "Accepted" :
      results.find(r => r.verdict === "Time Limit Exceeded") ? "Time Limit Exceeded" :
      results.find(r => r.verdict === "Runtime Error") ? "Runtime Error" :
      "Wrong Answer";

    return res.json({
      mode: "run",
      passedCount,
      totalCount: runCases.length,
      overallVerdict,
      compileError: compileError || null,
      results,
    });
  } catch (err) {
    console.error("[Run Code Error]:", err);
    res.status(500).json({ error: "Code execution failed: " + err.message });
  }
};

// ================================================================
// CONTROLLER: Submit Code (ALL test cases, DB save)
// ================================================================
export const submitCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "No code provided" });
    }

    const problem = await CodingProblem.findById(id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const langKey = (language || "").toLowerCase();
    if (!PISTON_LANG_MAP[langKey]) {
      return res.status(400).json({ error: "Unsupported programming language" });
    }

    const timeLimit = parseFloat(problem.timeLimit) || 2.0;
    const timeoutMs = Math.min(Math.max(timeLimit * 1000 * 2, 5000), 15000);

    // All test cases (hidden + visible)
    const allTestCases =
      problem.testCases && problem.testCases.length > 0
        ? problem.testCases
        : problem.sampleTestCases && problem.sampleTestCases.length > 0
        ? problem.sampleTestCases
        : [];

    const results = [];
    let passedCount = 0;
    let compileError = null;
    let firstFailure = null;

    for (let i = 0; i < allTestCases.length; i++) {
      const tc = allTestCases[i];
      const result = await executeOneTestCase(langKey, code, tc.input, tc.output, timeoutMs);

      if (result.verdict === "Compilation Error" && !compileError) {
        compileError = result.compileError || result.stderr;
        results.push({
          index: i,
          input: tc.visible ? tc.input : "[Hidden]",
          expectedOutput: tc.visible ? tc.output : "[Hidden]",
          actualOutput: "",
          verdict: "Compilation Error",
          stderr: result.stderr,
          passed: false,
          visible: tc.visible !== false,
        });
        for (let j = i + 1; j < allTestCases.length; j++) {
          results.push({
            index: j,
            input: allTestCases[j].visible ? allTestCases[j].input : "[Hidden]",
            expectedOutput: allTestCases[j].visible ? allTestCases[j].output : "[Hidden]",
            actualOutput: "",
            verdict: "Compilation Error",
            stderr: "",
            passed: false,
            visible: allTestCases[j].visible !== false,
          });
        }
        break;
      }

      const passed = result.verdict === "Accepted";
      if (passed) passedCount++;

      const entry = {
        index: i,
        input: tc.visible !== false ? tc.input : "[Hidden]",
        expectedOutput: tc.visible !== false ? (tc.output || "").trim() : "[Hidden]",
        actualOutput: tc.visible !== false ? result.stdout : (passed ? "[Correct]" : "[Wrong]"),
        verdict: result.verdict,
        stderr: result.stderr,
        passed,
        visible: tc.visible !== false,
      };
      results.push(entry);

      if (!passed && !firstFailure) {
        firstFailure = { ...entry, input: tc.input, expectedOutput: tc.output, actualOutput: result.stdout };
      }

      // Stop early on TLE or RE (first occurrence)
      if (result.verdict === "Runtime Error" || result.verdict === "Time Limit Exceeded") {
        for (let j = i + 1; j < allTestCases.length; j++) {
          results.push({
            index: j,
            input: "[Skipped]",
            expectedOutput: "[Skipped]",
            actualOutput: "",
            verdict: "Skipped",
            stderr: "",
            passed: false,
            visible: allTestCases[j].visible !== false,
          });
        }
        break;
      }
    }

    // Overall verdict
    let overallVerdict;
    if (compileError) {
      overallVerdict = "Compilation Error";
    } else {
      const rte = results.find(r => r.verdict === "Runtime Error");
      const tle = results.find(r => r.verdict === "Time Limit Exceeded");
      if (tle) overallVerdict = "Time Limit Exceeded";
      else if (rte) overallVerdict = "Runtime Error";
      else if (passedCount === allTestCases.length) overallVerdict = "Accepted";
      else overallVerdict = "Wrong Answer";
    }

    // Plagiarism check
    const prevSubs = await CodingSubmission.find({ problem: id }).limit(50);
    let maxPlagiarism = 0;
    for (const sub of prevSubs) {
      if (!sub.code) continue;
      const percent = checkPlagiarism(code, sub.code);
      if (percent > maxPlagiarism) maxPlagiarism = percent;
    }

    // Save submission
    const submissionDoc = new CodingSubmission({
      user: userId,
      problem: id,
      code,
      language: langKey,
      result: overallVerdict,
      passedCount,
      totalCount: allTestCases.length,
      plagiarism: maxPlagiarism,
      details: results.map(r => ({
        index: r.index,
        input: r.input,
        expectedOutput: r.expectedOutput,
        userOutput: r.actualOutput,
        status: r.verdict,
        visible: r.visible,
      })),
    });
    const savedSubmission = await submissionDoc.save();

    res.json({
      mode: "submit",
      result: overallVerdict,
      passedCount,
      totalCount: allTestCases.length,
      compileError: compileError || null,
      firstFailure,
      plagiarism: maxPlagiarism,
      results,
      submissionId: savedSubmission._id,
      language: langKey,
    });
  } catch (err) {
    console.error("[Submit Code Error]:", err);
    res.status(500).json({ error: "Submission failed: " + err.message });
  }
};

// ================================================================
// CONTROLLER: Submissions history
// ================================================================
export const getSubmissionsByProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const submissions = await CodingSubmission.find({ problem: id })
      .populate("user", "name username")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const submissions = await CodingSubmission.find({ user: userId })
      .populate("problem", "title difficulty dsaTopic")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserSubmissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const submissions = await CodingSubmission.find({ user: userId })
      .populate("problem", "title difficulty dsaTopic")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllStudentsCodingStats = async (req, res) => {
  try {
    const stats = await CodingSubmission.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
      {
        $group: {
          _id: "$user",
          name: { $first: "$userInfo.name" },
          email: { $first: "$userInfo.email" },
          avatar: { $first: "$userInfo.avatar" },
          totalSubmissions: { $sum: 1 },
          acceptedCount: {
            $sum: { $cond: [{ $eq: ["$result", "Accepted"] }, 1, 0] }
          },
          lastSubmissionAt: { $max: "$createdAt" }
        }
      },
      { $sort: { acceptedCount: -1 } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

