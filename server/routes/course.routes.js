import express from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  deleteCourse,
  updateCourse,
  getCoursesByUser,
  addTopicToCourse,
  updateTopicInCourse,
  deleteTopicFromCourse,
  addSubtopicToTopic,
  updateSubtopicInTopic,
  deleteSubtopicFromTopic,
} from "../controllers/course.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { uploadCourseImage } from "../config/multer.js";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  isAdmin,
  uploadCourseImage.single("image"),
  createCourse
);

router.get("/", getAllCourses);
router.get("/:id", getCourseById);

router.delete("/:id", requireAuth, isAdmin, deleteCourse);

// FIX: Use multer for course image update
router.put(
  "/:id",
  requireAuth,
  isAdmin,
  uploadCourseImage.single("image"),
  updateCourse
);

// Topic routes
router.post(
  "/:id/topics",
  requireAuth,
  isAdmin,
  addTopicToCourse
);
router.put(
  "/:id/topics/:topicId",
  requireAuth,
  isAdmin,
  updateTopicInCourse
);
router.delete(
  "/:id/topics/:topicId",
  requireAuth,
  isAdmin,
  deleteTopicFromCourse
);

// Subtopic routes
router.post(
  "/:id/topics/:topicId/subtopics",
  requireAuth,
  isAdmin,
  uploadCourseImage.array("images", 10),
  addSubtopicToTopic
);
router.put(
  "/:id/topics/:topicId/subtopics/:subtopicId",
  requireAuth,
  isAdmin,
  uploadCourseImage.array("images", 10),
  updateSubtopicInTopic
);
router.delete(
  "/:id/topics/:topicId/subtopics/:subtopicId",
  requireAuth,
  isAdmin,
  deleteSubtopicFromTopic
);

router.get("/user/:id", getCoursesByUser);

export default router;

