import express from "express";
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
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

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
  },
});

const upload = multer({ storage });

// Dashboard & Analytics (Admin / Post Controller)
router.get("/dashboard/metrics", protect, requireAdmin, getPostDashboardMetrics);
router.get("/admin/all", protect, requireAdmin, getAllPostsAdmin);
router.post("/admin/create", protect, requireAdmin, createPostAsAdmin);
router.delete("/admin/:postId", protect, requireAdmin, deleteAnyPost);
router.put("/admin/:postId", protect, requireAdmin, updateAnyPost);

// Core Post Operations
router.get("/feed", protect, getFeed);
router.get("/user/:id", getPostsByUser);
router.get("/by-user/:id", getPostsByUser);
router.get("/", getAllPosts);
router.post("/", protect, upload.array("images", 5), createPost);
router.put("/:id", protect, upload.array("images", 5), updatePost);
router.delete("/:id", protect, deletePost);

// Post Engagements
router.post("/like/:id", protect, likePost);
router.post("/unlike/:id", protect, unlikePost);
router.post("/repost/:id", protect, repost);
router.delete("/repost/:id", protect, undoRepost);

// Nested Comments
router.get("/:postId/comments", getCommentsByPost);
router.post("/:postId/comments", protect, addComment);
router.post("/comment/:postId", protect, addComment); // Support alternate route shape
router.delete("/:postId/comments/:commentId", protect, deleteComment);
router.delete("/comment/:postId/:commentId", protect, deleteComment);

export default router;

