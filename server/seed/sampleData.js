import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "../models/Course.js";

dotenv.config();

const courses = [
  {
    title: "JavaScript Mastery",
    description: "Learn modern JS from scratch to advanced.",
    image:
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    contents: [],
  },
  {
    title: "Java for Beginners",
    description: "Solid foundation with OOP concepts and coding practice.",
    image:
      "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80",
    contents: [],
  },
  {
    title: "Python for Data Science",
    description: "Master Python with ML and AI applications.",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80",
    contents: [],
  },
];

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/online-exam")
  .then(async () => {
    await Course.deleteMany({});
    await Course.insertMany(courses);
    console.log("Sample courses inserted!");
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
