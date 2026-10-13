import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const ATLAS_URI =
  process.env.MONGO_URI ||
  "mongodb://maitymalay334_db_user:malayCode21@ac-m8w7vpt-shard-00-00.vvosns0.mongodb.net:27017,ac-m8w7vpt-shard-00-01.vvosns0.mongodb.net:27017,ac-m8w7vpt-shard-00-02.vvosns0.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";
const LOCAL_URI = "mongodb://127.0.0.1:27017/code_campus";

const SAMPLE_PYTHON_SOLUTIONS = [
  `def solve(*args):\n    # Optimized solution\n    res = []\n    for x in args[0]:\n        if x not in res:\n            res.append(x)\n    return res`,
  `class Solution:\n    def solution(self, nums):\n        nums.sort()\n        return [x for x in nums if x > 0]`,
  `def solution(head):\n    curr = head\n    prev = None\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev`,
  `def solveProblem(arr, k):\n    from collections import deque\n    q = deque()\n    res = []\n    for i in range(len(arr)):\n        while q and q[0] <= i - k:\n            q.popleft()\n        while q and arr[q[-1]] <= arr[i]:\n            q.pop()\n        q.append(i)\n        if i >= k - 1:\n            res.append(arr[q[0]])\n    return res`,
];

const SAMPLE_JS_SOLUTIONS = [
  `function solve(arr) {\n  const map = new Map();\n  for (let x of arr) {\n    map.set(x, (map.get(x) || 0) + 1);\n  }\n  return Array.from(map.entries()).sort((a,b) => b[1] - a[1]);\n}`,
  `function twoSum(nums, target) {\n  const map = {};\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map[diff] !== undefined) return [map[diff], i];\n    map[nums[i]] = i;\n  }\n  return [];\n}`,
  `function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    let next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}`,
];

const SAMPLE_CPP_SOLUTIONS = [
  `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> solve(vector<int>& nums) {\n        sort(nums.begin(), nums.end());\n        return nums;\n    }\n};`,
  `#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int, int> seen;\n    for(int i = 0; i < nums.size(); i++) {\n        int complement = target - nums[i];\n        if(seen.count(complement)) return {seen[complement], i};\n        seen[nums[i]] = i;\n    }\n    return {};\n}`,
];

const LANGUAGES = ["python", "javascript", "cpp", "java"];

// Distribution profile for different users
const USER_PROFILES = [
  {
    // The current active user on the UI
    matchEmail: "maitymalay27747@gmail.com",
    name: "Malay Maity",
    solveCounts: { basic: 24, easy: 46, medium: 34, hard: 18 },
  },
  {
    matchEmail: "aarav.sharma@campus.edu",
    name: "Aarav Sharma",
    solveCounts: { basic: 28, easy: 56, medium: 42, hard: 22 },
  },
  {
    matchEmail: "priya.patel@campus.edu",
    name: "Priya Patel",
    solveCounts: { basic: 26, easy: 50, medium: 38, hard: 19 },
  },
  {
    matchEmail: "ananya.iyer@campus.edu",
    name: "Ananya Iyer",
    solveCounts: { basic: 27, easy: 52, medium: 40, hard: 21 },
  },
  {
    matchEmail: "rohan.verma@campus.edu",
    name: "Rohan Verma",
    solveCounts: { basic: 20, easy: 36, medium: 24, hard: 10 },
  },
  {
    matchEmail: "sneha.roy@campus.edu",
    name: "Sneha Roy",
    solveCounts: { basic: 22, easy: 40, medium: 28, hard: 12 },
  },
  {
    matchEmail: "kavya.reddy@campus.edu",
    name: "Kavya Reddy",
    solveCounts: { basic: 25, easy: 44, medium: 32, hard: 16 },
  },
  {
    matchEmail: "vikram.malhotra@campus.edu",
    name: "Vikram Malhotra",
    solveCounts: { basic: 18, easy: 32, medium: 20, hard: 8 },
  },
  {
    matchEmail: "arjun.das@campus.edu",
    name: "Arjun Das",
    solveCounts: { basic: 16, easy: 26, medium: 14, hard: 5 },
  },
  {
    matchEmail: "tanmay.joshi@campus.edu",
    name: "Tanmay Joshi",
    solveCounts: { basic: 12, easy: 18, medium: 8, hard: 2 },
  },
  {
    matchEmail: "divya.nair@campus.edu",
    name: "Divya Nair",
    solveCounts: { basic: 14, easy: 20, medium: 10, hard: 3 },
  },
];

async function seedSubmissionsForUri(targetUri, label) {
  console.log(`\n======================================================`);
  console.log(`Seeding Coding Submissions to: ${label}`);
  console.log(`======================================================`);

  let conn;
  try {
    conn = await mongoose.createConnection(targetUri, {
      serverSelectionTimeoutMS: 8000,
    }).asPromise();
    console.log(`✓ Connected to ${label}`);
  } catch (err) {
    console.error(`✗ Connection failed to ${label}:`, err.message);
    return;
  }

  try {
    const usersColl = conn.collection("users");
    const problemsColl = conn.collection("codingproblems");
    const submissionsColl = conn.collection("codingsubmissions");

    // Fetch all problems
    const allProblems = await problemsColl.find({}).toArray();
    console.log(`Found ${allProblems.length} coding problems in ${label}`);
    if (allProblems.length === 0) {
      console.log("No coding problems found. Skipping.");
      await conn.close();
      return;
    }

    // Group problems by normalized difficulty
    const problemsByDiff = {
      basic: [],
      easy: [],
      medium: [],
      hard: [],
    };

    allProblems.forEach((p) => {
      const d = String(p.difficulty || "Easy").toLowerCase();
      if (problemsByDiff[d]) {
        problemsByDiff[d].push(p);
      } else {
        problemsByDiff.easy.push(p);
      }
    });

    console.log("Problems by difficulty:");
    console.log(`  - Basic: ${problemsByDiff.basic.length}`);
    console.log(`  - Easy: ${problemsByDiff.easy.length}`);
    console.log(`  - Medium: ${problemsByDiff.medium.length}`);
    console.log(`  - Hard: ${problemsByDiff.hard.length}`);

    let totalSubmissionsInserted = 0;

    for (const profile of USER_PROFILES) {
      const userDoc = await usersColl.findOne({
        email: { $regex: new RegExp(`^${profile.matchEmail}$`, "i") },
      });

      if (!userDoc) {
        console.log(`  ! User ${profile.name} (${profile.matchEmail}) not found in DB. Skipping.`);
        continue;
      }

      console.log(`\n  Generating submissions for ${profile.name} (${userDoc.email}):`);

      for (const diff of ["basic", "easy", "medium", "hard"]) {
        const pool = problemsByDiff[diff];
        const targetCount = Math.min(pool.length, profile.solveCounts[diff] || 0);

        // Pick distinct problems for this difficulty
        const selectedProblems = [...pool]
          .sort(() => 0.5 - Math.random())
          .slice(0, targetCount);

        let diffInserted = 0;

        for (const problem of selectedProblems) {
          // Check if an Accepted submission already exists
          const existingAccepted = await submissionsColl.findOne({
            user: userDoc._id,
            problem: problem._id,
            result: "Accepted",
          });

          if (existingAccepted) {
            continue;
          }

          const lang = LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
          const sampleCodes =
            lang === "javascript"
              ? SAMPLE_JS_SOLUTIONS
              : lang === "cpp"
              ? SAMPLE_CPP_SOLUTIONS
              : SAMPLE_PYTHON_SOLUTIONS;
          const codeSnippet = sampleCodes[Math.floor(Math.random() * sampleCodes.length)];

          const totalTests = 3;
          const daysAgo = Math.floor(Math.random() * 20) + 1;
          const submissionDate = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);

          // Occasionally add a "Wrong Answer" attempt prior to Accepted
          if (Math.random() < 0.35) {
            const failDate = new Date(submissionDate.getTime() - 15 * 60 * 1000);
            await submissionsColl.insertOne({
              user: userDoc._id,
              problem: problem._id,
              code: codeSnippet + "\n# preliminary attempt",
              language: lang,
              result: Math.random() < 0.2 ? "Time Limit Exceeded" : "Wrong Answer",
              passedCount: Math.floor(Math.random() * (totalTests - 1)),
              totalCount: totalTests,
              plagiarism: 0,
              details: [
                { index: 1, status: "Passed", visible: true },
                { index: 2, status: "Failed", visible: true },
                { index: 3, status: "Failed", visible: false },
              ],
              createdAt: failDate,
              updatedAt: failDate,
            });
            totalSubmissionsInserted++;
          }

          // Insert the "Accepted" submission
          await submissionsColl.insertOne({
            user: userDoc._id,
            problem: problem._id,
            code: codeSnippet,
            language: lang,
            result: "Accepted",
            passedCount: totalTests,
            totalCount: totalTests,
            plagiarism: Math.random() < 0.1 ? Math.floor(Math.random() * 10) : 0,
            details: [
              { index: 1, status: "Passed", visible: true },
              { index: 2, status: "Passed", visible: true },
              { index: 3, status: "Passed", visible: true },
            ],
            createdAt: submissionDate,
            updatedAt: submissionDate,
          });

          diffInserted++;
          totalSubmissionsInserted++;
        }

        console.log(`    + [${diff.toUpperCase()}]: Inserted ${diffInserted} accepted submissions.`);
      }
    }

    const totalInDb = await submissionsColl.countDocuments({});
    console.log(`\n✓ ${label} Complete! Total new submissions inserted: ${totalSubmissionsInserted}. Total in DB: ${totalInDb}`);
  } catch (err) {
    console.error(`Error in ${label}:`, err);
  } finally {
    await conn.close();
  }
}

async function main() {
  console.log("Starting Coding Submissions Seeding across difficulties (Basic, Easy, Medium, Hard)...");
  await seedSubmissionsForUri(ATLAS_URI, "MongoDB Atlas Cloud");
  try {
    await seedSubmissionsForUri(LOCAL_URI, "Localhost MongoDB");
  } catch (err) {
    console.log("Localhost MongoDB unreachable or skipped.");
  }
  console.log("\nAll coding submissions seeded successfully!");
  process.exit(0);
}

main();
