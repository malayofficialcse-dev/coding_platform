import Course from "../models/Course.js";

const parseCodeBlocks = (value) => {
  if (value === undefined || value === null || value === "") return [];
  if (typeof value === "string") {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error("codeBlocks must be an array");
    return parsed;
  }
  if (Array.isArray(value)) return value;
  throw new Error("codeBlocks must be an array");
};

const getSubtopicImages = (bodyImages, files = []) => {
  const imageUrls =
    bodyImages === undefined
      ? []
      : typeof bodyImages === "string"
        ? JSON.parse(bodyImages)
        : Array.isArray(bodyImages)
          ? bodyImages
          : [bodyImages];
  if (!Array.isArray(imageUrls)) throw new Error("imageUrls must be an array");
  const uploadedImages = files.map((file) => file.path || file.location).filter(Boolean);
  return [...imageUrls, ...uploadedImages];
};

export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    let imageUrl = "";
    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    }

    const course = new Course({
      title,
      description,
      image: imageUrl,
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    if (title) course.title = title;
    if (description) course.description = description;
    if (req.file && req.file.path) course.image = req.file.path;

    await course.save();
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addTopicToCourse = async (req, res) => {
  try {
    const { title, order } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    course.topics.push({
      title,
      order: order || course.topics.length,
      subtopics: [],
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateTopicInCourse = async (req, res) => {
  try {
    const { title, order } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const topic = course.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    if (title !== undefined) topic.title = title;
    if (order !== undefined) topic.order = order;

    await course.save();
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteTopicFromCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    course.topics.pull({ _id: req.params.topicId });
    await course.save();
    res.json({ message: "Topic deleted successfully", course });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const addSubtopicToTopic = async (req, res) => {
  try {
    const { title, body, order } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const topic = course.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    topic.subtopics.push({
      title,
      body: body || "",
      order: order || topic.subtopics.length,
      images: getSubtopicImages(req.body.imageUrls, req.files),
      codeBlocks: parseCodeBlocks(req.body.codeBlocks),
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateSubtopicInTopic = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const topic = course.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    const subtopic = topic.subtopics.id(req.params.subtopicId);
    if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

    const { title, body, order, codeBlocks, imageUrls } = req.body;
    if (title !== undefined) subtopic.title = title;
    if (body !== undefined) subtopic.body = body;
    if (order !== undefined) subtopic.order = order;
    if (codeBlocks !== undefined) subtopic.codeBlocks = parseCodeBlocks(codeBlocks);
    if (imageUrls !== undefined || req.files?.length) {
      subtopic.images = getSubtopicImages(imageUrls, req.files);
    }

    await course.save();
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteSubtopicFromTopic = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const topic = course.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    const subtopic = topic.subtopics.id(req.params.subtopicId);
    if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

    topic.subtopics.pull({ _id: req.params.subtopicId });
    await course.save();
    res.json({ message: "Subtopic deleted successfully", course });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
