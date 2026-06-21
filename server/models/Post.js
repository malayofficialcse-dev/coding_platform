import mongoose from "mongoose";

const codeBlockSchema = new mongoose.Schema({
  language: String,
  code: String,
});

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: String,
  images: [String],
  codeBlocks: [codeBlockSchema],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  repostedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Post", postSchema);
