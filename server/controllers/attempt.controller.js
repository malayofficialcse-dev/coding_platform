// controllers/attempt.controller.js

import Attempt from "../models/Attempt.js";
import Exam from "../models/Exam.js";

export const getUserAttempts = async (req, res) => {
  const attempts = await Attempt.find({ user: req.user._id }).populate("exam");
  res.json(attempts);
};

export const getAttemptsByUser = async (req, res) => {
  try {
    const attempts = await Attempt.find({ user: req.params.userId }).populate(
      "exam"
    );
    res.json(attempts);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
