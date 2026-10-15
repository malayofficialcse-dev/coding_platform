import Exam from "../models/Exam.js";
import Attempt from "../models/Attempt.js";
import User from "../models/User.js";

export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find().select("-questions.answer");
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createExam = async (req, res) => {
  try {
    const { title, description, duration, questions } = req.body;
    const author = req.user?._id || req.user?.id;

    const exam = new Exam({
      title,
      description,
      duration: duration || 30,
      questions: questions || [],
      author,
    });

    await exam.save();
    res.status(201).json(exam);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json(exam);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    await Attempt.deleteMany({ exam: req.params.id });
    res.json({ message: "Exam and associated attempts deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getExamAnalytics = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const attempts = await Attempt.find({ exam: examId }).populate("user", "name email");

    const totalQuestions = exam.questions.length;
    const passingMarks = Math.ceil(totalQuestions * 0.4);

    if (attempts.length === 0) {
      return res.json({
        examId,
        title: exam.title,
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passPercentage: 0,
        passCount: 0,
        failCount: 0,
        passingMarks,
        totalQuestions,
      });
    }

    const scores = attempts.map((a) => a.score);
    const averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    const passCount = attempts.filter((a) => a.score >= passingMarks).length;
    const failCount = attempts.length - passCount;
    const passPercentage = ((passCount / attempts.length) * 100).toFixed(2);

    res.json({
      examId,
      title: exam.title,
      totalAttempts: attempts.length,
      averageScore,
      highestScore,
      lowestScore,
      passPercentage,
      passCount,
      failCount,
      passingMarks,
      totalQuestions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOverallExamAnalytics = async (req, res) => {
  try {
    const { college, department, batch, examId, fromDate, toDate } = req.query;

    const allExams = await Exam.find().select("title description duration questions createdAt");
    const examMap = new Map();
    allExams.forEach((e) => {
      examMap.set(e._id.toString(), e);
    });

    const attemptsQuery = {};
    if (examId) {
      attemptsQuery.exam = examId;
    }

    if (fromDate || toDate) {
      attemptsQuery.createdAt = {};
      if (fromDate) {
        attemptsQuery.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        attemptsQuery.createdAt.$lte = to;
      }
    }

    const allAttempts = await Attempt.find(attemptsQuery)
      .populate("user", "name username email college degree yearOfPassing")
      .populate("exam", "title duration questions");

    // Filter attempts by academic criteria if requested
    const filteredAttempts = allAttempts.filter((att) => {
      const u = att.user;
      if (!u) return false;
      if (college && (u.college || "").toLowerCase() !== college.toLowerCase()) return false;
      if (department && (u.degree || "").toLowerCase() !== department.toLowerCase()) return false;
      if (batch && (u.yearOfPassing || "").toString() !== batch.toString()) return false;
      return true;
    });

    // Compute distinct filter options across all users
    const allUsers = await User.find().select("college degree yearOfPassing");
    const collegesSet = new Set();
    const departmentsSet = new Set();
    const batchesSet = new Set();

    allUsers.forEach((u) => {
      if (u.college) collegesSet.add(u.college.trim());
      if (u.degree) departmentsSet.add(u.degree.trim());
      if (u.yearOfPassing) batchesSet.add(u.yearOfPassing.trim());
    });

    // Global Stats on filtered attempts
    let totalAttempts = filteredAttempts.length;
    let passCount = 0;
    let failCount = 0;
    let totalScore = 0;
    let highestScore = 0;
    const candidateUserIds = new Set();

    filteredAttempts.forEach((att) => {
      const qCount = att.exam?.questions?.length || 0;
      const passingMarks = Math.ceil(qCount * 0.4);
      const isPass = (att.score || 0) >= passingMarks;
      if (isPass) passCount++;
      else failCount++;
      totalScore += att.score || 0;
      if ((att.score || 0) > highestScore) highestScore = att.score;
      if (att.user?._id) candidateUserIds.add(att.user._id.toString());
    });

    const overallPassRate = totalAttempts > 0 ? Number(((passCount / totalAttempts) * 100).toFixed(1)) : 0;
    const averageScore = totalAttempts > 0 ? Number((totalScore / totalAttempts).toFixed(2)) : 0;
    const uniqueCandidates = candidateUserIds.size;

    // Per-Exam Breakdown
    const examsSummary = allExams.map((e) => {
      const eIdStr = e._id.toString();
      const eAttempts = filteredAttempts.filter(
        (a) => a.exam?._id?.toString() === eIdStr || a.exam?.toString() === eIdStr
      );
      const qCount = e.questions?.length || 0;
      const passingMarks = Math.ceil(qCount * 0.4);

      let ePass = 0;
      let eFail = 0;
      let eTotalScore = 0;
      let eHighScore = 0;

      eAttempts.forEach((a) => {
        if ((a.score || 0) >= passingMarks) ePass++;
        else eFail++;
        eTotalScore += a.score || 0;
        if ((a.score || 0) > eHighScore) eHighScore = a.score;
      });

      const ePassRate = eAttempts.length > 0 ? Number(((ePass / eAttempts.length) * 100).toFixed(1)) : 0;
      const eAvgScore = eAttempts.length > 0 ? Number((eTotalScore / eAttempts.length).toFixed(2)) : 0;

      return {
        _id: e._id,
        title: e.title,
        duration: e.duration || 30,
        questionCount: qCount,
        passingMarks,
        totalAttempts: eAttempts.length,
        passCount: ePass,
        failCount: eFail,
        passPercentage: ePassRate,
        averageScore: eAvgScore,
        highestScore: eHighScore,
      };
    });

    // Academic Cohort Stats (by College, Batch, Department)
    const collegeMap = {};
    const batchMap = {};
    const deptMap = {};

    filteredAttempts.forEach((att) => {
      const u = att.user;
      const col = (u?.college || "Unassigned").trim();
      const bat = (u?.yearOfPassing || "Unassigned").trim();
      const dep = (u?.degree || "Unassigned").trim();

      const qCount = att.exam?.questions?.length || 0;
      const isPass = (att.score || 0) >= Math.ceil(qCount * 0.4);

      // College
      if (!collegeMap[col]) collegeMap[col] = { college: col, attempts: 0, passCount: 0, totalScore: 0, users: new Set() };
      collegeMap[col].attempts++;
      if (isPass) collegeMap[col].passCount++;
      collegeMap[col].totalScore += att.score || 0;
      if (u?._id) collegeMap[col].users.add(u._id.toString());

      // Batch
      if (!batchMap[bat]) batchMap[bat] = { batch: bat, attempts: 0, passCount: 0, totalScore: 0, users: new Set() };
      batchMap[bat].attempts++;
      if (isPass) batchMap[bat].passCount++;
      batchMap[bat].totalScore += att.score || 0;
      if (u?._id) batchMap[bat].users.add(u._id.toString());

      // Department
      if (!deptMap[dep]) deptMap[dep] = { department: dep, attempts: 0, passCount: 0, totalScore: 0, users: new Set() };
      deptMap[dep].attempts++;
      if (isPass) deptMap[dep].passCount++;
      deptMap[dep].totalScore += att.score || 0;
      if (u?._id) deptMap[dep].users.add(u._id.toString());
    });

    const formatAcademicGroup = (map, keyName) =>
      Object.values(map)
        .map((item) => ({
          [keyName]: item[keyName],
          attempts: item.attempts,
          passCount: item.passCount,
          failCount: item.attempts - item.passCount,
          passRate: item.attempts > 0 ? Number(((item.passCount / item.attempts) * 100).toFixed(1)) : 0,
          avgScore: item.attempts > 0 ? Number((item.totalScore / item.attempts).toFixed(2)) : 0,
          uniqueStudents: item.users.size,
        }))
        .sort((a, b) => b.attempts - a.attempts);

    const collegeStats = formatAcademicGroup(collegeMap, "college");
    const batchStats = formatAcademicGroup(batchMap, "batch");
    const departmentStats = formatAcademicGroup(deptMap, "department");

    // 30-Day Activity Timeline
    const now = new Date();
    const timelineMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      timelineMap[dateKey] = { date: dateKey, attempts: 0, passCount: 0, failCount: 0 };
    }

    filteredAttempts.forEach((att) => {
      if (att.createdAt) {
        const d = new Date(att.createdAt);
        const dateKey = d.toISOString().split("T")[0];
        if (timelineMap[dateKey]) {
          timelineMap[dateKey].attempts++;
          const qCount = att.exam?.questions?.length || 0;
          if ((att.score || 0) >= Math.ceil(qCount * 0.4)) {
            timelineMap[dateKey].passCount++;
          } else {
            timelineMap[dateKey].failCount++;
          }
        }
      }
    });

    const timeline = Object.values(timelineMap);

    res.json({
      globalStats: {
        totalExams: allExams.length,
        totalQuestions: allExams.reduce((sum, e) => sum + (e.questions?.length || 0), 0),
        totalAttempts,
        passCount,
        failCount,
        overallPassRate,
        averageScore,
        highestScore,
        uniqueCandidates,
      },
      exams: examsSummary,
      academicStats: {
        colleges: collegeStats,
        batches: batchStats,
        departments: departmentStats,
      },
      timeline,
      filterOptions: {
        colleges: Array.from(collegesSet).sort(),
        departments: Array.from(departmentsSet).sort(),
        batches: Array.from(batchesSet).sort(),
        exams: allExams.map((e) => ({ _id: e._id, title: e.title })),
      },
    });
  } catch (err) {
    console.error("getOverallExamAnalytics error:", err);
    res.status(500).json({ error: err.message });
  }
};

