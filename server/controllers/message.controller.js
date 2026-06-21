import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../config/cloudinary.js";
import { getReceiverSocketId, getIoInstance } from "../lib/socket.js";
import { createNotification } from "./notification.controller.js";

/**
 * GET /api/messages/users
 * users for chat sidebar (followings by default)
 */
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const loggedInUser = await User.findById(loggedInUserId).select("following");
    const followings = loggedInUser?.following || [];

    const users = await User.find({ _id: { $in: followings } }).select(
      "_id name email profileImage"
    );

    res.status(200).json(users);
  } catch (err) {
    console.error("getUsersForSidebar error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/messages/:id
 * conversation with user :id
 */
export const getMessages = async (req, res) => {
  try {
    const otherUserId = req.params.id;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "name username profileImage")
      .populate("receiverId", "name username profileImage");

    res.status(200).json(messages);
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/messages/send/:id
 * Sends a message to user with id in params.
 * Body: { text?: string, image?: base64String }
 *
 * Fixes:
 * - use receiverId from req.params.id when not provided in body
 * - create message using schema fields (senderId/receiverId)
 * - upload image (optional) to Cloudinary
 * - emit real-time newMessage to receiver socketId (if online)
 * - create & emit notification
 */
export const sendMessage = async (req, res) => {
  try {
    const paramReceiverId = req.params.id;
    const bodyReceiverId = req.body?.receiverId;
    const receiverId = paramReceiverId || bodyReceiverId;
    const { text, image } = req.body || {};
    const senderId = req.user._id;

    if (!receiverId || (!text && !image)) {
      return res.status(400).json({ error: "Missing receiver or message content" });
    }

    let imageUrl = "";
    if (image) {
      // image can be a base64 data URL or url - upload to cloudinary if base64
      if (image.startsWith("data:") || image.startsWith("data:image")) {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "code-campus/messages",
        });
        imageUrl = uploadResponse.secure_url;
      } else {
        imageUrl = image;
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl || "",
    });

    await newMessage.save();
    await newMessage.populate("senderId", "name username profileImage");
    await newMessage.populate("receiverId", "name username profileImage");

    // Emit realtime message + notification to receiver if they have a socket
    try {
      const io = getIoInstance();
      const receiverSocketId = getReceiverSocketId(String(receiverId));

      // Emit message event
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", { message: newMessage });
      }

      // Create notification (always create, receiver will see it in notifications)
      const notification = await createNotification(
        receiverId,
        senderId,
        "message",
        {
          message: newMessage._id,
          title: `${req.user.name || req.user.username} sent you a message`,
          description: (text || "").substring(0, 200),
          actionUrl: `/messages`,
        }
      );

      // Emit notification realtime
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newNotification", {
          notification,
          type: "message",
        });
      }
    } catch (socketErr) {
      // socket errors should not block the API response
      console.warn("Socket emit failed:", socketErr?.message || socketErr);
    }

    return res.status(201).json(newMessage);
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * DELETE /api/messages/:messageId
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message || message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Message.findByIdAndDelete(messageId);
    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("deleteMessage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/messages/conversations
 * return simple conversation list (other user, lastMessage, time)
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .populate("senderId", "name username profileImage")
      .populate("receiverId", "name username profileImage")
      .sort({ createdAt: -1 });

    const conversationsMap = new Map();
    messages.forEach((msg) => {
      const otherUser =
        msg.senderId._id.toString() === userId.toString() ? msg.receiverId : msg.senderId;
      const key = otherUser._id.toString();
      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          user: otherUser,
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
        });
      }
    });

    const conversations = Array.from(conversationsMap.values());
    res.json(conversations);
  } catch (err) {
    console.error("getConversations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};