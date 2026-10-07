import express from "express";
import {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
} from "../controllers/codingProblem.controller.js";
import {
  submitCode,
  getSubmissionsByProblem,
  getMySubmissions,
} from "../controllers/codingSubmission.controller.js";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Problem Routes
router.get("/problems", getAllProblems);
router.get("/problems/:id", getProblemById);
router.post("/problems", protect, requireAdmin, createProblem);
router.put("/problems/:id", protect, requireAdmin, updateProblem);
router.delete("/problems/:id", protect, requireAdmin, deleteProblem);

// Submission & Grading Routes
router.post("/submit/:id", protect, submitCode);
router.post("/problems/:id/submit", protect, submitCode);
router.get("/submissions/my", protect, getMySubmissions);
router.get("/problems/:id/submissions", protect, getSubmissionsByProblem);

export default router;

