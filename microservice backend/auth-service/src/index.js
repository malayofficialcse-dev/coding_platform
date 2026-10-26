import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

import authRoutes from "./routes/auth.routes.js";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { validateAuthConfiguration } from "./controllers/auth.controller.js";

const app = express();
const PORT = process.env.PORT || 5001;
const allowedOrigins = (process.env.CLIENT_ORIGINS || [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://code-campus-malay1.onrender.com",
  "https://code-campus-htg4.vercel.app",
].join(",")).split(",").map((origin) => origin.trim()).filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
};

app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["API-Version"],
}));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(morgan("dev"));

// Health endpoint
app.get("/health", (req, res) => {
  res.json({ service: "Auth Service", status: "UP", port: PORT });
});

// Keep the legacy mount during the gradual API version migration.
app.use("/v1/auth", authRoutes);
app.use("/api/auth", authRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const start = async () => {
  validateAuthConfiguration();
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[Auth Service] Running on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error("[Auth Service Startup Error]:", error);
  process.exitCode = 1;
});
