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

export const updateCourseProgress = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { subtopicId, completed = true, totalSubtopics } = req.body;
    if (!subtopicId || !Number.isFinite(Number(totalSubtopics)) || Number(totalSubtopics) < 1) {
      return res.status(400).json({ error: "subtopicId and totalSubtopics are required" });
    }

    const enrollment = await Enrollment.findOne({ _id: req.params.enrollmentId, user: userId });
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    const completedIds = new Set((enrollment.completedSubtopics || []).map((id) => String(id)));
    if (completed) completedIds.add(String(subtopicId));
    else completedIds.delete(String(subtopicId));
    enrollment.completedSubtopics = [...completedIds];
    enrollment.progress = Math.min(100, Math.round((completedIds.size / Number(totalSubtopics)) * 100));
    enrollment.completedAt = enrollment.progress === 100 ? (enrollment.completedAt || new Date()) : null;
    await enrollment.save();
    res.json(enrollment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
