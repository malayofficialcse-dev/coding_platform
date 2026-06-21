import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Post from "../models/Post.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
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
    const userId = req.user._id;
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
    const userId = req.user._id;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification || notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);

    if (!notification || notification.recipient.toString() !== userId.toString()) {
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
    const userId = req.user._id;

    await Notification.deleteMany({ recipient: userId });
    res.json({ message: "All notifications deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createNotification = async (
  recipientId,
  senderId,
  type,
  data
) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      post: data.post || null,
      comment: data.comment || null,
      message: data.message || null,
      title: data.title,
      description: data.description,
      actionUrl: data.actionUrl,
    });

    await notification.save();
    return notification;
  } catch (err) {
    console.error("Error creating notification:", err);
  }
};