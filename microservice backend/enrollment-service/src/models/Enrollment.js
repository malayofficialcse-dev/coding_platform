import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    enrolledAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    completedSubtopics: [{ type: mongoose.Schema.Types.ObjectId }],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);
