import express from "express";
import {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamAnalytics,
  getOverallExamAnalytics,
} from "../controllers/exam.controller.js";
import { protect, requireAdmin, requirePermission, optionalAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/overview/analytics", getOverallExamAnalytics);
router.get("/", optionalAuth, getAllExams);
router.get("/:id", optionalAuth, getExamById);
router.get("/:examId/analytics", getExamAnalytics);

router.post("/", protect, requirePermission("exams", "create"), createExam);
router.put("/:id", protect, requirePermission("exams", "edit"), updateExam);
router.delete("/:id", protect, requirePermission("exams", "delete"), deleteExam);

export default router;

