import express from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  addContentToCourse,
  deleteCourse,
  updateCourse,
  updateCourseContent,
} from "../controllers/course.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { uploadCourseImage } from "../config/multer.js";
import { getCoursesByUser } from "../controllers/course.controller.js";

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

router.post(
  "/:id/content",
  requireAuth,
  isAdmin,
  uploadCourseImage.array("images", 10),
  addContentToCourse
);

router.delete("/:id", requireAuth, isAdmin, deleteCourse);

// FIX: Use multer for course image update
router.put(
  "/:id",
  requireAuth,
  isAdmin,
  uploadCourseImage.single("image"),
  updateCourse
);

router.put(
  "/:id/content/:contentId",
  requireAuth,
  isAdmin,
  uploadCourseImage.array("images", 10),
  updateCourseContent
);

router.get("/user/:id", getCoursesByUser);

export default router;
