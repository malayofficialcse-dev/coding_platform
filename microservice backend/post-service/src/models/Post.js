import mongoose from "mongoose";
import "./User.js";

const codeBlockSchema = new mongoose.Schema({
  language: { type: String, default: "javascript" },
  code: { type: String, default: "" },
});

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: String, default: "General Feed" },
    text: { type: String, default: "" },
    codeBlocks: [codeBlockSchema],
    images: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    repostedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  },
  { timestamps: true }
);

// Feed, group, profile, and repost lookups all sort by newest first.
postSchema.index({ createdAt: -1 });
postSchema.index({ group: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ repostedFrom: 1 });

export default mongoose.models.Post || mongoose.model("Post", postSchema);
