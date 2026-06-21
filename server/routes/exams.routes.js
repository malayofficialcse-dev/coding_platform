import express from "express";
import {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  getExamAnalytics,
} from "../controllers/exam.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { getExamsByUser } from "../controllers/exam.controller.js";

const router = express.Router();

// Get all exams
router.get("/", requireAuth, getAllExams);

// Get exam by ID
router.get("/:id", requireAuth, getExamById);

// Create exam (admin only)
router.post("/", requireAuth, isAdmin, createExam);

// Update exam (admin only)
router.put("/:id", requireAuth, isAdmin, updateExam);

// Delete exam (admin only)
router.delete("/:id", requireAuth, isAdmin, deleteExam);

router.get("/:examId/analytics", getExamAnalytics);

router.get("/user/:id", getExamsByUser);

export default router;
