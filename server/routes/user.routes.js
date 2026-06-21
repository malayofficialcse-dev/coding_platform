import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  followUser,
  unfollowUser,
  getUserById,
  getAllUsers,
} from "../controllers/user.controller.js";

const router = express.Router();

// Place /all BEFORE /:id
router.get("/all", getAllUsers);
router.post("/:id/follow", requireAuth, followUser);
router.post("/:id/unfollow", requireAuth, unfollowUser);
router.get("/:id", getUserById);

export default router;
