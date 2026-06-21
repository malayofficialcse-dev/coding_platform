// ...new file...
import dotenv from "dotenv";
import mongoose from "mongoose";
import CodingProblem from "../models/CodingProblem.js";

dotenv.config();

const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/online-exam";

const sampleProblems = [
  {
    title: "Sum of Two Numbers",
    description: "Read two integers from input and print their sum.",
    difficulty: "easy",
    tags: ["math", "implementation"],
    dsaTopic: "basic",
    testCases: [
      { input: "2 3", output: "5", visible: true },
      { input: "10 20", output: "30", visible: false },
      { input: "-1 1", output: "0", visible: false }
    ],
    solutionCodes: {
      javascript: "const fs=require('fs');const data=fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);console.log(data[0]+data[1]);",
      python3: "print(sum(map(int,input().split())))"
    },
    boilerplateCodes: {
      javascript: "// read input from stdin\n",
      python3: "# read input\n"
    }
  },
  {
    title: "Multiply by Two",
    description: "Given an integer, print its value multiplied by 2.",
    difficulty: "easy",
    tags: ["math"],
    dsaTopic: "basic",
    testCases: [
      { input: "4", output: "8", visible: true },
      { input: "0", output: "0", visible: false }
    ],
    solutionCodes: {
      javascript: "const fs=require('fs');const n=Number(fs.readFileSync(0,'utf8').trim());console.log(n*2);",
      python3: "n=int(input().strip());print(n*2)"
    },
    boilerplateCodes: {}
  }
];

async function seed() {
  await mongoose.connect(MONGO, { });
  console.log("Connected to DB for seeding");
  await CodingProblem.deleteMany({});
  const created = await CodingProblem.insertMany(sampleProblems.map(p => ({ ...p })));
  console.log("Seeded problems:", created.map(c => ({ id: c._id, title: c.title })));
  await mongoose.disconnect();
  console.log("Disconnected");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});