import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Microservice Target URLs (Configurable via Environment)
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:5001",
  user: process.env.USER_SERVICE_URL || "http://localhost:5002",
  post: process.env.POST_SERVICE_URL || "http://localhost:5003",
  exam: process.env.EXAM_SERVICE_URL || "http://localhost:5004",
  course: process.env.COURSE_SERVICE_URL || "http://localhost:5005",
  enrollment: process.env.ENROLLMENT_SERVICE_URL || "http://localhost:5006",
  coding: process.env.CODING_SERVICE_URL || "http://localhost:5007",
  notification: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5008",
  chat: process.env.CHAT_SERVICE_URL || "http://localhost:5009",
};

// 1. CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://code-campus-malay1.onrender.com",
  "https://code-campus-htg4.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow dev origins dynamically
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-role"],
  })
);

// 2. Logging
app.use(morgan("dev"));

// 3. Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again later." },
});
app.use(limiter);

// 4. Token Decoder & Header Enrichment Middleware
const enrichUserHeaders = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "kweu249hp72hf4fh48g7w9f4wpef74");
      req.headers["x-user-id"] = decoded.userId || decoded.id || "";
      req.headers["x-user-role"] = decoded.role || "user";
      req.headers["x-user-email"] = decoded.email || "";
    } catch (err) {
      // Invalid token, do not set user headers
    }
  }
  next();
};

app.use(enrichUserHeaders);

// 5. Health Check Endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    gateway: "Code Campus API Gateway",
    timestamp: new Date().toISOString(),
    services: SERVICES,
  });
});

// Helper to create proxy with header forwarding
const createServiceProxy = (target, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.headers["x-user-id"]) {
          proxyReq.setHeader("x-user-id", req.headers["x-user-id"]);
        }
        if (req.headers["x-user-role"]) {
          proxyReq.setHeader("x-user-role", req.headers["x-user-role"]);
        }
        if (req.headers["x-user-email"]) {
          proxyReq.setHeader("x-user-email", req.headers["x-user-email"]);
        }
      },
      error: (err, req, res) => {
        console.error(`[Gateway Proxy Error] Target: ${target}`, err.message);
        if (!res.headersSent) {
          res.status(503).json({
            error: "Service Temporarily Unavailable",
            targetService: target,
            details: err.message,
          });
        }
      },
    },
  });
};

// 6. Microservice Routes
app.use("/api/auth", createServiceProxy(SERVICES.auth));
app.use("/api/users", createServiceProxy(SERVICES.user));
app.use("/api/posts", createServiceProxy(SERVICES.post));
app.use("/api/admin/posts", createServiceProxy(SERVICES.post)); // Post dashboard / admin moderation
app.use("/api/exams", createServiceProxy(SERVICES.exam));
app.use("/api/attempts", createServiceProxy(SERVICES.exam));
app.use("/api/admin/exams", createServiceProxy(SERVICES.exam));
app.use("/api/courses", createServiceProxy(SERVICES.course));
app.use("/api/enrollments", createServiceProxy(SERVICES.enrollment));
app.use("/api/coding", createServiceProxy(SERVICES.coding));
app.use("/api/notifications", createServiceProxy(SERVICES.notification));
app.use("/api/messages", createServiceProxy(SERVICES.chat));

// 7. WebSocket Proxy for Socket.IO (/socket.io) to Chat/Socket Service
const wsProxy = createProxyMiddleware({
  target: SERVICES.chat,
  changeOrigin: true,
  ws: true,
});
app.use("/socket.io", wsProxy);

// 8. 404 Handler for Unmapped Gateway Routes
app.use((req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found on Gateway.` });
});

const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` 🚀 Code Campus API Gateway running on port ${PORT}`);
  console.log(` 🌐 Forwarding requests to 9 microservices`);
  console.log(`=================================================`);
});

// Support WebSocket Upgrade on HTTP Server
server.on("upgrade", wsProxy.upgrade);
