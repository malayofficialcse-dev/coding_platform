import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import messageRoutes from "./routes/message.routes.js";
import { initSocket } from "./lib/socket.js";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5009;

// Initialize Socket.io on the HTTP server
initSocket(server);

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ service: "Chat & Real-time Messaging Service", status: "UP", port: PORT });
});

app.use("/api/messages", messageRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[Chat Service] Running on port ${PORT} with Socket.IO enabled`);
  });
});


