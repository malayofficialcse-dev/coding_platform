import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import postRoutes from "./routes/post.routes.js";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ service: "Post & Dashboard Service", status: "UP", port: PORT });
});

// Mount Routes
app.use("/api/posts", postRoutes);
app.use("/api/admin/posts", postRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Post Service] Running on port ${PORT}`);
  });
});


