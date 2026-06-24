import Exam from "../models/Exam.js";
import Attempt from "../models/Attempt.js";

// Get all exams
export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find();
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get exam by ID
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create exam
export const createExam = async (req, res) => {
  try {
    const exam = new Exam(req.body);
    await exam.save();
    res.status(201).json(exam);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update exam
export const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json(exam);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete exam
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json({ message: "Exam deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const submitAttempt = async (req, res) => {
  try {
    const { examId, answers, warningsCount, autoSubmitted, cheatingLogged } = req.body;

    // Check if exam exists
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Check if the user has already submitted an attempt for this exam
    const existingAttempt = await Attempt.findOne({
      exam: examId,
      user: req.user.id,
    });
    if (existingAttempt) {
      return res
        .status(400)
        .json({ message: "You have already submitted this exam." });
    }

    // Evaluate score
    let score = 0;
    exam.questions.forEach((q, idx) => {
      if (answers[idx] && answers[idx] === q.answer) {
        score++;
      }
    });

    const attempt = new Attempt({
      exam: examId,
      user: req.user.id,
      answers,
      score,
      warningsCount: warningsCount || 0,
      autoSubmitted: !!autoSubmitted,
      cheatingLogged: !!cheatingLogged,
    });

    await attempt.save();
    res.status(201).json({ message: "Attempt submitted", attempt });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error submitting attempt", error: err.message });
  }
};

// Get attempts of logged-in user
export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ user: req.user.id })
      .populate("exam", "title")
      .select("-__v");
    res.json(attempts);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching attempts", error: err.message });
  }
};

// Get all attempts for a specific exam (admin/teacher only)
export const getExamAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ exam: req.params.id })
      .populate("user", "name email")
      .select("-__v");
    res.json(attempts);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching exam attempts", error: err.message });
  }
};


export const getExamAnalytics = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const attempts = await Attempt.find({ exam: examId });

    // Calculate passing marks as 40% of total questions (rounded up)
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
    const averageScore = (
      scores.reduce((a, b) => a + b, 0) / scores.length
    ).toFixed(2);
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

export const getExamsByUser = async (req, res) => {
  try {
    const exams = await Exam.find({ author: req.params.id });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
