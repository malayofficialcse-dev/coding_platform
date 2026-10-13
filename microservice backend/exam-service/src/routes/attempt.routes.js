import express from "express";
import {
  submitAttempt,
  getMyAttempts,
  getExamAttempts,
  getUserAttempts,
  getAttemptById,
} from "../controllers/attempt.controller.js";
import { protect, requireAdmin, requirePermission } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, submitAttempt);
router.get("/my", protect, getMyAttempts);
router.get("/exam/:id", protect, requirePermission("exams", "view"), getExamAttempts);
router.get("/user/:userId", protect, requirePermission("exams", "view"), getUserAttempts);
router.get("/:id", protect, getAttemptById);

export default router;

