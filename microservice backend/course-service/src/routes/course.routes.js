import express from "express";
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
} from "../controllers/course.controller.js";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "code-campus/courses",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage });

router.get("/", getAllCourses);
router.get("/:id", getCourseById);
router.post("/", protect, requireAdmin, upload.single("image"), createCourse);
router.put("/:id", protect, requireAdmin, upload.single("image"), updateCourse);
router.delete("/:id", protect, requireAdmin, deleteCourse);

// Topics & Subtopics
router.post("/:id/topics", protect, requireAdmin, addTopicToCourse);
router.put("/:id/topics/:topicId", protect, requireAdmin, updateTopicInCourse);
router.delete("/:id/topics/:topicId", protect, requireAdmin, deleteTopicFromCourse);
router.post("/:id/topics/:topicId/subtopics", protect, requireAdmin, addSubtopicToTopic);

export default router;

