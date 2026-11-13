import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";
import { getServices } from "./config/services.js";
import { mountGraphQL } from "./graphql/index.js";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.API_GATEWAY_PORT || 5100;

const SERVICES = getServices();
const isProduction =
  process.env.RENDER === "true" ||
  (process.env.APP_ENV || process.env.NODE_ENV || "local").toLowerCase() === "production";
const serviceReadiness = new Map(
  Object.values(SERVICES).map((url) => [url, !isProduction])
);
const SERVICE_READY_WAIT_MS = 80 * 1000;
const trustProxy = process.env.TRUST_PROXY === "true" || process.env.RENDER === "true";
app.set("trust proxy", trustProxy ? 1 : false);

// ---- Redis Client (graceful: works without Redis too) ----
let redis = null;
try {
  redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    // Redis is optional for the gateway. Do not let an unavailable cache
    // prevent the HTTP server (and Render health check) from starting.
    retryStrategy: () => null,
  });
  redis.on("error", (err) => {
    console.warn("[Gateway Redis] Connection error:", err.message, "— falling back to in-memory rate limiting");
  });
  await redis.connect().catch(() => {
    redis = null;
  });
  if (redis) console.log("[Gateway Redis] Connected ✓");
} catch {
  redis = null;
  console.warn("[Gateway Redis] Unavailable — using in-memory rate limiting");
}

// 1. CORS Configuration
const allowedOrigins = (process.env.CLIENT_ORIGINS || [
  "http://localhost:3000",
  "http://192.168.1.5:5173",
  "http://172.28.32.1:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://code-campus-malay1.onrender.com",
  "https://code-campus-htg4.vercel.app",
  "https://coding-platform-bsrk.vercel.app",
  "https://codecampus-eosin.vercel.app",
  "https://coding-platform-bsrk-rczw8coba-malaymaity1s-projects.vercel.app"
].join(",")).split(",").map((origin) => origin.trim()).filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: [
      "API-Version",
      "X-Has-More",
      "X-Total-Count",
      "X-Page",
      "X-Page-Size",
      "x-has-more",
      "x-total-count",
      "x-page",
      "x-page-size",
    ],
  })
);

app.use("/v1", (_req, res, next) => {
  res.set("API-Version", "1");
  next();
});

// 2. Logging
app.use(morgan("dev"));

// 3. Global Rate Limiter — Redis-backed, falls back to memory if Redis unavailable
const limiterConfig = {
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again later." },
};

if (redis) {
  limiterConfig.store = new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  });
}

const limiter = rateLimit(limiterConfig);
app.use(limiter);
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  ...(redis && {
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: "rl:auth:",
    }),
  }),
  message: { error: "Too many authentication requests. Try again later." },
});
app.use("/api/auth", authLimiter);
app.use("/v1/auth", authLimiter);

await mountGraphQL(app);

// 5. Health Check Endpoint
app.get("/health", (req, res) => {
  const readyServices = Object.fromEntries(
    Object.entries(SERVICES).map(([name, url]) => [name, serviceReadiness.get(url) === true])
  );
  res.json({
    status: "healthy",
    gateway: "Code Campus API Gateway",
    timestamp: new Date().toISOString(),
    services: SERVICES,
    readyServices,
    allServicesReady: Object.values(readyServices).every(Boolean),
  });
});

const waitForServiceReady = async (target) => {
  const deadline = Date.now() + SERVICE_READY_WAIT_MS;
  while (!serviceReadiness.get(target) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return serviceReadiness.get(target) === true;
};

// Pre-build one proxy instance per service target — avoids MaxListeners leak
// and allows Render free-tier cold-start (services can take 50+ s to wake up).
const proxyCache = new Map();
const createServiceProxy = (target) => {
  if (proxyCache.has(target)) return proxyCache.get(target);
  const proxy = createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
    // 90 s lets a Render free instance fully cold-start before we give up
    proxyTimeout: 90000,
    timeout: 90000,
    on: {
      proxyRes: (proxyRes) => {
        for (const headerName of Object.keys(proxyRes.headers)) {
          if (headerName.startsWith("access-control-")) {
            delete proxyRes.headers[headerName];
          }
        }
      },
      error: (err, req, res) => {
        console.error(`[Gateway Proxy Error] Target: ${target}`, err.message);
        if (!res.headersSent) {
          // ECONNREFUSED / ETIMEDOUT → service is cold-starting on Render free tier
          const isColdStart =
            err.code === "ECONNREFUSED" ||
            err.code === "ETIMEDOUT" ||
            err.code === "ECONNRESET" ||
            /timeout|ECONNREFUSED|ECONNRESET/i.test(err.message);
          if (isColdStart) {
            res.set("Retry-After", "30");
            res.status(503).json({
              error: "Service is warming up",
              message: "The service is starting up on Render free tier. Please retry in ~30 seconds.",
              retryAfter: 30,
            });
          } else {
            res.status(502).json({
              error: "Service Temporarily Unavailable",
              targetService: target,
              details: err.message,
            });
          }
        }
      },
    },
  });
  const readyProxy = (req, res, next) => {
    if (!isProduction || serviceReadiness.get(target)) {
      return proxy(req, res, next);
    }

    waitForServiceReady(target)
      .then((isReady) => {
        if (res.destroyed) return;
        if (!isReady) {
          res.set("Retry-After", "30");
          res.status(503).json({
            error: "Service is starting",
            message: "The requested service is not ready yet. Please retry in 30 seconds.",
            retryAfter: 30,
          });
          return;
        }
        proxy(req, res, next);
      })
      .catch(next);
  };
  proxyCache.set(target, readyProxy);
  return readyProxy;
};

// 6. Microservice Routes
app.use("/api/auth", createServiceProxy(SERVICES.auth));
app.use("/v1/auth", createServiceProxy(SERVICES.auth));
app.use("/api/users", createServiceProxy(SERVICES.user));
app.use("/v1/users", createServiceProxy(SERVICES.user));
app.use("/api/social", createServiceProxy(SERVICES.user));
app.use("/v1/social", createServiceProxy(SERVICES.user));
app.use("/api/mentor", createServiceProxy(SERVICES.mentor));
app.use("/v1/mentor", createServiceProxy(SERVICES.mentor));
app.use("/api/admin/rbac", createServiceProxy(SERVICES.user)); // RBAC admin endpoints
app.use("/v1/admin/rbac", createServiceProxy(SERVICES.user));
app.use("/api/posts", createServiceProxy(SERVICES.post));
app.use("/v1/posts", createServiceProxy(SERVICES.post));
app.use("/api/admin/posts", createServiceProxy(SERVICES.post));
app.use("/v1/admin/posts", createServiceProxy(SERVICES.post));
app.use("/api/exams", createServiceProxy(SERVICES.exam));
app.use("/v1/exams", createServiceProxy(SERVICES.exam));
app.use("/api/attempts", createServiceProxy(SERVICES.exam));
app.use("/v1/attempts", createServiceProxy(SERVICES.exam));
app.use("/api/admin/exams", createServiceProxy(SERVICES.exam));
app.use("/v1/admin/exams", createServiceProxy(SERVICES.exam));
app.use("/api/courses", createServiceProxy(SERVICES.course));
app.use("/v1/courses", createServiceProxy(SERVICES.course));
app.use("/api/enrollments", createServiceProxy(SERVICES.enrollment));
app.use("/v1/enrollments", createServiceProxy(SERVICES.enrollment));
app.use("/api/coding", createServiceProxy(SERVICES.coding));
app.use("/v1/coding", createServiceProxy(SERVICES.coding));
app.use("/api/notifications", createServiceProxy(SERVICES.notification));
app.use("/v1/notifications", createServiceProxy(SERVICES.notification));
app.use("/api/messages", createServiceProxy(SERVICES.chat));
app.use("/v1/messages", createServiceProxy(SERVICES.chat));

// AI Service — RAG Chatbot
app.use("/api/ai", createServiceProxy(SERVICES.ai));
app.use("/v1/ai", createServiceProxy(SERVICES.ai));

// 7. WebSocket Proxy for Socket.IO (/socket.io) to Chat/Socket Service
const wsProxy = createProxyMiddleware({
  target: SERVICES.chat,
  changeOrigin: true,
  ws: true,
  // Express strips the mount prefix from req.url, so restore the full path
  // Socket.IO expects when proxying both polling and websocket requests.
  pathRewrite: (_path, req) => req.originalUrl || req.url,
  // Allow Render cold-start for Socket.IO polling too.
  proxyTimeout: 90000,
  timeout: 90000,
  on: {
    error: (err, req, res) => {
      console.error("[Gateway Socket.IO Proxy Error]", err.message);
      // During an HTTP polling handshake we can return a retryable response.
      // For an upgraded WebSocket, the response is already committed; close
      // the socket so Socket.IO can reconnect with its backoff policy.
      if (res && !res.headersSent) {
        res.setHeader("Retry-After", "10");
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Chat service is temporarily unavailable", retryAfter: 10 }));
      } else if (res?.destroy) {
        res.destroy();
      }
    },
  },
});
app.use("/socket.io", wsProxy);

const mentorWsProxy = createProxyMiddleware({
  target: SERVICES.mentor,
  changeOrigin: true,
  ws: true,
  pathRewrite: (_path, req) => req.originalUrl,
  proxyTimeout: 90000,
  timeout: 90000,
});
app.use("/mentor-socket.io", mentorWsProxy);

// 8. 404 Handler for Unmapped Gateway Routes
app.use((req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found on Gateway.` });
});

const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` 🚀 Code Campus API Gateway running on port ${PORT}`);
  console.log(` 🔀 Forwarding requests to 11 microservices`);
  console.log(`=================================================`);
});

// ── Keep-Alive Pinger ───────────────────────────────────────────────────────
// Render free instances sleep after inactivity. Retry unavailable services
// frequently until they wake, then keep healthy services warm.
if (isProduction) {
  const http = await import("http");
  const https = await import("https");
  const healthyPingInterval = 4 * 60 * 1000;
  const retryPingInterval = 30 * 1000;

  const pingService = (name, url) => {
    const ping = () => {
      try {
        const target = new URL(`${url}/health`);
        const lib = target.protocol === "https:" ? https : http;
        const req = lib.request(
          { hostname: target.hostname, path: target.pathname, method: "GET", timeout: 60000 },
          (res) => {
            res.resume();
            const isHealthy = res.statusCode >= 200 && res.statusCode < 300;
            serviceReadiness.set(url, isHealthy);
            console.log(`[Gateway Pinger] ${name} → ${res.statusCode}`);
            const timer = setTimeout(ping, isHealthy ? healthyPingInterval : retryPingInterval);
            timer.unref();
          }
        );
        req.on("timeout", () => req.destroy(new Error("Health check timed out")));
        req.on("error", (err) => {
          serviceReadiness.set(url, false);
          console.warn(`[Gateway Pinger] ${name} ping failed:`, err.message);
          const timer = setTimeout(ping, retryPingInterval);
          timer.unref();
        });
        req.end();
      } catch (err) {
        serviceReadiness.set(url, false);
        console.warn(`[Gateway Pinger] ${name} bad URL:`, err.message);
        const timer = setTimeout(ping, retryPingInterval);
        timer.unref();
      }
    };

    ping();
  };

  Object.entries(SERVICES).forEach(([name, url]) => {
    if (url) pingService(name, url);
  });
  console.log("[Gateway Pinger] Keep-alive enabled — retrying unavailable services every 30s");
}

    // Support WebSocket Upgrade on HTTP Server
    server.on("upgrade", (req, socket, head) => {
      if (req.url?.startsWith("/mentor-socket.io")) return mentorWsProxy.upgrade(req, socket, head);
      if (req.url?.startsWith("/socket.io")) return wsProxy.upgrade(req, socket, head);
      socket.destroy();
    });
