/**
 * Logic-Based Code Judge & Semantic Analyzer
 * Analyzes code logic, detects hardcoding/cheating, estimates algorithmic complexity,
 * checks DSA patterns, and scores solution quality beyond raw string comparison.
 */

// ----------------------------------------------------
// 1. Multi-language Comment & String Stripper
// ----------------------------------------------------
function stripComments(code, language) {
  if (!code) return "";
  const lang = (language || "").toLowerCase();

  if (lang === "python" || lang === "python3") {
    // Strip Python triple-quoted docstrings and # comments
    let cleaned = code.replace(/'''[\s\S]*?'''|"""[\s\S]*?"""/g, "");
    cleaned = cleaned.replace(/#.*$/gm, "");
    return cleaned;
  }

  // C++, Java, JavaScript: strip /* ... */ and // ...
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

// ----------------------------------------------------
// 2. Anti-Hardcoding & Pattern Matching Detection
// ----------------------------------------------------
export function detectHardcoding(code, language, testCases = []) {
  if (!code || !testCases || testCases.length === 0) {
    return { isHardcoded: false, confidence: 0, reason: null, matches: [] };
  }

  const cleaned = stripComments(code, language);
  // Normalize both literal newlines and escaped newlines (\n) to single spaces
  const normalized = cleaned.replace(/\\n/g, " ").replace(/\\r/g, " ").replace(/\s+/g, " ");
  const matchedCases = [];

  for (const tc of testCases) {
    const rawInput = (tc.input || "").trim();
    const rawOutput = (tc.output || "").trim();

    if (!rawInput || !rawOutput) continue;

    const normInput = rawInput.replace(/\\n/g, " ").replace(/\s+/g, " ");
    const normOutput = rawOutput.replace(/\\n/g, " ").replace(/\s+/g, " ");

    const escapedIn = normInput.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");
    const escapedOut = normOutput.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");

    // Pattern 1: if/case matching input followed within 250 chars by output
    const condPattern = new RegExp(
      `(?:if|elif|switch|case|===?|==|includes|indexOf)\\s*\\(?.*${escapedIn}.*?\\)?[^{};:]{0,60}[{:->\\s]+[^{};]*${escapedOut}`,
      "i"
    );

    // Pattern 2: Dictionary / lookup table mapping input -> output, e.g. {"input": "output"}
    const mapPattern = new RegExp(`['"\`]${escapedIn}['"\`]\\s*:\\s*['"\`]${escapedOut}['"\`]`, "i");

    if (condPattern.test(normalized) || mapPattern.test(normalized)) {
      matchedCases.push({ input: rawInput, output: rawOutput });
    }
  }

  if (matchedCases.length >= 2 || (testCases.length === 1 && matchedCases.length === 1)) {
    return {
      isHardcoded: true,
      confidence: Math.min(1.0, 0.6 + matchedCases.length * 0.2),
      reason: `Detected ${matchedCases.length} hardcoded input-to-output test case mappings. Solution must use an algorithmic procedure rather than hardcoded lookup conditions.`,
      matches: matchedCases,
    };
  }

  return { isHardcoded: false, confidence: 0, reason: null, matches: [] };
}

// ----------------------------------------------------
// 3. Algorithmic Patterns & Data Structures Detection
// ----------------------------------------------------
export function detectAlgorithmicPatterns(code, language) {
  const cleaned = stripComments(code, language);
  const patterns = [];
  const detectedStructures = [];

  // Loops
  const forLoops = (cleaned.match(/\bfor\b/g) || []).length;
  const whileLoops = (cleaned.match(/\bwhile\b/g) || []).length;
  const totalLoops = forLoops + whileLoops;

  // Measure Loop Nesting Depth
  let currentDepth = 0;
  let maxLoopDepth = 0;
  let inLoop = false;
  const lines = cleaned.split("\n");

  for (const line of lines) {
    if (/\b(for|while)\b/.test(line)) {
      currentDepth++;
      if (currentDepth > maxLoopDepth) maxLoopDepth = currentDepth;
      inLoop = true;
    }
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    if (closeBraces > openBraces && currentDepth > 0) {
      currentDepth = Math.max(0, currentDepth - (closeBraces - openBraces));
    }
  }

  // Recursion
  const funcMatch = cleaned.match(/(?:function\s+([a-zA-Z0-9_$]+)|def\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{)/);
  const funcName = funcMatch ? (funcMatch[1] || funcMatch[2] || funcMatch[3]) : null;
  let hasRecursion = false;
  if (funcName && !["solve", "main", "if", "for", "while"].includes(funcName)) {
    const callRegex = new RegExp(`\\b${funcName}\\s*\\(`, "g");
    const calls = (cleaned.match(callRegex) || []).length;
    if (calls >= 2) {
      hasRecursion = true;
      patterns.push("Recursion");
    }
  }

  // Two Pointers / Sliding Window
  if (
    /(\bleft\b|\bright\b|\bi\b|\bj\b|\blow\b|\bhigh\b)/.test(cleaned) &&
    /(\+\+|--|\+= 1|-= 1)/.test(cleaned) &&
    totalLoops >= 1
  ) {
    if (/(\bwindow\b|\bsum\b|\bmax\b)/i.test(cleaned)) {
      patterns.push("Sliding Window");
    } else {
      patterns.push("Two Pointers");
    }
  }

  // Binary Search
  if (
    /(\bmid\b|\bmiddle\b)/i.test(cleaned) &&
    /(\/ 2|>> 1|\/\/ 2)/.test(cleaned) &&
    /(\blow\b|\bhigh\b|\bleft\b|\bright\b)/i.test(cleaned)
  ) {
    patterns.push("Binary Search");
  }

  // Dynamic Programming / Memoization
  if (
    /(\bdp\b|\bmemo\b|\btable\b|\bcache\b)/i.test(cleaned) ||
    /(\[i\]\[j\]|@lru_cache)/.test(cleaned)
  ) {
    patterns.push("Dynamic Programming");
    detectedStructures.push("DP Table / Memoization Cache");
  }

  // Hash Map / Set
  if (
    /\b(Map|Set|HashMap|HashSet|unordered_map|unordered_set|dict|Counter|defaultdict)\b/.test(cleaned) ||
    /\{\s*[a-zA-Z0-9_$]+\s*:\s*[a-zA-Z0-9_$]+\s*\}/.test(cleaned)
  ) {
    patterns.push("Hash Map / Set Frequency Count");
    detectedStructures.push("Hash Table / Map");
  }

  // Stack / Queue
  if (

    /\b(Stack|Queue|Deque|ArrayDeque|PriorityQueue|heapq)\b/i.test(cleaned) ||
    (/\.push\b/.test(cleaned) && /\.pop\b/.test(cleaned))
  ) {
    patterns.push("Stack / Queue Processing");
    detectedStructures.push("Stack / Queue");
  }

  // Math / Bit Manipulation
  if (/(<<|>>|&|\^|\||Math\.|\bmath\b|abs\(|min\(|max\()/.test(cleaned)) {
    patterns.push("Mathematical / Bitwise Logic");
  }

  // Sorting
  if (/(\.sort\b|sort\(|Arrays\.sort|Collections\.sort)/.test(cleaned)) {
    patterns.push("Sorting Routine");
  }

  return {
    patterns: [...new Set(patterns)],
    dataStructures: [...new Set(detectedStructures)],
    loopCount: totalLoops,
    maxLoopDepth: Math.max(maxLoopDepth, totalLoops > 0 ? 1 : 0),
    hasRecursion,
  };
}

// ----------------------------------------------------
// 4. Time & Space Complexity Estimator
// ----------------------------------------------------
export function estimateComplexity(codeMetrics, patterns = []) {
  const { maxLoopDepth, hasRecursion } = codeMetrics;

  let time = "O(1)";
  let space = "O(1)";
  let complexityRating = "Optimal";

  if (hasRecursion && patterns.includes("Dynamic Programming")) {
    time = "O(N)";
    space = "O(N)";
  } else if (hasRecursion) {
    time = "O(2^N) or O(N!)";
    space = "O(N) Call Stack";
    complexityRating = "Suboptimal (Exponential Recursion)";
  } else if (patterns.includes("Binary Search")) {
    time = "O(log N)";
    space = "O(1)";
    complexityRating = "Optimal";
  } else if (patterns.includes("Sorting Routine")) {
    time = "O(N log N)";
    space = "O(N)";
    complexityRating = "Optimal";
  } else if (maxLoopDepth === 0) {
    time = "O(1)";
    space = "O(1)";
    complexityRating = "Optimal";
  } else if (maxLoopDepth === 1) {
    time = "O(N)";
    space = patterns.includes("Hash Map / Set Frequency Count") ? "O(N)" : "O(1)";
    complexityRating = "Optimal";
  } else if (maxLoopDepth === 2) {
    time = "O(N²)";
    space = "O(1)";
    complexityRating = "Moderate (Quadratic Loop)";
  } else if (maxLoopDepth >= 3) {
    time = `O(N^${maxLoopDepth})`;
    space = "O(1)";
    complexityRating = "Inefficient (High-degree nested iterations)";
  }

  return { time, space, complexityRating };
}

// ----------------------------------------------------
// 5. Diagnostics & Edge Case Failure Analyzer
// ----------------------------------------------------
export function diagnoseFailingTestCase(failingCase, codeMetrics) {
  if (!failingCase) return null;

  const actual = String(failingCase.actualOutput || "").trim();
  const expected = String(failingCase.expectedOutput || "").trim();
  const input = String(failingCase.input || "").trim();

  // 1. Off-by-one error
  const numActual = Number(actual);
  const numExpected = Number(expected);
  if (!isNaN(numActual) && !isNaN(numExpected)) {
    if (Math.abs(numActual - numExpected) === 1) {
      return {
        type: "Off-by-One Error",
        severity: "Medium",
        message: `Your output (${actual}) is off by 1 from expected (${expected}). Check boundary conditions (0-indexed vs 1-indexed, or < vs <= in loop conditions).`,
      };
    }
  }

  // 2. Format / Whitespace mismatch
  if (actual.replace(/\s+/g, "") === expected.replace(/\s+/g, "")) {
    return {
      type: "Formatting / Whitespace Mismatch",
      severity: "Low",
      message: `The values in your output match the answer, but whitespace or line endings differ. Ensure answers are separated by exact spaces or newlines as requested.`,
    };
  }

  // 3. Null / Undefined / Empty output
  if (!actual || actual === "null" || actual === "undefined" || actual === "None") {
    return {
      type: "Missing Return or Unhandled Path",
      severity: "High",
      message: `Output was empty or undefined. Verify that your function produces a return value or prints to standard output on all code paths.`,
    };
  }

  // 4. Edge Case: Empty / Single Item / Negative inputs
  const lines = input.split(/\s+/);
  if (lines.length <= 1 || input === "0" || input === "1") {
    return {
      type: "Boundary / Base Case Failure",
      severity: "Medium",
      message: `Failed on minimal input constraints (${input.slice(0, 40)}...). Ensure your logic handles edge cases such as single-element or zero-value inputs.`,
    };
  }

  // 5. Quadratic / High Depth Loop warning
  if (codeMetrics.maxLoopDepth >= 2) {
    return {
      type: "Algorithmic Scalability Issue",
      severity: "High",
      message: `Detected nested iterations (O(N²)). If the input size N is up to 10⁵, a nested loop will exceed the time limit or fail on large inputs. Consider a Hash Map or Two-Pointer approach.`,
    };
  }

  return {
    type: "Logic Inconsistency",
    severity: "Medium",
    message: `Output differed from expected. Trace your variables manually on this specific input to see where the state deviates from expected behavior.`,
  };
}

// ----------------------------------------------------
// 6. Master Evaluator: Comprehensive Logic Scoring
// ----------------------------------------------------
export function evaluateCodeLogic({
  code,
  language,
  problem,
  testCases = [],
  executionResults = [],
  compileError = null,
  overallVerdict = "Wrong Answer",
}) {
  // If compilation error, logic cannot be evaluated
  if (compileError || overallVerdict === "Compilation Error") {
    return {
      logicScore: 0,
      isHardcoded: false,
      patterns: [],
      dataStructures: [],
      complexity: { time: "N/A", space: "N/A", complexityRating: "Error" },
      feedback: "Resolve compilation errors to enable algorithmic logic analysis.",
      diagnostics: null,
      edgeCaseResilience: "None",
      breakdown: { correctness: 0, authenticity: 0, complexity: 0, codeQuality: 0 },
    };
  }

  // 1. Hardcoding check
  const hardcodeResult = detectHardcoding(code, language, testCases);

  // 2. Algorithmic patterns & metrics
  const metrics = detectAlgorithmicPatterns(code, language);

  // 3. Complexity estimation
  const complexity = estimateComplexity(metrics, metrics.patterns);

  // 4. Test case correctness ratio
  const total = executionResults.length || 1;
  const passed = executionResults.filter((r) => r.passed || r.verdict === "Accepted").length;
  const passRatio = passed / total;

  // 5. Diagnostics on first failing case
  const failingCase = executionResults.find((r) => !r.passed && r.verdict !== "Accepted" && r.verdict !== "Skipped");
  const diagnostic = diagnoseFailingTestCase(failingCase, metrics);

  // 6. Calculate Logic Score (0 - 100)
  // - Correctness: 50%
  // - Authenticity (No hardcoding): 20%
  // - Complexity & Efficiency: 20%
  // - Code Quality & Pattern Compliance: 10%
  let correctnessPoints = Math.round(passRatio * 50);

  let authenticityPoints = 20;
  if (hardcodeResult.isHardcoded) {
    authenticityPoints = 0;
  }

  let complexityPoints = 20;
  if (complexity.complexityRating.startsWith("Inefficient") || complexity.complexityRating.startsWith("Suboptimal")) {
    complexityPoints = 5;
  } else if (complexity.complexityRating.startsWith("Moderate")) {
    complexityPoints = 12;
  }

  let codeQualityPoints = 10;
  if (metrics.patterns.length > 0) codeQualityPoints = 10;
  else if (metrics.loopCount > 0) codeQualityPoints = 8;
  else codeQualityPoints = 5;

  let logicScore = correctnessPoints + authenticityPoints + complexityPoints + codeQualityPoints;
  if (hardcodeResult.isHardcoded) {
    logicScore = Math.min(logicScore, 25); // Cap hardcoded cheats
  }

  // Edge-case resilience grading
  let edgeCaseResilience = "High";
  if (passRatio < 0.5) edgeCaseResilience = "Low";
  else if (passRatio < 1.0) edgeCaseResilience = "Moderate";

  // Constructive feedback synthesis
  let feedback = "";
  if (hardcodeResult.isHardcoded) {
    feedback = "⚠ Hardcoding Alert: Your solution appears to match specific test cases directly. Please implement a general algorithmic procedure that solves for any arbitrary input.";
  } else if (passRatio === 1.0) {
    if (complexity.time === "O(1)" || complexity.time === "O(N)" || complexity.time === "O(N log N)") {
      feedback = `✓ Excellent Work! Optimal ${complexity.time} algorithm utilizing ${metrics.patterns.join(", ") || "clean iterative logic"}. All test cases passed with high edge-case resilience.`;
    } else {
      feedback = `✓ All test cases passed! However, your algorithm runs in ${complexity.time}. Try optimizing using a hash table or two-pointer technique to achieve linear time complexity.`;
    }
  } else {
    feedback = `Passed ${passed}/${total} test cases (${Math.round(passRatio * 100)}%). ${diagnostic ? diagnostic.message : "Review edge cases and check boundary conditions."}`;
  }

  return {
    logicScore,
    isHardcoded: hardcodeResult.isHardcoded,
    hardcodeReason: hardcodeResult.reason,
    patterns: metrics.patterns,
    dataStructures: metrics.dataStructures,
    loopDepth: metrics.maxLoopDepth,
    complexity,
    diagnostics: diagnostic,
    edgeCaseResilience,
    feedback,
    breakdown: {
      correctness: correctnessPoints,
      authenticity: authenticityPoints,
      complexity: complexityPoints,
      codeQuality: codeQualityPoints,
    },
  };
}
