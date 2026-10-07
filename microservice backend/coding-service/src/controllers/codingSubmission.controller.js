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

async function runWithPiston(langKey, codeStr, stdin) {
  const runtime = PISTON_LANG_MAP[langKey];
  if (!runtime) throw new Error(`Unsupported language for Piston: ${langKey}`);

  const response = await axios.post(
    PISTON_URL,
    {
      language: runtime.language,
      version: runtime.version,
      files: [{ name: "main", content: codeStr }],
      stdin: stdin || "",
    },
    { timeout: 15000 }
  );

  const run = response.data.run;
  return {
    stdout: (run.stdout || "").trim(),
    stderr: (run.stderr || "").trim(),
    exitCode: run.code ?? 0,
  };
}

async function runLocal(codeStr, langKey, stdin) {
  const ext =
    langKey.startsWith("py") || langKey === "python3"
      ? "py"
      : langKey === "javascript"
      ? "js"
      : null;
  if (!ext) throw new Error("Local exec unsupported for language");

  const tmpFile = path.join(os.tmpdir(), `code-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`);
  await writeFile(tmpFile, codeStr, "utf8");

  const runner =
    ext === "js"
      ? "node"
      : ext === "py"
      ? process.platform === "win32"
        ? "python"
        : "python3"
      : null;
  if (!runner) throw new Error("No local runner configured");

  return await new Promise((resolve, reject) => {
    const child = spawn(runner, [tmpFile], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    let finished = false;

    const killTimer = setTimeout(() => {
      if (!finished) {
        child.kill("SIGKILL");
        finished = true;
        reject(new Error("Time Limit Exceeded"));
      }
    }, 4000);

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

export const submitCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;

    const problem = await CodingProblem.findById(id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const langKey = (language || "").toLowerCase();
    if (!PISTON_LANG_MAP[langKey]) {
      return res.status(400).json({ error: "Unsupported programming language" });
    }

    let passedCount = 0;
    const totalCount = (problem.testCases || []).length;
    const results = [];

    for (let i = 0; i < totalCount; i++) {
      const tc = problem.testCases[i];
      try {
        const out = await runWithPiston(langKey, code, tc.input);
        const userOutput = out.stdout;
        const expectedOutput = (tc.output || "").trim();
        const isPassed = userOutput === expectedOutput;

        if (isPassed) passedCount++;
        results.push({
          index: i,
          input: tc.input,
          expectedOutput,
          userOutput,
          status: isPassed ? "Passed" : "Failed",
          visible: !!tc.visible,
        });
      } catch (err) {
        if (ENABLE_LOCAL_EXEC && (langKey === "javascript" || langKey.startsWith("py"))) {
          try {
            const out = await runLocal(code, langKey, tc.input);
            const userOutput = (out.stdout || "").trim();
            const expectedOutput = (tc.output || "").trim();
            const isPassed = userOutput === expectedOutput;
            if (isPassed) passedCount++;
            results.push({
              index: i,
              input: tc.input,
              expectedOutput,
              userOutput,
              status: isPassed ? "Passed" : "Failed",
              visible: !!tc.visible,
            });
            continue;
          } catch (le) {
            console.error("Local exec error:", le.message);
          }
        }

        results.push({
          index: i,
          input: tc.input,
          expectedOutput: tc.output,
          userOutput: "Execution error",
          status: "Error",
          visible: !!tc.visible,
        });
      }
    }

    // Plagiarism comparison against past submissions
    const prevSubs = await CodingSubmission.find({ problem: id });
    let maxPlagiarism = 0;
    for (const sub of prevSubs) {
      if (!sub.code) continue;
      const percent = checkPlagiarism(code, sub.code);
      if (percent > maxPlagiarism) maxPlagiarism = percent;
    }

    const saveParam = req.query.save;
    const shouldSave = saveParam === "true" || passedCount === totalCount;

    let savedSubmission = null;
    if (shouldSave) {
      const submissionDoc = new CodingSubmission({
        user: userId,
        problem: id,
        code,
        language,
        result: passedCount === totalCount ? "Accepted" : "Wrong Answer",
        passedCount,
        totalCount,
        plagiarism: maxPlagiarism,
        details: results,
      });
      savedSubmission = await submissionDoc.save();
    }

    const visibleDetails = results.filter((r) => r.visible);

    res.json({
      result: passedCount === totalCount ? "Accepted" : "Wrong Answer",
      passedCount,
      totalCount,
      plagiarism: maxPlagiarism,
      details: results,
      visibleDetails,
      saved: !!savedSubmission,
      submissionId: savedSubmission ? savedSubmission._id : null,
    });
  } catch (err) {
    console.error("[Coding Service Execution Error]:", err);
    res.status(500).json({ error: "Error executing code submission" });
  }
};

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
