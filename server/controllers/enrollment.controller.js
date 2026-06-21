import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";

// Enroll in a course
export const enrollCourse = async (req, res) => {
  try {
    const { courseId, days } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const expiresAt = new Date(Date.now() + (days || 90) * 24 * 60 * 60 * 1000);
    const existing = await Enrollment.findOne({
      user: req.user.id,
      course: courseId,
    });
    if (existing) return res.status(400).json({ error: "Already enrolled" });

    const enrollment = new Enrollment({
      user: req.user.id,
      course: courseId,
      expiresAt,
    });
    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get user's enrollments
export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id }).populate(
      "course"
    );
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEnrollmentsByUser = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      user: req.params.userId,
    }).populate("course");
    res.json(enrollments);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const enrollments = await Enrollment.find({ user: userId }).populate(
      "course"
    );
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
};
