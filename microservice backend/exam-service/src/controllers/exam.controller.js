import Exam from "../models/Exam.js";
import Attempt from "../models/Attempt.js";
import User from "../models/User.js";
import { Op } from "sequelize";

export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.findAll({
      order: [["createdAt", "DESC"]],
    });

    const userId = req.user?._id || req.user?.id;
    let attemptMap = new Map();
    if (userId) {
      const userAttempts = await Attempt.findAll({
        where: { user: String(userId) },
      });
      userAttempts.forEach((a) => {
        attemptMap.set(String(a.exam), a);
      });
    }

    // Strip answers from questions for client
    const sanitized = exams.map((exam) => {
      const obj = exam.toObject();
      const questionCount = Array.isArray(obj.questions) ? obj.questions.length : 0;
      if (Array.isArray(obj.questions)) {
        obj.questions = obj.questions.map(({ answer, ...rest }) => rest);
      }
      const myAttempt = attemptMap.get(String(exam.id));
      obj.alreadyGiven = Boolean(myAttempt);
      if (myAttempt) {
        obj.myAttempt = {
          _id: myAttempt.id,
          id: myAttempt.id,
          score: myAttempt.score,
          total: questionCount,
          createdAt: myAttempt.createdAt,
        };
      }
      return obj;
    });

    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    const result = exam.toObject();

    const userId = req.user?._id || req.user?.id;
    if (userId) {
      const existing = await Attempt.findOne({
        where: {
          exam: String(req.params.id),
          user: String(userId),
        },
      });
      if (existing) {
        result.alreadyGiven = true;
        result.myAttempt = {
          _id: existing.id,
          id: existing.id,
          score: existing.score,
          total: Array.isArray(result.questions) ? result.questions.length : 0,
          createdAt: existing.createdAt,
        };
      } else {
        result.alreadyGiven = false;
      }
    }

    // Admin edit screens need the answer key; student exam sessions must never receive it.
    if (!req.baseUrl.includes("/admin/")) {
      result.questions = (result.questions || []).map(({ answer, ...question }) => question);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createExam = async (req, res) => {
  try {
    const { title, description, duration, questions } = req.body;
    const author = req.user?._id || req.user?.id;

    const exam = await Exam.create({
      title,
      description,
      duration: duration || 30,
      questions: questions || [],
      author: String(author || ""),
    });

    res.status(201).json(exam.toObject());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    await exam.update(req.body);
    const result = exam.toObject();
    // Admin edit screens need the answer key; student exam sessions must never receive it.
    if (!req.baseUrl.includes("/admin/")) {
      result.questions = (result.questions || []).map(({ answer, ...question }) => question);
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    await exam.destroy();
    await Attempt.destroy({ where: { exam: req.params.id } });
    res.json({ message: "Exam and associated attempts deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getExamAnalytics = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findByPk(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const attempts = await Attempt.findAll({
      where: { exam: examId },
    });

    const totalQuestions = (exam.questions || []).length;
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

    const scores = attempts.map((a) => Number(a.score || 0));
    const averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    const passCount = attempts.filter((a) => Number(a.score) >= passingMarks).length;
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
    const { examId, fromDate, toDate } = req.query;

    const allExams = await Exam.findAll();
    const whereAttempt = {};
    if (examId) whereAttempt.exam = examId;
    if (fromDate || toDate) {
      whereAttempt.createdAt = {};
      if (fromDate) whereAttempt.createdAt[Op.gte] = new Date(`${fromDate}T00:00:00.000Z`);
      if (toDate) {
        whereAttempt.createdAt[Op.lte] = new Date(`${toDate}T23:59:59.999Z`);
      }
    }

    const allAttempts = await Attempt.findAll({ where: whereAttempt });
    const userIds = [...new Set(allAttempts.map((a) => a.user))];
    const users = userIds.length
      ? await User.findAll({ where: { id: { [Op.in]: userIds } } })
      : [];
    const allUsers = await User.findAll({
      attributes: ["id", "college", "degree", "yearOfPassing"],
    });
    const userMap = new Map(users.map((u) => [String(u.id), u]));
    const examMap = new Map(allExams.map((exam) => [String(exam.id), exam]));
    const normalizedAttempts = allAttempts.map((attempt) => {
      const exam = examMap.get(String(attempt.exam));
      const user = userMap.get(String(attempt.user));
      const questionCount = exam?.questions?.length || 0;
      const score = Number(attempt.score) || 0;

      return {
        attempt,
        exam,
        user,
        score,
        passingMarks: Math.ceil(questionCount * 0.4),
        passed: score >= Math.ceil(questionCount * 0.4),
      };
    });

    const matchesCohortFilters = ({ user }) =>
      (!req.query.college || user?.college === req.query.college) &&
      (!req.query.department || user?.degree === req.query.department) &&
      (!req.query.batch || user?.yearOfPassing === req.query.batch);
    const filteredAttempts = normalizedAttempts.filter(matchesCohortFilters);
    const filteredExams = allExams.filter((exam) => !examId || String(exam.id) === examId);
    const scores = filteredAttempts.map(({ score }) => score);
    const passCount = filteredAttempts.filter(({ passed }) => passed).length;
    const failCount = filteredAttempts.length - passCount;

    const examStats = filteredExams.map((exam) => {
      const questionCount = exam.questions?.length || 0;
      const passingMarks = Math.ceil(questionCount * 0.4);
      const examAttempts = filteredAttempts.filter(
        ({ attempt }) => String(attempt.exam) === String(exam.id),
      );
      const examScores = examAttempts.map(({ score }) => score);
      const examPassCount = examAttempts.filter(({ passed }) => passed).length;

      return {
        _id: String(exam.id),
        title: exam.title,
        duration: exam.duration,
        questionCount,
        passingMarks,
        totalAttempts: examAttempts.length,
        passCount: examPassCount,
        failCount: examAttempts.length - examPassCount,
        passPercentage: examAttempts.length
          ? Number(((examPassCount / examAttempts.length) * 100).toFixed(1))
          : 0,
        averageScore: examScores.length
          ? Number((examScores.reduce((sum, score) => sum + score, 0) / examScores.length).toFixed(2))
          : 0,
        highestScore: examScores.length ? Math.max(...examScores) : 0,
      };
    });

    const aggregateBy = (getLabel, labelKey) => {
      const groups = new Map();
      for (const item of filteredAttempts) {
        const label = getLabel(item.user) || "Unknown";
        if (!groups.has(label)) {
          groups.set(label, { label, attempts: 0, passCount: 0, totalScore: 0, students: new Set() });
        }
        const group = groups.get(label);
        group.attempts++;
        group.totalScore += item.score;
        if (item.passed) group.passCount++;
        group.students.add(String(item.attempt.user));
      }

      return [...groups.values()]
        .map((group) => ({
          [labelKey]: group.label,
          attempts: group.attempts,
          uniqueStudents: group.students.size,
          passCount: group.passCount,
          failCount: group.attempts - group.passCount,
          passRate: Number(((group.passCount / group.attempts) * 100).toFixed(1)),
          avgScore: Number((group.totalScore / group.attempts).toFixed(2)),
        }))
        .sort((a, b) => b.attempts - a.attempts);
    };

    const attemptsByDate = new Map();
    for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - daysAgo);
      attemptsByDate.set(date.toISOString().slice(0, 10), { date: date.toISOString().slice(0, 10), attempts: 0, passCount: 0 });
    }
    for (const item of filteredAttempts) {
      const date = new Date(item.attempt.createdAt).toISOString().slice(0, 10);
      const day = attemptsByDate.get(date);
      if (!day) continue;
      day.attempts++;
      if (item.passed) day.passCount++;
    }

    const filterValues = (key) => [
      ...new Set(allUsers.map((user) => user[key]).filter(Boolean).map(String)),
    ].sort();
    const uniqueCandidates = new Set(filteredAttempts.map(({ attempt }) => String(attempt.user))).size;

    res.json({
      globalStats: {
        totalExams: filteredExams.length,
        totalQuestions: filteredExams.reduce((sum, exam) => sum + (exam.questions?.length || 0), 0),
        totalAttempts: filteredAttempts.length,
        passCount,
        failCount,
        overallPassRate: filteredAttempts.length
          ? Number(((passCount / filteredAttempts.length) * 100).toFixed(1))
          : 0,
        averageScore: scores.length
          ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2))
          : 0,
        highestScore: scores.length ? Math.max(...scores) : 0,
        uniqueCandidates,
      },
      exams: examStats,
      academicStats: {
        colleges: aggregateBy((user) => user?.college, "college"),
        batches: aggregateBy((user) => user?.yearOfPassing, "batch"),
        departments: aggregateBy((user) => user?.degree, "department"),
      },
      timeline: [...attemptsByDate.values()],
      filterOptions: {
        colleges: filterValues("college"),
        departments: filterValues("degree"),
        batches: filterValues("yearOfPassing"),
        exams: allExams.map((exam) => ({ _id: String(exam.id), title: exam.title })),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
