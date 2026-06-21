import axios from "axios";
import { writeFile, unlink } from "fs/promises";
import { spawn } from "child_process";
import os from "os";
import path from "path";
import CodingSubmission from "../models/CodingSubmission.js";
import CodingProblem from "../models/CodingProblem.js";
import { checkPlagiarism } from "../utils/plagiarism.js";

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions";
const ENABLE_LOCAL_EXEC = process.env.ENABLE_LOCAL_EXEC === "true";

async function runLocal(codeStr, langKey, stdin) {
  const ext = langKey.startsWith("py") || langKey === "python3" ? "py" : langKey === "javascript" ? "js" : null;
  if (!ext) throw new Error("Local exec unsupported for language");
  const tmpFile = path.join(os.tmpdir(), `code-${Date.now()}.${ext}`);
  await writeFile(tmpFile, codeStr, "utf8");
  const runner = ext === "js" ? "node" : ext === "py" ? (process.platform === "win32" ? "python" : "python3") : null;
  if (!runner) throw new Error("No local runner");
  return await new Promise((resolve, reject) => {
    const child = spawn(runner, [tmpFile], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    let finished = false;
    const killTimer = setTimeout(() => {
      if (!finished) {
        child.kill("SIGKILL");
        finished = true;
        reject(new Error("Timeout"));
      }
    }, 4000); // 4s per testcase
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", (e) => {
      clearTimeout(killTimer);
      if (!finished) {
        finished = true;
        reject(e);
      }
    });
    child.on("close", (code) => {
      clearTimeout(killTimer);
      if (finished) return;
      finished = true;
      resolve({ stdout: out.trim(), stderr: err.trim(), exitCode: code });
    });
    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
  }).finally(async () => {
    try {
      await unlink(tmpFile);
    } catch (_) {}
  });
}

export const submitCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    const { id } = req.params;
    const userId = req.user._id;

    const problem = await CodingProblem.findById(id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const langMap = {
      javascript: 63,
      python: 71,
      python3: 71,
      cpp: 54,
      "c++": 54,
      java: 62,
    };

    const langKey = (language || "").toLowerCase();
    const langId = langMap[langKey];
    if (!langId) return res.status(400).json({ error: "Unsupported language" });

    let passedCount = 0;
    const totalCount = (problem.testCases || []).length;
    const results = [];

    for (let i = 0; i < totalCount; i++) {
      const tc = problem.testCases[i];
      try {
        // try Judge0
        const submission = await axios.post(
          `${JUDGE0_URL}?base64_encoded=false&wait=true`,
          {
            source_code: code,
            language_id: langId,
            stdin: tc.input,
            expected_output: tc.output,
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || process.env.JUDGE0_API_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
            timeout: 15000,
          }
        );

        const result = submission.data;
        const userOutput = (result.stdout || "").trim();
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
        // If Judge0 quota error or other failure and local exec enabled -> fallback
        const errMsg = err?.response?.data || err?.message || err;
        console.error("Judge0 API error:", errMsg);
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
            console.error("Local exec error:", le.message || le);
            results.push({
              index: i,
              input: tc.input,
              expectedOutput: tc.output,
              userOutput: "Execution error",
              status: "Error",
              visible: !!tc.visible,
            });
            continue;
          }
        }

        // default: mark as execution error
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

    // plagiarism
    const prevSubs = await CodingSubmission.find({ problem: id });
    let maxPlagiarism = 0;
    for (const sub of prevSubs) {
      if (!sub.code) continue;
      const percent = checkPlagiarism(code, sub.code);
      if (percent > maxPlagiarism) maxPlagiarism = percent;
    }

    const plagiarismScore = maxPlagiarism;

    // IMPORTANT: save only when all testcases passed by default.
    // Allow override with ?save=true or skip with ?save=false
    const saveParam = req.query.save; // 'true'|'false'|undefined
    const saveIfAllPassed = req.query.saveIfAllPassed === "true";

    let savedSubmission = null;
    let shouldSave = false;
    if (saveParam === "true") {
      shouldSave = true;
    } else if (saveParam === "false") {
      shouldSave = false;
    } else {
      // default behavior: save only when all testcases passed
      shouldSave = passedCount === totalCount;
      // if caller explicitly asked saveIfAllPassed=true, honor it (same effect)
      if (saveIfAllPassed) shouldSave = passedCount === totalCount;
    }

    if (shouldSave) {
      const submissionDoc = new CodingSubmission({
        user: userId,
        problem: id,
        code,
        language,
        result: passedCount === totalCount ? "Accepted" : "Wrong Answer",
        passedCount,
        totalCount,
        plagiarism: plagiarismScore,
        details: results,
      });
      savedSubmission = await submissionDoc.save();
    }

    const visibleDetails = results.filter((r) => r.visible);

    res.json({
      result: passedCount === totalCount ? "Accepted" : "Wrong Answer",
      passedCount,
      totalCount,
      plagiarism: plagiarismScore,
      details: results,
      visibleDetails,
      saved: !!savedSubmission,
      submissionId: savedSubmission ? savedSubmission._id : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error executing code" });
  }
};
// ...existing code...