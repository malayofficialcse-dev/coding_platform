import express from "express";
import {
  register,
  login,
  me,
  updateProfileImage,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadProfile } from "../config/multer.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

// Only keep this route for profile image update
router.put(
  "/profile/image",
  requireAuth,
  uploadProfile.single("profileImage"),
  updateProfileImage
);

export default router;


