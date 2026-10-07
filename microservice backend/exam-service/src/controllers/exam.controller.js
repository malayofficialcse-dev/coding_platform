import Exam from "../models/Exam.js";
import Attempt from "../models/Attempt.js";

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
