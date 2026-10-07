import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import codingRoutes from "./routes/coding.routes.js";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5007;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ service: "Coding & Judge Service", status: "UP", port: PORT });
});

app.use("/api/coding", codingRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Coding Service] Running on port ${PORT}`);
  });
});


