import mongoose from "mongoose";

const codeBlockSchema = new mongoose.Schema({
  language: String,
  code: String,
});

const contentSchema = new mongoose.Schema({
  title: String,
  body: String,
  order: Number,
  images: [String], // array of Cloudinary URLs
  codeBlocks: [codeBlockSchema], // <-- array of objects
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  contents: [contentSchema],
  image: String, // main course image (optional)
});

export default mongoose.model("Course", courseSchema);
