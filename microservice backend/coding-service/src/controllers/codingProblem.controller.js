import CodingProblem from "../models/CodingProblem.js";

export const getAllProblems = async (req, res) => {
  try {
    const { difficulty, dsaTopic, search } = req.query;
    const filter = {};

    if (difficulty && difficulty !== "all") {
      filter.difficulty = { $regex: new RegExp(`^${difficulty}$`, "i") };
    }
    if (dsaTopic && dsaTopic !== "all") {
      filter.dsaTopic = { $regex: new RegExp(`^${dsaTopic}$`, "i") };
    }
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { dsaTopic: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const problems = await CodingProblem.find(filter).sort({ createdAt: -1 });
    res.json(problems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
};

export const getProblemById = async (req, res) => {
  try {
    const problem = await CodingProblem.findById(req.params.id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json(problem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch problem" });
  }
};

export const createProblem = async (req, res) => {
  try {
    if (!req.body || !req.body.title) {
      return res.status(400).json({ error: "Title is required" });
    }
    const createdBy = req.user?._id || req.user?.id;
    const payload = { ...req.body, createdBy };

    if (!Array.isArray(payload.testCases)) {
      payload.testCases = payload.testCases ? [payload.testCases] : [];
    }

    const problem = new CodingProblem(payload);
    await problem.save();
    res.status(201).json(problem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create problem" });
  }
};

export const updateProblem = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.testCases && !Array.isArray(updates.testCases)) {
      updates.testCases = [updates.testCases];
    }
    const problem = await CodingProblem.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json(problem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update problem" });
  }
};

export const deleteProblem = async (req, res) => {
  try {
    const deleted = await CodingProblem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Problem not found" });
    res.json({ message: "Problem deleted", id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete problem" });
  }
};
