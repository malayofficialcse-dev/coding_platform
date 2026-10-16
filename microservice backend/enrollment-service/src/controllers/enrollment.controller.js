import Enrollment from "../models/Enrollment.js";
import { Op } from "sequelize";

/**
 * Ensures course details are formatted properly for frontend
 */
function attachCourseDetails(enrollmentList) {
  const list = Array.isArray(enrollmentList) ? enrollmentList : [enrollmentList];
  return list.map((en) => {
    const enObj = typeof en.toObject === "function" ? en.toObject() : { ...en };
    if (!enObj.course || typeof enObj.course !== "object" || !enObj.course.title) {
      const courseId = String(enObj.course?._id || enObj.course || "");
      enObj.course = { _id: courseId, id: courseId, title: "Course" };
    }
    return enObj;
  });
}

export const enrollCourse = async (req, res) => {
  try {
    const { courseId, days } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }
    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const accessDays = Math.max(1, Number(days) || 90);
    const userIdStr = String(userId);
    const courseIdStr = String(courseId);

    let existing = await Enrollment.findOne({
      where: {
        user: userIdStr,
        course: courseIdStr,
      },
    });

    if (existing) {
      const isExpired = !existing.expiresAt || new Date(existing.expiresAt) < new Date();
      const baseTime = isExpired ? Date.now() : new Date(existing.expiresAt).getTime();
      const newExpiresAt = new Date(baseTime + accessDays * 24 * 60 * 60 * 1000);

      existing.expiresAt = newExpiresAt;
      existing.enrolledAt = existing.enrolledAt || new Date();
      await existing.save();

      const [finalEnr] = attachCourseDetails([existing]);
      return res.status(200).json({
        message: isExpired ? "Enrollment renewed successfully" : "Course access extended successfully",
        enrollment: finalEnr,
        ...finalEnr,
      });
    }

    const newExpiresAt = new Date(Date.now() + accessDays * 24 * 60 * 60 * 1000);
    const enrollment = await Enrollment.create({
      user: userIdStr,
      course: courseIdStr,
      expiresAt: newExpiresAt,
      enrolledAt: new Date(),
    });

    const [finalEnr] = attachCourseDetails([enrollment]);
    res.status(201).json({
      message: "Enrolled successfully",
      enrollment: finalEnr,
      ...finalEnr,
    });
  } catch (err) {
    console.error("[enrollCourse Error]:", err);
    res.status(400).json({ error: err.message || "Enrollment failed" });
  }
};

export const getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const enrollments = await Enrollment.findAll({
      where: { user: String(userId) },
      order: [["createdAt", "DESC"]],
    });

    res.json(attachCourseDetails(enrollments));
  } catch (err) {
    console.error("[getMyEnrollments Error]:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getEnrollmentsByUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const enrollments = await Enrollment.findAll({
      where: { user: String(targetUserId) },
      order: [["createdAt", "DESC"]],
    });

    res.json(attachCourseDetails(enrollments));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId query parameter is required" });

    const enrollments = await Enrollment.findAll({
      where: { user: String(userId) },
      order: [["createdAt", "DESC"]],
    });

    res.json(attachCourseDetails(enrollments));
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

    const enrollment = await Enrollment.findOne({
      where: {
        id: req.params.enrollmentId,
        user: String(userId),
      },
    });

    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    const completedIds = new Set((enrollment.completedSubtopics || []).map((id) => String(id)));
    if (completed) completedIds.add(String(subtopicId));
    else completedIds.delete(String(subtopicId));

    enrollment.completedSubtopics = [...completedIds];
    enrollment.progress = Math.min(100, Math.round((completedIds.size / Number(totalSubtopics)) * 100));
    enrollment.completedAt = enrollment.progress === 100 ? enrollment.completedAt || new Date() : null;
    await enrollment.save();

    res.json(enrollment.toObject());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const generateCertificate = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { enrollmentId } = req.params;
    const isAdmin = ["admin", "super_admin"].includes(req.user?.role);

    const where = { id: enrollmentId };
    if (!isAdmin) {
      where.user = String(userId);
    }

    let enrollment = await Enrollment.findOne({ where });
    if (!enrollment) return res.status(404).json({ error: "Enrollment record not found" });

    if (!isAdmin && Number(enrollment.progress) < 100) {
      return res.status(400).json({
        error: "All course lessons must be completed (100% progress) before generating the certificate.",
        currentProgress: enrollment.progress,
      });
    }

    let studentName = req.body?.studentName || enrollment.certificateRecipientName || req.user?.name || req.user?.username || "Student Name";

    if (!enrollment.certificateNumber) {
      const year = new Date().getFullYear();
      const count = await Enrollment.count({
        where: { certificateNumber: { [Op.ne]: null } },
      });
      const seq = String(count + 1).padStart(4, "0");
      enrollment.certificateNumber = `CC-${year}-${seq}`;
      enrollment.certificateIssuedAt = new Date();
      enrollment.certificateRecipientName = studentName;
      enrollment.certificateCeoName = "Malay Maity";
      await enrollment.save();
    } else if (req.body?.studentName) {
      enrollment.certificateRecipientName = req.body.studentName.trim();
      await enrollment.save();
    }

    const [resolved] = attachCourseDetails([enrollment]);

    res.json({
      success: true,
      certificateNumber: enrollment.certificateNumber,
      certificateIssuedAt: enrollment.certificateIssuedAt,
      studentName: enrollment.certificateRecipientName || studentName,
      courseTitle: resolved?.course?.title || "Advanced Course",
      courseDescription: resolved?.course?.description || "",
      ceoName: enrollment.certificateCeoName || "Malay Maity",
      ceoTitle: "Founder & CEO, Code Campus",
      instructorName: "Rahul Sen",
      instructorTitle: "Course Instructor",
      enrollmentId: enrollment.id,
      courseId: resolved?.course?._id || enrollment.course,
      completedAt: enrollment.completedAt || enrollment.certificateIssuedAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate certificate", details: err.message });
  }
};

export const getCertificate = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { enrollmentId } = req.params;
    const isAdmin = ["admin", "super_admin"].includes(req.user?.role);

    const where = { id: enrollmentId };
    if (!isAdmin) {
      where.user = String(userId);
    }

    const enrollment = await Enrollment.findOne({ where });
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    if (!enrollment.certificateNumber) {
      return res.status(404).json({ error: "Certificate has not been generated yet for this enrollment." });
    }

    let studentName = enrollment.certificateRecipientName || req.user?.name || req.user?.username || "Student Name";
    const [resolved] = attachCourseDetails([enrollment]);

    res.json({
      certificateNumber: enrollment.certificateNumber,
      certificateIssuedAt: enrollment.certificateIssuedAt,
      studentName,
      courseTitle: resolved?.course?.title || "Course",
      courseDescription: resolved?.course?.description || "",
      ceoName: enrollment.certificateCeoName || "Malay Maity",
      ceoTitle: "Founder & CEO, Code Campus",
      instructorName: "Rahul Sen",
      instructorTitle: "Course Instructor",
      enrollmentId: enrollment.id,
      courseId: resolved?.course?._id || enrollment.course,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;
    const enrollment = await Enrollment.findOne({ where: { certificateNumber } });
    if (!enrollment) {
      return res.status(404).json({ error: "Invalid certificate number. No record found." });
    }

    let studentName = enrollment.certificateRecipientName || "Student Name";
    const [resolved] = attachCourseDetails([enrollment]);

    res.json({
      valid: true,
      certificateNumber: enrollment.certificateNumber,
      issuedAt: enrollment.certificateIssuedAt,
      studentName,
      courseTitle: resolved?.course?.title || "Course",
      ceoName: enrollment.certificateCeoName || "Malay Maity",
      status: "Verified Authentic Document",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
