import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
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
import { protect, requireAdmin, requirePermission, optionalAuth } from "../middleware/auth.middleware.js";


// This module is evaluated before the service entrypoint, so load env values
// before configuring the Cloudinary client below.
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env"),
});
dotenv.config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "code-campus/posts",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }],
  },
});

const upload = multer({ storage });

// Dashboard & Analytics (Admin / Post Controller)
router.get("/dashboard/metrics", protect, requirePermission("feed", "view"), getPostDashboardMetrics);
router.get("/admin/all", protect, requirePermission("feed", "view"), getAllPostsAdmin);
router.post("/admin/create", protect, requirePermission("feed", "create"), createPostAsAdmin);
router.delete("/admin/:postId", protect, requirePermission("feed", "delete"), deleteAnyPost);
router.put("/admin/:postId", protect, requirePermission("feed", "edit"), updateAnyPost);

// Core Post Operations
router.get("/feed", protect, getFeed);
router.get("/bookmarks", protect, getBookmarkedPosts);
router.get("/user/:id", getPostsByUser);
router.get("/by-user/:id", getPostsByUser);
router.get("/", optionalAuth, getAllPosts);
router.post("/", protect, upload.array("images", 5), createPost);
router.put("/:id", protect, upload.array("images", 5), updatePost);
router.delete("/:id", protect, deletePost);

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


