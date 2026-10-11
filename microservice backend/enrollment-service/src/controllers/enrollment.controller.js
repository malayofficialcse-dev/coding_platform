import Enrollment from "../models/Enrollment.js";
import mongoose from "mongoose";

// Register Course schema if not registered so populate("course") works
if (!mongoose.models.Course) {
  mongoose.model(
    "Course",
    new mongoose.Schema(
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        image: { type: String, default: "" },
        topics: [
          {
            title: String,
            order: Number,
            subtopics: [
              {
                title: String,
                body: String,
                order: Number,
              },
            ],
          },
        ],
      },
      { timestamps: true }
    )
  );
}

const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
};

/**
 * Ensures course details are attached to an enrollment even if populate returned null
 */
async function attachCourseDetails(enrollmentList) {
  const list = Array.isArray(enrollmentList) ? enrollmentList : [enrollmentList];
  const missingCourseIds = [];

  for (const en of list) {
    if (!en.course || typeof en.course !== "object" || !en.course.title) {
      const rawCourseId = en.course?._id || en.course;
      if (rawCourseId) {
        missingCourseIds.push(toObjectId(rawCourseId));
      }
    }
  }

  const validMissingIds = missingCourseIds.filter(Boolean);
  let courseMap = new Map();
  if (validMissingIds.length > 0) {
    try {
      const rawCourses = await mongoose.connection.db
        .collection("courses")
        .find({ _id: { $in: validMissingIds } })
        .toArray();
      courseMap = new Map(rawCourses.map((c) => [String(c._id), c]));
    } catch (e) {
      console.error("[attachCourseDetails] Error looking up raw courses:", e.message);
    }
  }

  return list.map((en) => {
    const enObj = typeof en.toObject === "function" ? en.toObject() : { ...en };
    if (!enObj.course || typeof enObj.course !== "object" || !enObj.course.title) {
      const rawCourseId = String(enObj.course?._id || enObj.course || "");
      if (courseMap.has(rawCourseId)) {
        enObj.course = courseMap.get(rawCourseId);
      } else if (rawCourseId) {
        enObj.course = { _id: rawCourseId, title: "Course" };
      }
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

    const userObjId = toObjectId(userId);
    const courseObjId = toObjectId(courseId);

    const accessDays = Math.max(1, Number(days) || 90);

    // Look for existing enrollment with both ObjectId and string matches
    const queryConditions = [
      { user: userId, course: courseId },
    ];
    if (userObjId && courseObjId) {
      queryConditions.push({ user: userObjId, course: courseObjId });
    }
    if (userObjId) {
      queryConditions.push({ user: userObjId, course: courseId });
    }
    if (courseObjId) {
      queryConditions.push({ user: userId, course: courseObjId });
    }

    let existing = await Enrollment.findOne({ $or: queryConditions });

    if (existing) {
      // Renew or extend access
      const isExpired = !existing.expiresAt || new Date(existing.expiresAt) < new Date();
      const baseTime = isExpired ? Date.now() : new Date(existing.expiresAt).getTime();
      const newExpiresAt = new Date(baseTime + accessDays * 24 * 60 * 60 * 1000);

      existing.expiresAt = newExpiresAt;
      existing.enrolledAt = existing.enrolledAt || new Date();
      await existing.save();

      const populated = await Enrollment.findById(existing._id).populate("course");
      const [finalEnr] = await attachCourseDetails([populated || existing]);

      return res.status(200).json({
        message: isExpired ? "Enrollment renewed successfully" : "Course access extended successfully",
        enrollment: finalEnr,
        ...finalEnr,
      });
    }

    // New enrollment
    const newExpiresAt = new Date(Date.now() + accessDays * 24 * 60 * 60 * 1000);
    const enrollment = new Enrollment({
      user: userObjId || userId,
      course: courseObjId || courseId,
      expiresAt: newExpiresAt,
      enrolledAt: new Date(),
    });

    await enrollment.save();

    const populated = await Enrollment.findById(enrollment._id).populate("course");
    const [finalEnr] = await attachCourseDetails([populated || enrollment]);

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

    const userObjId = toObjectId(userId);
    const query = userObjId
      ? { $or: [{ user: userObjId }, { user: String(userId) }] }
      : { user: String(userId) };

    const rawEnrollments = await Enrollment.find(query).populate("course");
    const resolved = await attachCourseDetails(rawEnrollments);

    res.json(resolved);
  } catch (err) {
    console.error("[getMyEnrollments Error]:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getEnrollmentsByUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const userObjId = toObjectId(targetUserId);
    const query = userObjId
      ? { $or: [{ user: userObjId }, { user: String(targetUserId) }] }
      : { user: String(targetUserId) };

    const rawEnrollments = await Enrollment.find(query).populate("course");
    const resolved = await attachCourseDetails(rawEnrollments);
    res.json(resolved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId query parameter is required" });

    const userObjId = toObjectId(userId);
    const query = userObjId
      ? { $or: [{ user: userObjId }, { user: String(userId) }] }
      : { user: String(userId) };

    const rawEnrollments = await Enrollment.find(query).populate("course");
    const resolved = await attachCourseDetails(rawEnrollments);
    res.json(resolved);
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

    const userObjId = toObjectId(userId);
    const enrQuery = userObjId
      ? { _id: req.params.enrollmentId, $or: [{ user: userObjId }, { user: String(userId) }] }
      : { _id: req.params.enrollmentId, user: String(userId) };

    const enrollment = await Enrollment.findOne(enrQuery);
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

export const generateCertificate = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { enrollmentId } = req.params;
    const isAdmin = ["admin", "super_admin"].includes(req.user?.role);

    const userObjId = toObjectId(userId);
    const query = isAdmin
      ? { _id: enrollmentId }
      : userObjId
      ? { _id: enrollmentId, $or: [{ user: userObjId }, { user: String(userId) }] }
      : { _id: enrollmentId, user: String(userId) };

    let enrollment = await Enrollment.findOne(query).populate("course");
    if (!enrollment) return res.status(404).json({ error: "Enrollment record not found" });

    // Ensure 100% completion (unless admin previewing)
    if (!isAdmin && Number(enrollment.progress) < 100) {
      return res.status(400).json({
        error: "All course lessons must be completed (100% progress) before generating the certificate.",
        currentProgress: enrollment.progress,
      });
    }

    const isCeoName = (n) => {
      if (!n) return false;
      const clean = String(n).trim().toLowerCase();
      return clean === "malay maity";
    };

    // Find the enrolled student's user account from the database
    let enrolledStudent = null;
    if (enrollment.user) {
      try {
        enrolledStudent = await mongoose.connection
          .collection("users")
          .findOne({ _id: toObjectId(enrollment.user) });
      } catch (e) {}
    }

    // Determine the student's real name (never defaulting to the CEO name)
    let studentName = "";
    if (req.body?.studentName && !isCeoName(req.body.studentName)) {
      studentName = req.body.studentName.trim();
    } else if (enrollment.certificateRecipientName && !isCeoName(enrollment.certificateRecipientName)) {
      studentName = enrollment.certificateRecipientName.trim();
    } else if (enrolledStudent?.name && !isCeoName(enrolledStudent.name)) {
      studentName = enrolledStudent.name.trim();
    } else if (enrolledStudent?.username && !isCeoName(enrolledStudent.username)) {
      studentName = enrolledStudent.username.trim();
    } else if (req.user?.name && !isCeoName(req.user.name)) {
      studentName = req.user.name.trim();
    } else if (req.user?.username && !isCeoName(req.user.username)) {
      studentName = req.user.username.trim();
    } else {
      studentName = "Student Name";
    }

    // Auto-increment Certificate Number if not yet generated
    if (!enrollment.certificateNumber) {
      const year = new Date().getFullYear();
      const count = await Enrollment.countDocuments({
        certificateNumber: { $exists: true, $ne: null },
      });
      const seq = String(count + 1).padStart(4, "0");
      enrollment.certificateNumber = `CC-${year}-${seq}`;
      enrollment.certificateIssuedAt = new Date();
      enrollment.certificateRecipientName = studentName;
      enrollment.certificateCeoName = "Malay Maity";
      await enrollment.save();
    } else {
      let needsSave = false;
      if (req.body?.studentName && !isCeoName(req.body.studentName)) {
        enrollment.certificateRecipientName = req.body.studentName.trim();
        needsSave = true;
      } else if (isCeoName(enrollment.certificateRecipientName)) {
        enrollment.certificateRecipientName = studentName;
        needsSave = true;
      }
      if (needsSave) {
        await enrollment.save();
      }
    }

    const [resolved] = await attachCourseDetails([enrollment]);
    const courseTitle = resolved?.course?.title || "Advanced Course";

    res.json({
      success: true,
      certificateNumber: enrollment.certificateNumber,
      certificateIssuedAt: enrollment.certificateIssuedAt,
      studentName: enrollment.certificateRecipientName || studentName,
      courseTitle,
      courseDescription: resolved?.course?.description || "",
      ceoName: enrollment.certificateCeoName || "Malay Maity",
      ceoTitle: "Founder & CEO, Code Campus",
      instructorName: "Rahul Sen",
      instructorTitle: "Course Instructor",
      enrollmentId: enrollment._id,
      courseId: resolved?.course?._id || resolved?.course,
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

    const userObjId = toObjectId(userId);
    const query = isAdmin
      ? { _id: enrollmentId }
      : userObjId
      ? { _id: enrollmentId, $or: [{ user: userObjId }, { user: String(userId) }] }
      : { _id: enrollmentId, user: String(userId) };

    const enrollment = await Enrollment.findOne(query).populate("course");
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    if (!enrollment.certificateNumber) {
      return res.status(404).json({ error: "Certificate has not been generated yet for this enrollment." });
    }

    const isCeoName = (n) => {
      if (!n) return false;
      const clean = String(n).trim().toLowerCase();
      return clean === "malay maity";
    };

    let enrolledStudent = null;
    if (enrollment.user) {
      try {
        enrolledStudent = await mongoose.connection
          .collection("users")
          .findOne({ _id: toObjectId(enrollment.user) });
      } catch (e) {}
    }

    let studentName = "";
    if (enrollment.certificateRecipientName && !isCeoName(enrollment.certificateRecipientName)) {
      studentName = enrollment.certificateRecipientName.trim();
    } else if (enrolledStudent?.name && !isCeoName(enrolledStudent.name)) {
      studentName = enrolledStudent.name.trim();
    } else if (enrolledStudent?.username && !isCeoName(enrolledStudent.username)) {
      studentName = enrolledStudent.username.trim();
    } else if (req.user?.name && !isCeoName(req.user.name)) {
      studentName = req.user.name.trim();
    } else if (req.user?.username && !isCeoName(req.user.username)) {
      studentName = req.user.username.trim();
    } else {
      studentName = "Student Name";
    }

    if (isCeoName(enrollment.certificateRecipientName)) {
      enrollment.certificateRecipientName = studentName;
      await enrollment.save().catch(() => {});
    }

    const [resolved] = await attachCourseDetails([enrollment]);

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
      enrollmentId: enrollment._id,
      courseId: resolved?.course?._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;
    const enrollment = await Enrollment.findOne({ certificateNumber }).populate("course");
    if (!enrollment) {
      return res.status(404).json({ error: "Invalid certificate number. No record found." });
    }

    const isCeoName = (n) => {
      if (!n) return false;
      const clean = String(n).trim().toLowerCase();
      return clean === "malay maity";
    };

    let studentName = enrollment.certificateRecipientName;
    if (!studentName || isCeoName(studentName)) {
      try {
        const enrolledStudent = await mongoose.connection
          .collection("users")
          .findOne({ _id: toObjectId(enrollment.user) });
        if (enrolledStudent?.name && !isCeoName(enrolledStudent.name)) {
          studentName = enrolledStudent.name.trim();
        } else if (enrolledStudent?.username && !isCeoName(enrolledStudent.username)) {
          studentName = enrolledStudent.username.trim();
        } else {
          studentName = "Student Name";
        }
      } catch (e) {
        studentName = "Student Name";
      }
    }

    const [resolved] = await attachCourseDetails([enrollment]);

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

