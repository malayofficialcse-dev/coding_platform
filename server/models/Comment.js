import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  text: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Comment", commentSchema);
