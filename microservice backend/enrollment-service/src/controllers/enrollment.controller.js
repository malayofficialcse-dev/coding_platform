import Enrollment from "../models/Enrollment.js";
import { Op } from "sequelize";

const getCourseById = async (courseId) => {
  const serviceUrl = (process.env.COURSE_SERVICE_URL || "http://localhost:5005").replace(/\/+$/, "");
  const baseUrl = serviceUrl.endsWith("/v1") ? `${serviceUrl}/courses` : `${serviceUrl}/v1/courses`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${baseUrl}/${encodeURIComponent(courseId)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Course service returned HTTP ${response.status}.`);
    const course = await response.json();
    if (!course || !Array.isArray(course.topics)) {
      throw new Error("Course service returned an invalid course record.");
    }
    return course;
  } finally {
    clearTimeout(timeout);
  }
};

const getCourseSubtopicIds = (course) => new Set(
  course.topics.flatMap((topic) => (Array.isArray(topic.subtopics) ? topic.subtopics : []))
    .map((subtopic) => String(subtopic._id || subtopic.id || ""))
    .filter(Boolean)
);

const calculateProgress = (completedCount, totalCount) => {
  if (totalCount === 0) return 0;
  if (completedCount >= totalCount) return 100;
  return Math.floor((completedCount / totalCount) * 100);
};

const refreshEnrollmentProgress = (enrollment, subtopicIds) => {
  const completedIds = new Set(
    (enrollment.completedSubtopics || [])
      .map((id) => String(id))
      .filter((id) => subtopicIds.has(id))
  );
  enrollment.completedSubtopics = [...completedIds];
  enrollment.progress = calculateProgress(completedIds.size, subtopicIds.size);
  enrollment.completedAt = enrollment.progress === 100
    ? enrollment.completedAt || new Date()
    : null;
};

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
    const authenticatedUserId = req.user?._id || req.user?.id;
    if (!authenticatedUserId) return res.status(401).json({ error: "User authentication required." });
    const requestedUserId = req.query.userId;
    const isAdmin = ["admin", "super_admin"].includes(req.user?.role);
    if (requestedUserId && String(requestedUserId) !== String(authenticatedUserId) && !isAdmin) {
      return res.status(403).json({ error: "You can only view your own enrollments." });
    }
    const userId = requestedUserId && isAdmin ? requestedUserId : authenticatedUserId;

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
    const { subtopicId, completed = true } = req.body;
    if (typeof subtopicId !== "string" || !subtopicId.trim()) {
      return res.status(400).json({ error: "subtopicId is required." });
    }
    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "completed must be a boolean." });
    }

    const enrollment = await Enrollment.findOne({
      where: {
        id: req.params.enrollmentId,
        user: String(userId),
      },
    });

    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    let course;
    try {
      course = await getCourseById(enrollment.course);
    } catch (error) {
      console.error("[updateCourseProgress] Could not verify course content:", error);
      return res.status(503).json({ error: "Course content could not be verified. Please try again later." });
    }
    const subtopicIds = getCourseSubtopicIds(course);
    if (!subtopicIds.has(subtopicId)) {
      return res.status(400).json({ error: "The subtopic does not belong to this course." });
    }

    refreshEnrollmentProgress(enrollment, subtopicIds);
    const completedIds = new Set(enrollment.completedSubtopics);
    if (completed) completedIds.add(subtopicId);
    else completedIds.delete(subtopicId);
    enrollment.completedSubtopics = [...completedIds];
    enrollment.progress = calculateProgress(completedIds.size, subtopicIds.size);
    enrollment.completedAt = enrollment.progress === 100
      ? enrollment.completedAt || new Date()
      : null;
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

    if (!isAdmin) {
      let course;
      try {
        course = await getCourseById(enrollment.course);
      } catch (error) {
        console.error("[generateCertificate] Could not verify course content:", error);
        return res.status(503).json({ error: "Course completion could not be verified. Please try again later." });
      }
      refreshEnrollmentProgress(enrollment, getCourseSubtopicIds(course));
      await enrollment.save();
    }

    if (!isAdmin && enrollment.progress < 100) {
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
    if (!isAdmin) {
      let course;
      try {
        course = await getCourseById(enrollment.course);
      } catch (error) {
        console.error("[getCertificate] Could not verify course content:", error);
        return res.status(503).json({ error: "Certificate completion could not be verified. Please try again later." });
      }
      refreshEnrollmentProgress(enrollment, getCourseSubtopicIds(course));
      if (enrollment.progress < 100) {
        return res.status(404).json({ error: "Certificate is not valid because course completion could not be verified." });
      }
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

    let course;
    try {
      course = await getCourseById(enrollment.course);
    } catch (error) {
      console.error("[verifyCertificate] Could not verify course content:", error);
      return res.status(503).json({ error: "Certificate completion could not be verified. Please try again later." });
    }
    refreshEnrollmentProgress(enrollment, getCourseSubtopicIds(course));
    if (enrollment.progress < 100) {
      return res.status(200).json({
        valid: false,
        certificateNumber: enrollment.certificateNumber,
        status: "Course completion requirements are not met.",
      });
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
