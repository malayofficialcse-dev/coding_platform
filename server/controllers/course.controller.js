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

export const addContentToCourse = async (req, res) => {
  try {
    const { title, body, order } = req.body;
    // Parse codeBlocks from FormData
    let codeBlocks = [];
    if (req.body["codeBlocks[0][language]"]) {
      // If only one code block
      if (!Array.isArray(req.body["codeBlocks[0][language]"])) {
        codeBlocks.push({
          language: req.body["codeBlocks[0][language]"],
          code: req.body["codeBlocks[0][code]"],
        });
      } else {
        // Multiple code blocks
        for (let i = 0; req.body[`codeBlocks[${i}][language]`]; i++) {
          codeBlocks.push({
            language: req.body[`codeBlocks[${i}][language]`],
            code: req.body[`codeBlocks[${i}][code]`],
          });
        }
      }
    }
    const images = req.files ? req.files.map((f) => f.path) : [];
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    course.contents.push({
      title,
      body,
      order,
      images,
      codeBlocks,
    });
    await course.save();
    res.json(course);
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

export const updateCourseContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { title, body, order } = req.body;

    // Parse codeBlocks from FormData or JSON
    let codeBlocks = [];
    if (req.body.codeBlocks && Array.isArray(req.body.codeBlocks)) {
      // If sent as array (JSON)
      codeBlocks = req.body.codeBlocks.filter(
        (cb) => cb.code && cb.code.trim() !== ""
      );
    } else if (req.body["codeBlocks[0][language]"]) {
      // If sent as FormData
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

    // Merge image URLs and uploaded files
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

    const content = course.contents.id(contentId);
    if (!content) return res.status(404).json({ error: "Content not found" });

    content.title = title;
    content.body = body;
    content.order = order;
    content.images = imageUrls;
    content.codeBlocks = codeBlocks;
    await course.save();
    res.json(content);
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
