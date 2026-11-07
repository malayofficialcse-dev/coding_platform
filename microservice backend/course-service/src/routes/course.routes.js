import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addTopicToCourse,
  updateTopicInCourse,
  deleteTopicFromCourse,
  addSubtopicToTopic,
  updateSubtopicInTopic,
  deleteSubtopicFromTopic,
} from "../controllers/course.controller.js";
import { protect, requireAdmin, requirePermission } from "../middleware/auth.middleware.js";

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
  params: (req, file) =>
    file.fieldname === "video"
      ? {
          folder: "code-campus/course-videos",
          resource_type: "video",
          allowed_formats: ["mp4", "mov", "avi", "mkv", "webm", "m4v"],
        }
      : {
          folder: "code-campus/courses",
          allowed_formats: ["jpg", "png", "jpeg", "webp"],
          transformation: [{ width: 1200, crop: "limit", quality: "auto", fetch_format: "auto" }],
        },
});

const upload = multer({ storage });

router.get("/", getAllCourses);
router.get("/:id", getCourseById);
router.post("/", protect, requirePermission("courses", "create"), upload.single("image"), createCourse);
router.put("/:id", protect, requirePermission("courses", "edit"), upload.single("image"), updateCourse);
router.delete("/:id", protect, requirePermission("courses", "delete"), deleteCourse);

// Topics & Subtopics
router.post("/:id/topics", protect, requirePermission("courses", "edit"), addTopicToCourse);
router.put("/:id/topics/:topicId", protect, requirePermission("courses", "edit"), updateTopicInCourse);
router.delete("/:id/topics/:topicId", protect, requirePermission("courses", "delete"), deleteTopicFromCourse);
const uploadSubtopicMedia = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "video", maxCount: 1 },
]);

router.post("/:id/topics/:topicId/subtopics", protect, requirePermission("courses", "edit"), uploadSubtopicMedia, addSubtopicToTopic);
router.put("/:id/topics/:topicId/subtopics/:subtopicId", protect, requirePermission("courses", "edit"), uploadSubtopicMedia, updateSubtopicInTopic);
router.delete("/:id/topics/:topicId/subtopics/:subtopicId", protect, requirePermission("courses", "delete"), deleteSubtopicFromTopic);

export default router;
