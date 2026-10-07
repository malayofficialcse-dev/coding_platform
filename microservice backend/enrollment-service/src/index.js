import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5006;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ service: "Enrollment Service", status: "UP", port: PORT });
});

app.use("/api/enrollments", enrollmentRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Enrollment Service] Running on port ${PORT}`);
  });
});


