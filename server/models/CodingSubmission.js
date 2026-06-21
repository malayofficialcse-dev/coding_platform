import mongoose from "mongoose";

const codingSubmissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: "CodingProblem" },
  code: String,
  language: String,
  result: String,
  passedCount: Number,
  totalCount: Number,
  plagiarism: Number,
  details: [{ 
    input: String,
    expectedOutput: String,
    userOutput: String,
    status: String
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("CodingSubmission", codingSubmissionSchema);