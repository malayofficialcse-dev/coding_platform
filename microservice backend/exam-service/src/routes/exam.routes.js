import express from "express";
import {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamAnalytics,
} from "../controllers/exam.controller.js";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllExams);
router.get("/:id", getExamById);
router.get("/:examId/analytics", getExamAnalytics);

router.post("/", protect, requireAdmin, createExam);
router.put("/:id", protect, requireAdmin, updateExam);
router.delete("/:id", protect, requireAdmin, deleteExam);

export default router;

