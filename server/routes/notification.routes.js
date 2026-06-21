import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/:notificationId/read", markAsRead);
router.put("/mark-all-as-read", markAllAsRead);
router.delete("/:notificationId", deleteNotification);
router.delete("/", deleteAllNotifications);

export default router;