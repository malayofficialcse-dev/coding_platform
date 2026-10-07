import express from "express";
import {
  getAllUsers,
  getUserById,
  searchUsers,
  followUser,
  unfollowUser,
  updateProfile,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/search", searchUsers);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/follow/:id", protect, followUser);
router.post("/unfollow/:id", protect, unfollowUser);
router.put("/profile", protect, updateProfile);

export default router;

