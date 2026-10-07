import Notification from "../models/Notification.js";
import mongoose from "mongoose";

// Register minimal User, Post, Comment schemas so populate works if collections exist in DB
if (!mongoose.models.User) {
  mongoose.model("User", new mongoose.Schema({ name: String, username: String, email: String, profileImage: String }));
}
if (!mongoose.models.Post) {
  mongoose.model("Post", new mongoose.Schema({ text: String, images: [String] }));
}
if (!mongoose.models.Comment) {
  mongoose.model("Comment", new mongoose.Schema({ text: String, author: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }));
}

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "name email profileImage username")
      .populate("post", "text images")
      .populate("comment", "text author")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    await Notification.updateMany({ recipient: userId, read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Notification.findByIdAndDelete(notificationId);
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    await Notification.deleteMany({ recipient: userId });
    res.json({ message: "All notifications deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Internal endpoint for other microservices (Post, User, Chat) to trigger notifications
 */
export const createInternalNotification = async (req, res) => {
  try {
    const { recipient, sender, type, post, comment, message, title, description, actionUrl } = req.body;

    if (!recipient || !sender || !type || !title) {
      return res.status(400).json({ error: "Missing required notification fields" });
    }

    const notification = new Notification({
      recipient,
      sender,
      type,
      post: post || null,
      comment: comment || null,
      message: message || null,
      title,
      description: description || "",
      actionUrl: actionUrl || "",
    });

    await notification.save();
    res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error("[Internal Notification Error]:", err);
    res.status(500).json({ error: err.message });
  }
};
