import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import courseRoutes from "./routes/course.routes.js";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ service: "Course Service", status: "UP", port: PORT });
});

app.use("/api/courses", courseRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Course Service] Running on port ${PORT}`);
  });
});


