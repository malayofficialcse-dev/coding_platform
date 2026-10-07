import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import notificationRoutes from "./routes/notification.routes.js";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5008;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ service: "Notification Service", status: "UP", port: PORT });
});

app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Notification Service] Running on port ${PORT}`);
  });
});


