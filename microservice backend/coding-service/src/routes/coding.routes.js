import express from "express";
import {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
} from "../controllers/codingProblem.controller.js";
import {
  runCode,
  submitCode,
  getSubmissionsByProblem,
  getMySubmissions,
} from "../controllers/codingSubmission.controller.js";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Problem CRUD Routes
router.get("/problems", getAllProblems);
router.get("/problems/:id", getProblemById);
router.post("/problems", protect, requireAdmin, createProblem);
router.put("/problems/:id", protect, requireAdmin, updateProblem);
router.delete("/problems/:id", protect, requireAdmin, deleteProblem);

// Judge Routes - Run (sample tests only, no DB save)
router.post("/problems/:id/run", protect, runCode);

// Judge Routes - Submit (all tests, saves to DB)
router.post("/problems/:id/submit", protect, submitCode);

// Legacy alias
router.post("/submit/:id", protect, submitCode);

// Submission History
router.get("/submissions/my", protect, getMySubmissions);
router.get("/problems/:id/submissions", protect, getSubmissionsByProblem);

export default router;
