import express from "express";
import dotenv from "dotenv";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import multer from "multer";
import {
  createPost,
  getFeed,
  getAllPosts,
  getPostsByUser,
  likePost,
  unlikePost,
  repost,
  undoRepost,
  updatePost,
  deletePost,
  reactToPost,
  votePoll,
  bookmarkPost,
  getBookmarkedPosts,
  executeSnippet,
  streamNeonVideo,
} from "../controllers/post.controller.js";
import {
  addComment,
  deleteComment,
  getCommentsByPost,
} from "../controllers/comment.controller.js";
import {
  getAllPostsAdmin,
  deleteAnyPost,
  updateAnyPost,
  createPostAsAdmin,
  getPostDashboardMetrics,
} from "../controllers/dashboard.controller.js";
import { protect, requireAdmin, optionalAuth } from "../middleware/auth.middleware.js";


// This module is evaluated before the service entrypoint, so load env values
// before configuring the Cloudinary client below.
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env"),
});
dotenv.config();

const router = express.Router();

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
});

const uploadPostMedia = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "video", maxCount: 1 },
]);

// Dashboard & Analytics (Admin / Post Controller)
router.get("/dashboard/metrics", protect, requireAdmin, getPostDashboardMetrics);
router.get("/admin/all", protect, requireAdmin, getAllPostsAdmin);
router.post("/admin/create", protect, requireAdmin, createPostAsAdmin);
router.delete("/admin/:postId", protect, requireAdmin, deleteAnyPost);
router.put("/admin/:postId", protect, requireAdmin, updateAnyPost);

// Core Post Operations
router.get("/feed", protect, getFeed);
router.get("/bookmarks", protect, getBookmarkedPosts);
router.get("/user/:id", getPostsByUser);
router.get("/by-user/:id", getPostsByUser);
router.get("/", optionalAuth, getAllPosts);
router.post("/", protect, uploadPostMedia, createPost);
router.put("/:id", protect, uploadPostMedia, updatePost);
router.delete("/:id", protect, deletePost);

// Video Streaming & Fresh URL resolver from Neon Object Storage
router.get("/video/:key(*)", streamNeonVideo);

// Snippet Runner
router.post("/execute-snippet", executeSnippet);

// Post Engagements & Reactions
router.post("/like/:id", protect, likePost);
router.post("/unlike/:id", protect, unlikePost);
router.post("/react/:id", protect, reactToPost);
router.post("/poll/:id/vote", protect, votePoll);
router.post("/bookmark/:id", protect, bookmarkPost);
router.post("/repost/:id", protect, repost);
router.delete("/repost/:id", protect, undoRepost);

// Nested Comments
router.get("/:postId/comments", getCommentsByPost);
router.post("/:postId/comments", protect, addComment);
router.post("/comment/:postId", protect, addComment); // Support alternate route shape
router.delete("/:postId/comments/:commentId", protect, deleteComment);
router.delete("/comment/:postId/:commentId", protect, deleteComment);

export default router;
