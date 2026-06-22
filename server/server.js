import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import http from "http";
import connectDB from "./config/db.js";
// Routes 
import authRoutes from "./routes/auth.routes.js";
import examRoutes from "./routes/exams.routes.js";
import attemptRoutes from "./routes/attempt.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import courseRoutes from "./routes/course.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import codingRoutes from "./routes/coding.routes.js";
import postRoutes from "./routes/post.routes.js";
import userRoutes from "./routes/user.routes.js";
import { initSocket } from "./lib/socket.js";
import messageRoutes from "./routes/message.route.js";
import notificationRoutes from "./routes/notification.routes.js";


dotenv.config();
const app = express();
const server = http.createServer(app);
initSocket(server);


// CORS Configuration
// const corsOptions = {
//   origin: [
//     "https://code-campus-malay1.onrender.com",
//     "http://localhost:3000",
//     "http://localhost:5173",
//     "https://code-campus-htg4.vercel.app"
//   ],
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

// app.use(cors(corsOptions));


const corsOptions = {
  origin: [
    "https://code-campus-malay1.onrender.com",
    "https://code-campus-htg4.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));


// Middleware
// app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

// MongoDB connection
// mongoose
//   .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/online-exam")
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.error("MongoDB connection error:", err));

connectDB();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// Serve frontend for all other routes (for SPA)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../Frontend/dist")));

// Fallback for SPA routing
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/dist/index.html"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
