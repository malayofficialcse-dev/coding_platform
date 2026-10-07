import express from "express";
import {
  submitAttempt,
  getMyAttempts,
  getExamAttempts,
  getUserAttempts,
} from "../controllers/attempt.controller.js";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, submitAttempt);
router.get("/my", protect, getMyAttempts);
router.get("/exam/:id", protect, requireAdmin, getExamAttempts);
router.get("/user/:userId", protect, requireAdmin, getUserAttempts);

export default router;

