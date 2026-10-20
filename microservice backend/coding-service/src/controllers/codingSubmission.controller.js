import axios from "axios";
import { writeFile, unlink, mkdir, rm } from "fs/promises";
import { spawn } from "child_process";
import os from "os";
import path from "path";
import CodingSubmission from "../models/CodingSubmission.js";
import CodingProblem from "../models/CodingProblem.js";
import User from "../models/User.js";
import { checkPlagiarism } from "../utils/plagiarism.js";
import { evaluateCodeLogic } from "../utils/logicJudge.js";

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

// ------------ Local execution (Java runner) ------------
async function runJavaLocal(codeStr, stdin, timeoutMs = 8000) {
  const tmpDir = path.join(os.tmpdir(), `java-run-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  await mkdir(tmpDir, { recursive: true });

  const classMatch = codeStr.match(/public\s+class\s+([a-zA-Z0-9_$]+)/);
  const className = classMatch ? classMatch[1] : "Main";
  const javaFile = path.join(tmpDir, `${className}.java`);

  await writeFile(javaFile, codeStr, "utf8");

  // Compile
  const compileResult = await new Promise((resolve) => {
    const compileChild = spawn("javac", [javaFile]);
    let err = "";
    compileChild.stderr.on("data", (d) => (err += d.toString()));
    compileChild.on("close", (code) => {
      resolve({ exitCode: code, stderr: err.trim() });
    });
    compileChild.on("error", (e) => {
      resolve({ exitCode: -1, stderr: e.message });
    });
  });

  if (compileResult.exitCode !== 0) {
    try { await rm(tmpDir, { recursive: true, force: true }); } catch (_) {}
    return {
      stdout: "",
      stderr: compileResult.stderr || "Compilation failed",
      exitCode: compileResult.exitCode,
      verdict: "Compilation Error",
      compileError: compileResult.stderr || "Compilation failed",
    };
  }

  // Run
  const runResult = await new Promise((resolve) => {
    const runChild = spawn("java", ["-cp", tmpDir, className], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "", finished = false;

    const killTimer = setTimeout(() => {
      if (!finished) {
        finished = true;
        try { runChild.kill("SIGKILL"); } catch (_) {}
        resolve({ stdout: "", stderr: "Time Limit Exceeded", exitCode: -1, verdict: "Time Limit Exceeded" });
      }
    }, timeoutMs);

    runChild.stdout.on("data", (d) => (out += d.toString()));
    runChild.stderr.on("data", (d) => (err += d.toString()));
    runChild.on("error", (e) => {
      clearTimeout(killTimer);
      if (!finished) {
        finished = true;
        resolve({ stdout: "", stderr: e.message, exitCode: -1, verdict: "Runtime Error" });
      }
    });
    runChild.on("close", (code) => {
      clearTimeout(killTimer);
      if (!finished) {
        finished = true;
        resolve({
          stdout: out.trim(),
          stderr: err.trim(),
          exitCode: code,
          verdict: code !== 0 ? "Runtime Error" : null,
        });
      }
    });

    if (stdin) runChild.stdin.write(stdin);
    runChild.stdin.end();
  }).finally(async () => {
    try { await rm(tmpDir, { recursive: true, force: true }); } catch (_) {}
  });

  return runResult;
}

// ------------ Local execution (JS/Python/Java) ------------
async function runLocal(codeStr, langKey, stdin, timeoutMs = 8000) {
  if (langKey === "java") {
    return await runJavaLocal(codeStr, stdin, timeoutMs);
  }

  const ext =
    langKey.startsWith("py") || langKey === "python3"
      ? "py"
      : langKey === "javascript"
      ? "js"
      : null;

  if (!ext) {
    throw new Error(`Local compiler for '${langKey}' is not available on this server environment.`);
  }

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
        try { child.kill("SIGKILL"); } catch (_) {}
        finished = true;
        resolve({ stdout: "", stderr: "Time Limit Exceeded", exitCode: -1, verdict: "Time Limit Exceeded" });
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
      resolve({
        stdout: out.trim(),
        stderr: err.trim(),
        exitCode: code,
        verdict: code !== 0 ? "Runtime Error" : null,
      });
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

  // Direct local runner for Java, JavaScript, Python
  const isLocalSupported = langKey === "javascript" || langKey.startsWith("py") || langKey === "python3" || langKey === "java";

  if (isLocalSupported) {
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
    // For other languages like C++, attempt Piston with graceful fallback
    try {
      result = await runWithPiston(langKey, code, input, timeoutMs);
    } catch (pistonErr) {
      try {
        result = await runLocal(code, langKey, input, timeoutMs);
      } catch (localErr) {
        const is401 = pistonErr?.response?.status === 401 || (pistonErr?.message && pistonErr.message.includes("401"));
        return {
          stdout: "",
          stderr: is401
            ? "C++ online compiler is restricted. Please select Java, Python, or JavaScript."
            : localErr.message || pistonErr.message,
          exitCode: -1,
          verdict: "Runtime Error",
          compileError: null,
        };
      }
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

    // Logic-based semantic & anti-hardcoding evaluation
    const logicAnalysis = evaluateCodeLogic({
      code,
      language: langKey,
      problem,
      testCases: runCases,
      executionResults: results,
      compileError,
      overallVerdict,
    });

    const finalVerdict = logicAnalysis.isHardcoded ? "Hardcoding Detected" : overallVerdict;

    return res.json({
      mode: "run",
      passedCount,
      totalCount: runCases.length,
      overallVerdict: finalVerdict,
      compileError: compileError || null,
      results,
      logicScore: logicAnalysis.logicScore,
      logicAnalysis,
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

    // Logic-based semantic & anti-hardcoding evaluation
    const logicAnalysis = evaluateCodeLogic({
      code,
      language: langKey,
      problem,
      testCases: allTestCases,
      executionResults: results,
      compileError,
      overallVerdict,
    });

    if (logicAnalysis.isHardcoded) {
      overallVerdict = "Hardcoding Detected";
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
      logicScore: logicAnalysis.logicScore,
      logicDetails: logicAnalysis,
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
      logicScore: logicAnalysis.logicScore,
      logicAnalysis,
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
    const { college, degree, yearOfPassing } = req.query;
    const matchUser = {};
    if (college) matchUser["userInfo.college"] = college;
    if (degree) matchUser["userInfo.degree"] = degree;
    if (yearOfPassing) matchUser["userInfo.yearOfPassing"] = yearOfPassing;

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
    ];

    if (Object.keys(matchUser).length > 0) {
      pipeline.push({ $match: matchUser });
    }

    pipeline.push(
      {
        $lookup: {
          from: "codingproblems",
          localField: "problem",
          foreignField: "_id",
          as: "problemInfo"
        }
      },
      {
        $unwind: {
          path: "$problemInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$user",
          name: { $first: "$userInfo.name" },
          email: { $first: "$userInfo.email" },
          avatar: { $first: "$userInfo.avatar" },
          college: { $first: "$userInfo.college" },
          degree: { $first: "$userInfo.degree" },
          yearOfPassing: { $first: "$userInfo.yearOfPassing" },
          totalSubmissions: { $sum: 1 },
          acceptedCount: {
            $sum: { $cond: [{ $eq: ["$result", "Accepted"] }, 1, 0] }
          },
          basicSolved: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$result", "Accepted"] },
                    { $eq: [{ $toLower: "$problemInfo.difficulty" }, "basic"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          easySolved: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$result", "Accepted"] },
                    { $eq: [{ $toLower: "$problemInfo.difficulty" }, "easy"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          mediumSolved: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$result", "Accepted"] },
                    { $eq: [{ $toLower: "$problemInfo.difficulty" }, "medium"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          hardSolved: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$result", "Accepted"] },
                    { $eq: [{ $toLower: "$problemInfo.difficulty" }, "hard"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          lastSubmissionAt: { $max: "$createdAt" }
        }
      },
      { $sort: { acceptedCount: -1 } }
    );

    const stats = await CodingSubmission.aggregate(pipeline);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllSubmissions = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 2000, 5000);
    const { college, degree, yearOfPassing } = req.query;

    let userFilter = null;
    if (college || degree || yearOfPassing) {
      const uQuery = {};
      if (college) uQuery.college = college;
      if (degree) uQuery.degree = degree;
      if (yearOfPassing) uQuery.yearOfPassing = yearOfPassing;
      const matchedUsers = await User.find(uQuery, "_id");
      userFilter = matchedUsers.map(u => u._id);
    }

    const filter = {};
    if (userFilter) {
      filter.user = { $in: userFilter };
    }

    const submissions = await CodingSubmission.find(filter)
      .populate("user", "name email username college degree yearOfPassing")
      .populate("problem", "title difficulty dsaTopic")
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAcademicCodingAnalytics = async (req, res) => {
  try {
    // 1. Get distinct academic fields (colleges, departments/degrees, graduating batches)
    const userAggregate = await CodingSubmission.aggregate([
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
          _id: null,
          colleges: { $addToSet: "$userInfo.college" },
          departments: { $addToSet: "$userInfo.degree" },
          batches: { $addToSet: "$userInfo.yearOfPassing" }
        }
      }
    ]);

    const colleges = (userAggregate[0]?.colleges || [])
      .map(c => (c || "").trim())
      .filter(Boolean);
    const uniqueColleges = [...new Set(colleges)].sort();

    const departments = (userAggregate[0]?.departments || [])
      .map(d => (d || "").trim())
      .filter(Boolean);
    const uniqueDepartments = [...new Set(departments)].sort();

    const batches = (userAggregate[0]?.batches || [])
      .map(b => (b || "").trim())
      .filter(Boolean);
    const uniqueBatches = [...new Set(batches)].sort();

    // 2. Aggregate comparison by College
    const collegeStats = await CodingSubmission.aggregate([
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
        $match: {
          "userInfo.college": { $exists: true, $ne: "" }
        }
      },
      {
        $group: {
          _id: { $trim: { input: "$userInfo.college" } },
          totalSubmissions: { $sum: 1 },
          acceptedSubmissions: {
            $sum: { $cond: [{ $eq: ["$result", "Accepted"] }, 1, 0] }
          },
          students: { $addToSet: "$user" },
          solvers: {
            $addToSet: {
              $cond: [{ $eq: ["$result", "Accepted"] }, "$user", null]
            }
          }
        }
      },
      {
        $project: {
          college: "$_id",
          totalSubmissions: 1,
          acceptedSubmissions: 1,
          totalStudents: { $size: "$students" },
          uniqueSolvers: {
            $size: {
              $filter: {
                input: "$solvers",
                as: "s",
                cond: { $ne: ["$$s", null] }
              }
            }
          },
          acceptanceRate: {
            $cond: [
              { $gt: ["$totalSubmissions", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$acceptedSubmissions", "$totalSubmissions"] },
                      100
                    ]
                  },
                  1
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { acceptedSubmissions: -1 } }
    ]);

    // 3. Aggregate comparison by Batch (year of passing)
    const batchStats = await CodingSubmission.aggregate([
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
        $match: {
          "userInfo.yearOfPassing": { $exists: true, $ne: "" }
        }
      },
      {
        $group: {
          _id: { $trim: { input: "$userInfo.yearOfPassing" } },
          totalSubmissions: { $sum: 1 },
          acceptedSubmissions: {
            $sum: { $cond: [{ $eq: ["$result", "Accepted"] }, 1, 0] }
          },
          students: { $addToSet: "$user" },
          solvers: {
            $addToSet: {
              $cond: [{ $eq: ["$result", "Accepted"] }, "$user", null]
            }
          }
        }
      },
      {
        $project: {
          batch: "$_id",
          totalSubmissions: 1,
          acceptedSubmissions: 1,
          totalStudents: { $size: "$students" },
          uniqueSolvers: {
            $size: {
              $filter: {
                input: "$solvers",
                as: "s",
                cond: { $ne: ["$$s", null] }
              }
            }
          },
          acceptanceRate: {
            $cond: [
              { $gt: ["$totalSubmissions", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$acceptedSubmissions", "$totalSubmissions"] },
                      100
                    ]
                  },
                  1
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { batch: 1 } }
    ]);

    // 4. Aggregate comparison by Department (degree)
    const departmentStats = await CodingSubmission.aggregate([
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
        $match: {
          "userInfo.degree": { $exists: true, $ne: "" }
        }
      },
      {
        $group: {
          _id: { $trim: { input: "$userInfo.degree" } },
          totalSubmissions: { $sum: 1 },
          acceptedSubmissions: {
            $sum: { $cond: [{ $eq: ["$result", "Accepted"] }, 1, 0] }
          },
          students: { $addToSet: "$user" },
          solvers: {
            $addToSet: {
              $cond: [{ $eq: ["$result", "Accepted"] }, "$user", null]
            }
          }
        }
      },
      {
        $project: {
          department: "$_id",
          totalSubmissions: 1,
          acceptedSubmissions: 1,
          totalStudents: { $size: "$students" },
          uniqueSolvers: {
            $size: {
              $filter: {
                input: "$solvers",
                as: "s",
                cond: { $ne: ["$$s", null] }
              }
            }
          },
          acceptanceRate: {
            $cond: [
              { $gt: ["$totalSubmissions", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$acceptedSubmissions", "$totalSubmissions"] },
                      100
                    ]
                  },
                  1
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { acceptedSubmissions: -1 } }
    ]);

    res.json({
      colleges: uniqueColleges,
      departments: uniqueDepartments,
      batches: uniqueBatches,
      collegeStats,
      batchStats,
      departmentStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOverallCodingAnalytics = async (req, res) => {
  try {
    const totalSubmissions = await CodingSubmission.countDocuments();
    const totalAccepted = await CodingSubmission.countDocuments({ result: "Accepted" });

    const solvedProblemIds = await CodingSubmission.distinct("problem", { result: "Accepted" });
    const activeUserIds = await CodingSubmission.distinct("user");

    const verdicts = await CodingSubmission.aggregate([
      { $group: { _id: "$result", count: { $sum: 1 } } }
    ]);

    const languages = await CodingSubmission.aggregate([
      { $group: { _id: { $toLower: "$language" }, count: { $sum: 1 } } }
    ]);

    const diffBreakdown = await CodingSubmission.aggregate([
      { $match: { result: "Accepted" } },
      {
        $lookup: {
          from: "codingproblems",
          localField: "problem",
          foreignField: "_id",
          as: "problemInfo"
        }
      },
      { $unwind: "$problemInfo" },
      {
        $group: {
          _id: { $toLower: "$problemInfo.difficulty" },
          count: { $sum: 1 },
          uniqueProblems: { $addToSet: "$problem" }
        }
      }
    ]);

    const difficultySolved = {
      basic: 0,
      easy: 0,
      medium: 0,
      hard: 0,
    };
    diffBreakdown.forEach((item) => {
      if (item._id && difficultySolved[item._id] !== undefined) {
        difficultySolved[item._id] = item.uniqueProblems ? item.uniqueProblems.length : item.count;
      }
    });

    res.json({
      totalSubmissions,
      totalAccepted,
      acceptanceRate:
        totalSubmissions > 0
          ? Math.round((totalAccepted / totalSubmissions) * 100)
          : 0,
      uniqueProblemsSolved: solvedProblemIds.length,
      activeUsersCount: activeUserIds.length,
      difficultySolved,
      verdicts: Object.fromEntries(
        verdicts.map((v) => [v._id || "Unknown", v.count])
      ),
      languages: Object.fromEntries(
        languages.map((l) => [l._id || "other", l.count])
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


