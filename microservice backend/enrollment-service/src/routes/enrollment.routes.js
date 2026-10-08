import express from "express";
import {
  enrollCourse,
  getMyEnrollments,
  getEnrollmentsByUser,
  getUserEnrollments,
  updateCourseProgress,
} from "../controllers/enrollment.controller.js";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/enroll", protect, enrollCourse);
router.post("/", protect, enrollCourse);
router.get("/my", protect, getMyEnrollments);
router.get("/user/:userId", protect, requireAdmin, getEnrollmentsByUser);
router.get("/", protect, getUserEnrollments);
router.patch("/:enrollmentId/progress", protect, updateCourseProgress);

export default router;

