import Exam from "../models/Exam.js";
import User from "../models/User.js";
import Attempt from "../models/Attempt.js";
import Post from "../models/Post.js";

// Create Exam (admin only)
export const createExam = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can create exams" });

    const { title, description, questions } = req.body;
    const exam = new Exam({ title, description, questions });
    await exam.save();
    res.json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Get all exams
export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find().select("-questions.answer");
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Get single exam by ID
export const getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Update exam by ID (admin only)
export const updateExam = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can update exams" });

    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Delete exam by ID (admin only)
export const deleteExam = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can delete exams" });

    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json({ message: "Exam deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admins" });
  }
};

export const getUserAttempts = async (req, res) => {
  const attempts = await Attempt.find({ user: req.params.userId }).populate(
    "exam"
  );
  res.json(attempts);
};

// Get all posts (with author info)
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "username email");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Delete any post by ID
export const deleteAnyPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const deleted = await Post.findByIdAndDelete(postId);
    if (!deleted) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update any post by ID
export const updateAnyPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const updated = await Post.findByIdAndUpdate(postId, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Post not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Create post as admin
export const createPostAsAdmin = async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const post = new Post({ title, content, author });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
