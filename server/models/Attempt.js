import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: [{ type: String, required: true }], // <-- change Number to String
  score: { type: Number, required: true },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Attempt", attemptSchema);
