import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: [{ type: String, required: true }], // <-- change Number to String
  score: { type: Number, required: true },
  warningsCount: { type: Number, default: 0 },
  autoSubmitted: { type: Boolean, default: false },
  cheatingLogged: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Attempt", attemptSchema);
