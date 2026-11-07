import crypto from "crypto";
import { getEnrollmentModel } from "../models/Enrollment.js";
import CertificateDirectory from "../models/CertificateDirectory.js";
import { normalizeId, resolveShardId } from "../database/shardResolver.js";
import { shardCount } from "../config/db.js";

const userIdFrom = (req) => normalizeId(req.user?._id || req.user?.id);
const modelForUser = (userId, mode = "write") => getEnrollmentModel(resolveShardId(userId), mode);
const findAcrossShards = async (options, mode = "read") => {
  for (let shardId = 0; shardId < shardCount; shardId += 1) {
    const row = await getEnrollmentModel(shardId, mode).findOne(options);
    if (row) return row;
  }
  return null;
};

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

const generateEnrollmentNumber = () => {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `CC-${year}-${rand}`;
};

export const enrollCourse = async (req, res) => {
  try {
    const { courseId, days, enrollmentNumber } = req.body;
    const userId = userIdFrom(req);

    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }
    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const accessDays = Math.max(1, Number(days) || 90);
    const userIdStr = String(userId);
    const courseIdStr = String(courseId);

    const Enrollment = modelForUser(userId, "write");
    const shardId = resolveShardId(userId);

    // Determine Enrollment Number (Auto-Carry-Forward or Validate Pasted Number)
    const inputNumber = enrollmentNumber
      ? String(enrollmentNumber).trim().toUpperCase()
      : null;

    // Check if user already has an existing enrollment with an enrollmentNumber
    const previousEnrollment = await Enrollment.findOne({
      where: { user: userIdStr },
      order: [["createdAt", "DESC"]],
    });

    let assignedEnrollmentNumber = null;

    if (inputNumber) {
      // Validate that this enrollment number doesn't belong to another student account
      const conflict = await Enrollment.findOne({
        where: { enrollmentNumber: inputNumber },
      });
      if (conflict && String(conflict.user) !== userIdStr) {
        return res.status(409).json({
          error: "This Enrollment Number is registered to another student account.",
        });
      }
      assignedEnrollmentNumber = inputNumber;
    } else if (previousEnrollment?.enrollmentNumber) {
      // Auto carry-forward existing student enrollment number!
      assignedEnrollmentNumber = previousEnrollment.enrollmentNumber;
    } else {
      // First-time enrollment for this student -> generate new unique number
      assignedEnrollmentNumber = generateEnrollmentNumber();
    }

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
      if (!existing.enrollmentNumber) {
        existing.enrollmentNumber = assignedEnrollmentNumber;
      }
      await existing.save();

      const [finalEnr] = attachCourseDetails([existing]);
      return res.status(200).json({
        message: isExpired ? "Enrollment renewed successfully" : "Course access extended successfully",
        enrollmentNumber: existing.enrollmentNumber,
        enrollment: finalEnr,
        ...finalEnr,
      });
    }

    const newExpiresAt = new Date(Date.now() + accessDays * 24 * 60 * 60 * 1000);
    const enrollment = await Enrollment.create({
      user: userIdStr,
      course: courseIdStr,
      expiresAt: newExpiresAt,
      shardId,
      enrolledAt: new Date(),
      enrollmentNumber: assignedEnrollmentNumber,
    });

    const [finalEnr] = attachCourseDetails([enrollment]);
    res.status(201).json({
      message: "Enrolled successfully",
      enrollmentNumber: enrollment.enrollmentNumber,
      enrollment: finalEnr,
      ...finalEnr,
    });
  } catch (err) {
    console.error("[enrollCourse Error]:", err);
    res.status(400).json({ error: err.message || "Enrollment failed" });
  }
};

export const getMyEnrollmentNumber = async (req, res) => {
  try {
    const userId = userIdFrom(req);
    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }
    const Enrollment = modelForUser(userId, "read");
    const found = await Enrollment.findOne({
      where: { user: String(userId) },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      enrollmentNumber: found?.enrollmentNumber || null,
      hasExisting: Boolean(found?.enrollmentNumber),
    });
  } catch (err) {
    console.error("[getMyEnrollmentNumber Error]:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getEnrollmentsByNumber = async (req, res) => {
  try {
    const num = String(req.params.enrollmentNumber || "").trim().toUpperCase();
    if (!num) {
      return res.status(400).json({ error: "Enrollment number is required" });
    }

    const allEnrollments = [];
    for (let shardId = 0; shardId < shardCount; shardId += 1) {
      const rows = await getEnrollmentModel(shardId, "read").findAll({
        where: { enrollmentNumber: num },
        order: [["createdAt", "DESC"]],
      });
      if (rows.length > 0) {
        allEnrollments.push(...rows);
      }
    }

    if (allEnrollments.length === 0) {
      return res.status(404).json({ error: "No student records found with this Enrollment Number." });
    }

    // Hydrate course details
    const hydratedList = [];
    for (const enr of allEnrollments) {
      const enrObj = typeof enr.toObject === "function" ? enr.toObject() : { ...enr.get?.() || enr };
      try {
        const course = await getCourseById(enr.course);
        enrObj.courseTitle = course.title || "Course";
        enrObj.courseId = course._id || course.id || enr.course;
        enrObj.course = {
          _id: course._id || course.id || enr.course,
          id: course._id || course.id || enr.course,
          title: course.title || "Course",
          description: course.description || "",
          image: course.image || "",
          topicsCount: (course.topics || []).length,
        };
      } catch (_) {
        enrObj.courseTitle = "Course";
        enrObj.courseId = enr.course;
        enrObj.course = {
          _id: enr.course,
          id: enr.course,
          title: "Course",
        };
      }
      hydratedList.push(enrObj);
    }

    res.json({
      enrollmentNumber: num,
      userId: allEnrollments[0].user,
      totalCourses: hydratedList.length,
      courses: hydratedList,
    });
  } catch (err) {
    console.error("[getEnrollmentsByNumber Error]:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMyEnrollments = async (req, res) => {
  try {
    const userId = userIdFrom(req);
    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const enrollments = await modelForUser(userId, "read").findAll({
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
    const targetUserId = normalizeId(req.params.userId);
    const enrollments = await modelForUser(targetUserId, "read").findAll({
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
    const authenticatedUserId = userIdFrom(req);
    if (!authenticatedUserId) return res.status(401).json({ error: "User authentication required." });
    const requestedUserId = req.query.userId;
    const isAdmin = ["admin", "super_admin"].includes(req.user?.role);
    if (requestedUserId && String(requestedUserId) !== String(authenticatedUserId) && !isAdmin) {
      return res.status(403).json({ error: "You can only view your own enrollments." });
    }
    const userId = requestedUserId && isAdmin ? requestedUserId : authenticatedUserId;

    const enrollments = await modelForUser(userId, "read").findAll({
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
    const userId = userIdFrom(req);
    const { subtopicId, completed = true } = req.body;
    if (typeof subtopicId !== "string" || !subtopicId.trim()) {
      return res.status(400).json({ error: "subtopicId is required." });
    }
    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "completed must be a boolean." });
    }

    const enrollment = await modelForUser(userId, "write").findOne({
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
    const userId = userIdFrom(req);
    const { enrollmentId } = req.params;
    const isAdmin = ["admin", "super_admin"].includes(req.user?.role);

    const where = { id: enrollmentId };
    if (!isAdmin) {
      where.user = String(userId);
    }

    let enrollment = isAdmin
      ? await findAcrossShards({ where }, "write")
      : await modelForUser(userId, "write").findOne({ where });
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
      enrollment.certificateNumber = `CC-${year}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
      enrollment.certificateIssuedAt = new Date();
      enrollment.certificateRecipientName = studentName;
      enrollment.certificateCeoName = "Malay Maity";
      await enrollment.save();
      await CertificateDirectory.upsert({
        certificateNumber: enrollment.certificateNumber,
        userId: String(enrollment.user),
        enrollmentId: enrollment.id,
        shardId: Number(enrollment.shardId),
      });
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
    const userId = userIdFrom(req);
    const { enrollmentId } = req.params;
    const isAdmin = ["admin", "super_admin"].includes(req.user?.role);

    const where = { id: enrollmentId };
    if (!isAdmin) {
      where.user = String(userId);
    }

    const enrollment = isAdmin
      ? await findAcrossShards({ where }, "read")
      : await modelForUser(userId, "read").findOne({ where });
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
    const directoryEntry = await CertificateDirectory.findByPk(certificateNumber);
    const enrollment = directoryEntry
      ? await getEnrollmentModel(Number(directoryEntry.shardId), "read").findByPk(directoryEntry.enrollmentId)
      : await findAcrossShards({ where: { certificateNumber } }, "read");
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
