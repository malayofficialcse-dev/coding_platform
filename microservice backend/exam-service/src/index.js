import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

import examRoutes from "./routes/exam.routes.js";
import attemptRoutes from "./routes/attempt.routes.js";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ service: "Exam & Attempt Service", status: "UP", port: PORT });
});

app.use("/api/exams", examRoutes);
app.use("/api/admin/exams", examRoutes);
app.use("/api/attempts", attemptRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Exam Service] Running on port ${PORT}`);
  });
});


