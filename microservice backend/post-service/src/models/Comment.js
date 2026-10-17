import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    // author stored as String (UUID) because user-service uses PostgreSQL with UUID PKs
    author: { type: String, ref: "User", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Comment || mongoose.model("Comment", commentSchema);
