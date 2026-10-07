import Exam from "../models/Exam.js";
import Attempt from "../models/Attempt.js";

export const submitAttempt = async (req, res) => {
  try {
    const { examId, answers, warningsCount, autoSubmitted, cheatingLogged } = req.body;
    const userId = req.user?._id || req.user?.id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Check if the user already submitted
    const existing = await Attempt.findOne({ exam: examId, user: userId });
    if (existing) {
      return res.status(400).json({ message: "You have already submitted this exam." });
    }

    // Evaluate answers
    let score = 0;
    exam.questions.forEach((q, idx) => {
      if (answers && answers[idx] && answers[idx] === q.answer) {
        score++;
      }
    });

    const attempt = new Attempt({
      exam: examId,
      user: userId,
      answers: answers || [],
      score,
      warningsCount: warningsCount || 0,
      autoSubmitted: !!autoSubmitted,
      cheatingLogged: !!cheatingLogged,
    });

    await attempt.save();
    res.status(201).json({ message: "Attempt submitted successfully", attempt });
  } catch (err) {
    res.status(500).json({ message: "Error submitting attempt", error: err.message });
  }
};

export const getMyAttempts = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const attempts = await Attempt.find({ user: userId })
      .populate("exam", "title duration")
      .select("-__v")
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching attempts", error: err.message });
  }
};

export const getExamAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ exam: req.params.id })
      .populate("user", "name email")
      .select("-__v")
      .sort({ score: -1 });

    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching exam attempts", error: err.message });
  }
};

export const getUserAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ user: req.params.userId }).populate("exam", "title");
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
