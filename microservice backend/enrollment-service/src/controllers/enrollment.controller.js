import Enrollment from "../models/Enrollment.js";
import mongoose from "mongoose";

// Register minimal Course schema if not registered so populate("course") works
if (!mongoose.models.Course) {
  mongoose.model(
    "Course",
    new mongoose.Schema({
      title: String,
      description: String,
      image: String,
    })
  );
}

export const enrollCourse = async (req, res) => {
  try {
    const { courseId, days } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    const existing = await Enrollment.findOne({ user: userId, course: courseId });
    if (existing) {
      return res.status(400).json({ error: "Already enrolled in this course" });
    }

    const expiresAt = new Date(Date.now() + (days || 90) * 24 * 60 * 60 * 1000);
    const enrollment = new Enrollment({
      user: userId,
      course: courseId,
      expiresAt,
    });

    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const enrollments = await Enrollment.find({ user: userId }).populate("course");
    const valid = enrollments.filter((e) => e.course !== null);
    res.json(valid);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEnrollmentsByUser = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.params.userId }).populate("course");
    res.json(enrollments);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId query parameter is required" });

    const enrollments = await Enrollment.find({ user: userId }).populate("course");
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch enrollments", error: err.message });
  }
};
