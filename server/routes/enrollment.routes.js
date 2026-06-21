import express from "express";
import {
  enrollCourse,
  getMyEnrollments,
  getEnrollmentsByUser,
  getUserEnrollments,
} from "../controllers/enrollment.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, enrollCourse); // Enroll in a course
router.get("/mine", requireAuth, getMyEnrollments); // Get my enrollments
router.get("/user/:userId", getEnrollmentsByUser);
router.get("/", requireAuth, getUserEnrollments);

export default router;
