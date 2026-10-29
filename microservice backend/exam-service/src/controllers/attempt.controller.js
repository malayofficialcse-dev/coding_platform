import Exam from "../models/Exam.js";
import Attempt from "../models/Attempt.js";
import User from "../models/User.js";

export const submitAttempt = async (req, res) => {
  try {
    const { examId, answers, warningsCount, autoSubmitted, cheatingLogged } = req.body;
    const userId = req.user?._id || req.user?.id;

    const exam = await Exam.findByPk(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Check if user already submitted
    const existing = await Attempt.findOne({
      where: {
        exam: String(examId),
        user: String(userId),
      },
    });

    if (existing) {
      return res.status(400).json({ message: "You have already submitted this exam." });
    }

    // Evaluate answers
    let score = 0;
    const questions = exam.questions || [];
    questions.forEach((q, idx) => {
      if (answers && answers[idx] && answers[idx] === q.answer) {
        score++;
      }
    });

    const attempt = await Attempt.create({
      exam: String(examId),
      user: String(userId),
      answers: answers || [],
      score,
      warningsCount: warningsCount || 0,
      autoSubmitted: !!autoSubmitted,
      cheatingLogged: !!cheatingLogged,
    });

    res.status(201).json({ message: "Attempt submitted successfully", attempt: attempt.toObject() });
  } catch (err) {
    res.status(500).json({ message: "Error submitting attempt", error: err.message });
  }
};

export const getMyAttempts = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const attempts = await Attempt.findAll({
      where: { user: String(userId) },
      order: [["createdAt", "DESC"]],
    });

    const examIds = [...new Set(attempts.map((a) => a.exam))];
    const exams = await Exam.findAll({ where: { id: examIds } });
    const examMap = new Map(exams.map((e) => [String(e.id), e]));

    const enriched = attempts.map((att) => {
      const obj = att.toObject();
      const sourceExam = examMap.get(String(att.exam));
      const examObj = sourceExam
        ? sourceExam.toObject()
        : { id: att.exam, title: "Exam", questions: [] };
      examObj.questions = (examObj.questions || []).map(({ answer, ...question }) => question);
      obj.exam = examObj;
      // Add total so the frontend can calculate % scores (score / total * 100)
      obj.total = Array.isArray(examObj.questions) ? examObj.questions.length : (examObj.questions?.length ?? 0);
      return obj;
    });

    res.json(enriched);

  } catch (err) {
    res.status(500).json({ message: "Error fetching attempts", error: err.message });
  }
};

export const getExamAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.findAll({
      where: { exam: req.params.id },
      order: [["score", "DESC"]],
    });

    const userIds = [...new Set(attempts.map((a) => a.user))];
    const users = await User.findAll({ where: { id: userIds } });
    const userMap = new Map(users.map((u) => [String(u.id), u]));

    const enriched = attempts.map((att) => {
      const obj = att.toObject();
      obj.user = userMap.get(String(att.user)) || { id: att.user, name: "Student" };
      return obj;
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Error fetching exam attempts", error: err.message });
  }
};

export const getUserAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.findAll({
      where: { user: req.params.userId },
      order: [["createdAt", "DESC"]],
    });

    const examIds = [...new Set(attempts.map((a) => a.exam))];
    const exams = await Exam.findAll({ where: { id: examIds } });
    const examMap = new Map(exams.map((e) => [String(e.id), e]));

    const enriched = attempts.map((att) => {
      const obj = att.toObject();
      obj.exam = examMap.get(String(att.exam)) || { id: att.exam, title: "Exam" };
      return obj;
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAttemptById = async (req, res) => {
  try {
    const attempt = await Attempt.findByPk(req.params.id);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    const authenticatedUserId = req.user?._id || req.user?.id;
    const isAdmin = ["admin", "super_admin"].includes(req.user?.role);
    if (!isAdmin && String(attempt.user) !== String(authenticatedUserId)) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    const obj = attempt.toObject();
    const exam = await Exam.findByPk(attempt.exam);
    const user = await User.findByPk(attempt.user);
    const examObject = exam ? exam.toObject() : { id: attempt.exam, title: "Exam" };
    if (!isAdmin) {
      examObject.questions = (examObject.questions || []).map(({ answer, ...question }) => question);
    }

    obj.exam = examObject;
    obj.user = user ? { id: user.id, name: user.name } : { id: attempt.user, name: "Student" };

    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
