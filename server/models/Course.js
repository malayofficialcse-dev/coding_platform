import mongoose from "mongoose";

const codeBlockSchema = new mongoose.Schema({
  language: String,
  code: String,
});

const subtopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: String,
  order: { type: Number, default: 0 },
  images: [String], // array of Cloudinary URLs
  codeBlocks: [codeBlockSchema], // array of code block objects
});

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  subtopics: [subtopicSchema], // array of subtopic objects
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  image: String, // main course image (optional)
  topics: [topicSchema], // array of topic objects
});

export default mongoose.model("Course", courseSchema);

