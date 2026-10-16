import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const notifications = await Notification.find({ recipient: String(userId) })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const unreadCount = await Notification.countDocuments({
      recipient: String(userId),
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
    const userId = req.user?._id || req.user?.id || req.headers["x-user-id"];

    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    if (String(notification.recipient) !== String(userId)) {
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
    const userId = req.user?._id || req.user?.id || req.headers["x-user-id"];
    await Notification.updateMany({ recipient: String(userId), read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?._id || req.user?.id || req.headers["x-user-id"];

    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    if (String(notification.recipient) !== String(userId)) {
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
    const userId = req.user?._id || req.user?.id || req.headers["x-user-id"];
    await Notification.deleteMany({ recipient: String(userId) });
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
    const {
      recipient,
      sender,
      senderName,
      senderAvatar,
      type,
      post,
      comment,
      message,
      refPostId,
      refCommentId,
      refMessageId,
      title,
      description,
      actionUrl,
    } = req.body;

    if (!recipient || !sender || !type || !title) {
      return res.status(400).json({ error: "Missing required notification fields" });
    }

    const notification = new Notification({
      recipient: String(recipient),
      sender: String(sender),
      senderName: senderName || "",
      senderAvatar: senderAvatar || "",
      type,
      post: post || refPostId || null,
      comment: comment || refCommentId || null,
      message: message || refMessageId || null,
      refPostId: refPostId || post || null,
      refCommentId: refCommentId || comment || null,
      refMessageId: refMessageId || message || null,
      title,
      description: description || "",
      actionUrl: actionUrl || "",
      deliveredAt: new Date(),
    });

    await notification.save();
    res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error("[Internal Notification Error]:", err);
    res.status(500).json({ error: err.message });
  }
};
