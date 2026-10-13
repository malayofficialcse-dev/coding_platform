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
import { protect, requireAdmin, optionalAuth, requirePermission } from "../middleware/auth.middleware.js";

const router = express.Router();

// Problem CRUD Routes
router.get("/problems", getAllProblems);
router.get("/problems/:id", getProblemById);
router.post("/problems", protect, requirePermission("coding", "create"), createProblem);
router.put("/problems/:id", protect, requirePermission("coding", "edit"), updateProblem);
router.delete("/problems/:id", protect, requirePermission("coding", "delete"), deleteProblem);

// Judge Routes - Run (sample tests only, no DB save)
router.post("/problems/:id/run", optionalAuth, runCode);

// Judge Routes - Submit (all tests, saves to DB)
router.post("/problems/:id/submit", optionalAuth, submitCode);

// Legacy alias
router.post("/submit/:id", protect, submitCode);

// Submission History
router.get("/submissions/my", protect, getMySubmissions);
router.get("/problems/:id/submissions", protect, getSubmissionsByProblem);

export default router;
