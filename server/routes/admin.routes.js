import express from "express";
import { isAdmin } from "../middleware/isAdmin.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createExam,
  updateExam,
  deleteExam,
  getAllExams,
  getExam,
  getAllUsers,
  getAllAdmins,
  getUserAttempts,
  getAllPosts,
  deleteAnyPost,
  updateAnyPost,
  createPostAsAdmin,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(requireAuth, isAdmin);

// Exam routes
router.get("/exams", getAllExams);
router.post("/exams", createExam);
router.get("/exams/:id", getExam);
router.put("/exams/:id", updateExam);
router.delete("/exams/:id", deleteExam);

// User/Admin/Attempt routes
router.get("/users", getAllUsers);
router.get("/admins", getAllAdmins);
router.get("/user/:userId/attempts", getUserAttempts);

// Post control routes
router.get("/posts", getAllPosts);
router.post("/posts", createPostAsAdmin);
router.delete("/posts/:postId", deleteAnyPost);
router.put("/posts/:postId", updateAnyPost);

export default router;
