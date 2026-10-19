import express from "express";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getMutualFollows,
  getMutualConnections,
  getRecommendations,
  getConnectionTrail,
  getUserNetworkStats,
} from "../controllers/social.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/:id/follow", protect, followUser);
router.delete("/:id/follow", protect, unfollowUser);
router.get("/:id/followers", protect, getFollowers);
router.get("/:id/following", protect, getFollowing);
router.get("/:id/mutual-follows", protect, getMutualFollows);
router.get("/:id/mutual", protect, getMutualConnections);
router.get("/trail/:id", protect, getConnectionTrail);
router.get("/stats/:id", protect, getUserNetworkStats);
router.get("/recommendations", protect, getRecommendations);

export default router;
