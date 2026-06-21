import express from "express";
import { requireAuth } from "../middleware/auth.js";
import * as codingProblem from "../controllers/codingProblem.controller.js";
import * as codingSubmission from "../controllers/codingSubmission.controller.js";
import { isAdmin } from "../middleware/isAdmin.js";
import CodingSubmission from "../models/CodingSubmission.js";

const router = express.Router();

router.get("/problems", codingProblem.getAllProblems);
router.get("/problems/:id", codingProblem.getProblemById);
router.post("/problems", requireAuth, isAdmin, codingProblem.createProblem);
router.put("/problems/:id", requireAuth, isAdmin, codingProblem.updateProblem);
router.delete("/problems/:id", requireAuth, isAdmin, codingProblem.deleteProblem); // <- added

// Add this route for user submissions analytics
router.get("/submissions/me", requireAuth, async (req, res) => {
  try {
    const submissions = await CodingSubmission.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

router.post("/problems/:id/submit", requireAuth, codingSubmission.submitCode);

export default router;