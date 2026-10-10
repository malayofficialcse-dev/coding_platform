import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import { register, login, me, changePassword, updateProfileImage, updateBannerImage, verifyToken } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env"),
});
dotenv.config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "code-campus/profiles",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 400, height: 400, crop: "limit", quality: "auto", fetch_format: "auto" }],
  },
});

const upload = multer({ storage });

router.post("/register", register);
router.post("/login", login);
router.put("/password", protect, changePassword);
router.get("/me", protect, me);
router.post("/profile-image", protect, upload.single("profileImage"), updateProfileImage);
router.post("/banner-image", protect, upload.single("bannerImage"), updateBannerImage);
router.post("/update-profile-image", protect, upload.single("image"), updateProfileImage);
router.get("/verify", verifyToken);

export default router;

