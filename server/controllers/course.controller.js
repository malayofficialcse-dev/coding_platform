import Course from "../models/Course.js";

export const createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    let imageUrl = "";
    if (req.file && req.file.path) {
      imageUrl = req.file.path; // Cloudinary URL
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
// ...existing code...

// Get all courses (public)
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single course with contents (public)
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
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
      order: order || 0,
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

    let codeBlocks = [];
    if (req.body["codeBlocks[0][language]"]) {
      if (!Array.isArray(req.body["codeBlocks[0][language]"])) {
        codeBlocks.push({
          language: req.body["codeBlocks[0][language]"],
          code: req.body["codeBlocks[0][code]"],
        });
      } else {
        for (let i = 0; req.body[`codeBlocks[${i}][language]`]; i++) {
          codeBlocks.push({
            language: req.body[`codeBlocks[${i}][language]`],
            code: req.body[`codeBlocks[${i}][code]`],
          });
        }
      }
    } else if (req.body.codeBlocks) {
      if (typeof req.body.codeBlocks === "string") {
        try {
          codeBlocks = JSON.parse(req.body.codeBlocks);
        } catch (e) {}
      } else if (Array.isArray(req.body.codeBlocks)) {
        codeBlocks = req.body.codeBlocks;
      }
    }

    const images = req.files ? req.files.map((f) => f.path) : [];

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const topic = course.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    topic.subtopics.push({
      title,
      body,
      order: order || 0,
      images,
      codeBlocks,
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
// ...existing code...

// Delete course (admin)
export const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSubtopicInTopic = async (req, res) => {
  try {
    const { title, body, order } = req.body;

    let codeBlocks = [];
    if (req.body.codeBlocks) {
      if (typeof req.body.codeBlocks === "string") {
        try {
          codeBlocks = JSON.parse(req.body.codeBlocks);
        } catch (e) {}
      } else if (Array.isArray(req.body.codeBlocks)) {
        codeBlocks = req.body.codeBlocks.filter(
          (cb) => cb.code && cb.code.trim() !== ""
        );
      }
    } else if (req.body["codeBlocks[0][language]"]) {
      if (!Array.isArray(req.body["codeBlocks[0][language]"])) {
        codeBlocks.push({
          language: req.body["codeBlocks[0][language]"],
          code: req.body["codeBlocks[0][code]"],
        });
      } else {
        for (let i = 0; req.body[`codeBlocks[${i}][language]`]; i++) {
          codeBlocks.push({
            language: req.body[`codeBlocks[${i}][language]`],
            code: req.body[`codeBlocks[${i}][code]`],
          });
        }
      }
    }

    let imageUrls = [];
    if (req.body.images) {
      if (Array.isArray(req.body.images)) {
        imageUrls = req.body.images.filter((img) => !!img);
      } else if (
        typeof req.body.images === "string" &&
        req.body.images.trim() !== ""
      ) {
        imageUrls = [req.body.images];
      }
    }
    if (req.files && req.files.length > 0) {
      imageUrls = imageUrls.concat(req.files.map((f) => f.path));
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const topic = course.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    const subtopic = topic.subtopics.id(req.params.subtopicId);
    if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

    if (title !== undefined) subtopic.title = title;
    if (body !== undefined) subtopic.body = body;
    if (order !== undefined) subtopic.order = order;
    subtopic.images = imageUrls;
    subtopic.codeBlocks = codeBlocks;

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

    topic.subtopics.pull({ _id: req.params.subtopicId });
    await course.save();
    res.json({ message: "Subtopic deleted successfully", course });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const update = {
      title: req.body.title,
      description: req.body.description,
    };
    // If image file uploaded, use Cloudinary URL
    if (req.file && req.file.path) {
      update.image = req.file.path;
    } else if (req.body.image) {
      update.image = req.body.image;
    }
    const course = await Course.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getCoursesByUser = async (req, res) => {
  try {
    const courses = await Course.find({ author: req.params.id });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
