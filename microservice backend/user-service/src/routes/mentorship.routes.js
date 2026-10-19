import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getMyMentorshipProfile,
  saveMyMentorshipProfile,
  getMentorMatches,
  getMentorshipRequests,
  createMentorshipRequest,
  updateMentorshipRequest,
  getMentorshipContacts,
} from "../controllers/mentorship.controller.js";

const router = express.Router();
router.use(protect);
router.get("/profile", getMyMentorshipProfile);
router.put("/profile", saveMyMentorshipProfile);
router.get("/matches", getMentorMatches);
router.get("/requests", getMentorshipRequests);
router.post("/requests", createMentorshipRequest);
router.patch("/requests/:id", updateMentorshipRequest);
router.get("/contacts/:id", getMentorshipContacts);

export default router;
