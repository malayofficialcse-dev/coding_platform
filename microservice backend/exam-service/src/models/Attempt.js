import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [{ type: String }],
    score: { type: Number, required: true },
    warningsCount: { type: Number, default: 0 },
    autoSubmitted: { type: Boolean, default: false },
    cheatingLogged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Attempt || mongoose.model("Attempt", attemptSchema);
