import express from "express";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getMutualConnections,
  getRecommendations,
} from "../controllers/social.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/:id/follow", protect, followUser);
router.delete("/:id/follow", protect, unfollowUser);
router.get("/:id/followers", protect, getFollowers);
router.get("/:id/following", protect, getFollowing);
router.get("/:id/mutual", protect, getMutualConnections);
router.get("/recommendations", protect, getRecommendations);

export default router;
