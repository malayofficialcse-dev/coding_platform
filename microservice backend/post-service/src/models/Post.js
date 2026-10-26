import mongoose from "mongoose";
import "./User.js";

const codeBlockSchema = new mongoose.Schema({
  language: { type: String, default: "javascript" },
  code: { type: String, default: "" },
});

const pollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: [{ type: String }],
});

const pollSchema = new mongoose.Schema({
  question: { type: String, default: "" },
  options: [pollOptionSchema],
  closed: { type: Boolean, default: false },
});

const reactionSchema = new mongoose.Schema({
  user: { type: String, required: true },
  type: {
    type: String,
    enum: ["like", "fire", "insight", "rocket", "clap"],
    default: "like",
  },
});

const postSchema = new mongoose.Schema(
  {
    // author is stored as a String (UUID) because user-service uses PostgreSQL with UUID PKs
    author: { type: String, ref: "User", required: true },
    group: { type: String, default: "General Feed" },
    text: { type: String, default: "" },
    codeBlocks: [codeBlockSchema],
    images: [{ type: String }],
    // likes also stored as String[] (UUIDs)
    likes: [{ type: String, ref: "User" }],
    reactions: [reactionSchema],
    poll: pollSchema,
    tags: [{ type: String }],
    postType: {
      type: String,
      enum: ["text", "code", "poll", "question", "announcement"],
      default: "text",
    },
    bookmarks: [{ type: String }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    repostedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  },
  { timestamps: true }
);

// Feed, group, profile, and repost lookups all sort by newest first.
postSchema.index({ createdAt: -1 });
postSchema.index({ group: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ postType: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ bookmarks: 1 });
postSchema.index({ repostedFrom: 1 });

export default mongoose.models.Post || mongoose.model("Post", postSchema);

