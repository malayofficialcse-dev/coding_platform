import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  visible: { type: Boolean, default: true },
});

const codingProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
    dsaTopic: { type: String, default: "General" },
    sampleTestCases: [testCaseSchema],
    testCases: [testCaseSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.CodingProblem || mongoose.model("CodingProblem", codingProblemSchema);
