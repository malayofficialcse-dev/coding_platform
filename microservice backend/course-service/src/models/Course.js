import mongoose from "mongoose";

const codeBlockSchema = new mongoose.Schema({
  language: { type: String, default: "javascript" },
  code: { type: String, default: "" },
});

const subtopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, default: "" },
  codeBlocks: [codeBlockSchema],
  order: { type: Number, default: 0 },
});

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  subtopics: [subtopicSchema],
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    topics: [topicSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Course || mongoose.model("Course", courseSchema);
