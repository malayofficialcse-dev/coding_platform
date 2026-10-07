import mongoose from "mongoose";

const testResultSchema = new mongoose.Schema({
  index: Number,
  input: String,
  expectedOutput: String,
  userOutput: String,
  status: { type: String, enum: ["Passed", "Failed", "Error"] },
  visible: Boolean,
});

const codingSubmissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "CodingProblem", required: true },
    code: { type: String, required: true },
    language: { type: String, required: true },
    result: { type: String, enum: ["Accepted", "Wrong Answer", "Runtime Error", "Time Limit Exceeded"], default: "Wrong Answer" },
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    plagiarism: { type: Number, default: 0 },
    details: [testResultSchema],
  },
  { timestamps: true }
);

export default mongoose.models.CodingSubmission || mongoose.model("CodingSubmission", codingSubmissionSchema);
