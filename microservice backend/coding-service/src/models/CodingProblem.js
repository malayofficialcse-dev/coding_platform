import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: "" },
  output: { type: String, default: "" },
  visible: { type: Boolean, default: true },
});

const codingProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    difficulty: { type: String, default: "Easy" },
    dsaTopic: { type: String, default: "General" },
    tags: [{ type: String }],
    sampleTestCases: [testCaseSchema],
    testCases: [testCaseSchema],
    boilerplateCodes: { type: mongoose.Schema.Types.Mixed, default: {} },
    solutionCodes: { type: mongoose.Schema.Types.Mixed, default: {} },
    editorial: { type: String, default: "" },
    hints: [{ type: String }],
    constraints: { type: String, default: "" },
    timeLimit: { type: String, default: "2.0s" },
    memoryLimit: { type: String, default: "256 MB" },
    acceptanceRate: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.CodingProblem || mongoose.model("CodingProblem", codingProblemSchema);
