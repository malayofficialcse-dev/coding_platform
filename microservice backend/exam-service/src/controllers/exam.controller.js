import Exam from "../models/Exam.js";
import Attempt from "../models/Attempt.js";
import User from "../models/User.js";
import { Op } from "sequelize";

export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.findAll({
      order: [["createdAt", "DESC"]],
    });

    // Strip answers from questions for client
    const sanitized = exams.map((exam) => {
      const obj = exam.toObject();
      if (Array.isArray(obj.questions)) {
        obj.questions = obj.questions.map(({ answer, ...rest }) => rest);
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
    res.json(exam.toObject());
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
    res.json(exam.toObject());
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
      if (fromDate) whereAttempt.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        whereAttempt.createdAt[Op.lte] = to;
      }
    }

    const allAttempts = await Attempt.findAll({ where: whereAttempt });
    const userIds = [...new Set(allAttempts.map((a) => a.user))];
    const users = await User.findAll({ where: { id: userIds } });
    const userMap = new Map(users.map((u) => [String(u.id), u]));

    const enrichedAttempts = allAttempts.map((att) => {
      const obj = att.toObject();
      obj.user = userMap.get(String(att.user)) || { id: att.user, name: "Student" };
      return obj;
    });

    let totalAttempts = enrichedAttempts.length;
    let passCount = 0;
    let failCount = 0;
    let totalScore = 0;
    let highestScore = 0;

    const examMap = new Map(allExams.map((e) => [String(e.id), e]));

    enrichedAttempts.forEach((att) => {
      const exam = examMap.get(String(att.exam));
      const qCount = exam?.questions?.length || 10;
      const passingMarks = Math.ceil(qCount * 0.4);
      const isPass = (att.score || 0) >= passingMarks;
      if (isPass) passCount++;
      else failCount++;
      totalScore += att.score || 0;
      if ((att.score || 0) > highestScore) highestScore = att.score;
    });

    const overallPassRate = totalAttempts > 0 ? Number(((passCount / totalAttempts) * 100).toFixed(1)) : 0;
    const averageScore = totalAttempts > 0 ? Number((totalScore / totalAttempts).toFixed(2)) : 0;

    res.json({
      totalExams: allExams.length,
      totalAttempts,
      passCount,
      failCount,
      overallPassRate,
      averageScore,
      highestScore,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
