import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema({
  input: String,
  output: String,
  visible: { type: Boolean, default: false },
});

const codingProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    tags: [String],
    dsaTopic: String,
    testCases: [testCaseSchema], // ✅ Added test cases
    solutionCodes: {
      type: Map,
      of: String,
      default: {},
    },
    boilerplateCodes: {
      type: Map,
      of: String,
      default: {},
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("CodingProblem", codingProblemSchema);
