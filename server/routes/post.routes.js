import express from "express";
import { requireAuth } from "../middleware/auth.js";
// import uploadCourseImage earlier — now import both
import { upload, uploadCourseImage } from "../config/multer.js";
import {
  createPost,
  getFeed,
  likePost,
  unlikePost,
  repost,
  getAllPosts,
  getPostsByUser,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import { addComment } from "../controllers/comment.controller.js";

const router = express.Router();

// IMPORTANT: Place specific routes BEFORE generic :id routes
router.get("/feed", requireAuth, getFeed);
router.get("/all", getAllPosts);
router.get("/user/:id", getPostsByUser);

// Generic routes with :id come LAST
// Use 'upload' (Cloudinary storage for posts). limit to 5 images.
router.post("/", requireAuth, upload.array("images", 5), createPost);

router.post("/:id/like", requireAuth, likePost);
router.post("/:id/unlike", requireAuth, unlikePost);
router.post("/:id/repost", requireAuth, repost);
router.post("/:postId/comment", requireAuth, addComment);
router.put(
  "/:id",
  requireAuth,
  uploadCourseImage.array("images", 5),
  updatePost
);
router.delete("/:id", requireAuth, deletePost);

export default router;
