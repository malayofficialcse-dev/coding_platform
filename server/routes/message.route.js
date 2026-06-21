// routes/message.route.js
import express from "express";
import { requireAuth } from "../middleware/auth.js"; // reuse your existing auth
import { getUsersForSidebar, getMessages, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", requireAuth, getUsersForSidebar);
router.get("/:id", requireAuth, getMessages);
router.post("/send/:id", requireAuth, sendMessage);

export default router;
