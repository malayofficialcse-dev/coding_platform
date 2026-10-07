import express from "express";
import {
  enrollCourse,
  getMyEnrollments,
  getEnrollmentsByUser,
  getUserEnrollments,
} from "../controllers/enrollment.controller.js";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/enroll", protect, enrollCourse);
router.post("/", protect, enrollCourse);
router.get("/my", protect, getMyEnrollments);
router.get("/user/:userId", protect, requireAdmin, getEnrollmentsByUser);
router.get("/", protect, getUserEnrollments);

export default router;

