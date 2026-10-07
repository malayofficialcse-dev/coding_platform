import Course from "../models/Course.js";

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
    const { title, body, order, codeBlocks } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const topic = course.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    let parsedCodeBlocks = codeBlocks || [];
    if (typeof parsedCodeBlocks === "string") {
      try {
        parsedCodeBlocks = JSON.parse(parsedCodeBlocks);
      } catch (e) {
        parsedCodeBlocks = [];
      }
    }

    topic.subtopics.push({
      title,
      body: body || "",
      order: order || topic.subtopics.length,
      codeBlocks: parsedCodeBlocks,
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
