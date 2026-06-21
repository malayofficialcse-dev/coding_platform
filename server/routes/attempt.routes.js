import express from "express";
import {
  submitAttempt,
  getMyAttempts,
  getExamAttempts,
} from "../controllers/exam.controller.js";
import { requireAuth } from "../middleware/auth.js";
import {
  getUserAttempts,
  getAttemptsByUser,
} from "../controllers/attempt.controller.js";

const router = express.Router();

router.post("/", requireAuth, submitAttempt); // Submit answers
router.get("/mine", requireAuth, getMyAttempts); // Student’s own attempts
router.get("/exam/:id", requireAuth, getExamAttempts); // Attempts of an exam
router.get("/mine", requireAuth, getUserAttempts);
router.get("/user/:userId", getAttemptsByUser);

export default router;
