import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

import userRoutes from "./routes/user.routes.js";
import rbacRoutes from "./routes/rbac.routes.js";
import socialRoutes from "./routes/social.routes.js";
import { connectDB } from "./config/db.js";
import { verifyNeo4j } from "./lib/neo4j.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ service: "User Service", status: "UP", port: PORT });
});

app.use("/api/users", userRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/admin/rbac", rbacRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  await verifyNeo4j();
  app.listen(PORT, () => {
    console.log(`[User Service] Running on port ${PORT}`);
  });
};

startServer();
