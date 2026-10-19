import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { v2 as cloudinary } from "cloudinary";
import { getSocket } from "../lib/socket.js";
import { callService, dispatchNotification } from "../utils/serviceClient.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user?._id || req.user?.id;
    if (!loggedInUserId) {
      return res.status(401).json({ error: "Authentication is required." });
    }

    let mutualUsers;
    try {
      const userService = {
        baseURL: process.env.USER_SERVICE_URL || "http://localhost:5002",
        headers: { "x-user-id": String(loggedInUserId) },
      };
      // Only mutual follows are allowed to start a chat.
      const [following, followers] = await Promise.all([
        callService({
          ...userService,
          path: `/api/social/${encodeURIComponent(loggedInUserId)}/following`,
        }),
        callService({
          ...userService,
          path: `/api/social/${encodeURIComponent(loggedInUserId)}/followers`,
        }),
      ]);
      if (!Array.isArray(following) || !Array.isArray(followers)) {
        throw new Error("The user service returned an invalid contacts response.");
      }
      const followerIds = new Set(
        followers
          .map((user) => user?._id || user?.id)
          .filter(Boolean)
          .map(String)
      );
      mutualUsers = following.filter((user) => {
        const id = user?._id || user?.id;
        return id && followerIds.has(String(id));
      });
    } catch (err) {
      console.error("getUsersForSidebar user service error:", err.message);
      return res.status(503).json({
        error: "Unable to load chat contacts. Please try again later.",
      });
    }

    if (!Array.isArray(mutualUsers)) {
      console.error("getUsersForSidebar received an invalid mutual contacts list");
      return res.status(502).json({
        error: "The user service returned an invalid contacts response.",
      });
    }

    const usersById = new Map();
    for (const user of mutualUsers) {
      const id = user?._id || user?.id;
      if (!id || String(id) === String(loggedInUserId)) continue;
      usersById.set(String(id), { ...user, _id: String(id) });
    }
    const users = Array.from(usersById.values());

    const followingIds = users.map((user) => user._id);
    const recentMessages = followingIds.length
      ? await Message.find({
          $or: [
            { senderId: loggedInUserId, receiverId: { $in: followingIds } },
            { receiverId: loggedInUserId, senderId: { $in: followingIds } },
          ],
        })
          .sort({ createdAt: -1 })
          .select("senderId receiverId text image createdAt")
          .lean()
      : [];

    const latestByUser = new Map();
    for (const message of recentMessages) {
      const otherUserId =
        String(message.senderId) === String(loggedInUserId)
          ? String(message.receiverId)
          : String(message.senderId);
      if (!latestByUser.has(otherUserId)) latestByUser.set(otherUserId, message);
    }

    res.status(200).json(
      users
        .map((user) => {
          const lastMessage = latestByUser.get(String(user._id)) || null;
          return {
            ...user,
            lastMessage,
            lastChat: lastMessage?.createdAt || null,
          };
        })
        .sort(
          (first, second) =>
            new Date(second.lastChat || 0) - new Date(first.lastChat || 0)
        )
    );
  } catch (err) {
    console.error("getUsersForSidebar error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const otherUserId = req.params.id;
    const myId = req.user?._id || req.user?.id;

    const messages = await Message.find({
      $or: [
        { senderId: String(myId), receiverId: String(otherUserId) },
        { senderId: String(otherUserId), receiverId: String(myId) },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const paramReceiverId = req.params.id;
    const bodyReceiverId = req.body?.receiverId;
    const receiverId = paramReceiverId || bodyReceiverId;
    const { text, image } = req.body || {};
    const senderId = req.user?._id || req.user?.id;

    if (!receiverId || (!text && !image)) {
      return res.status(400).json({ error: "Missing receiver or message content" });
    }

    let imageUrl = "";
    if (image) {
      if (image.startsWith("data:") || image.startsWith("data:image")) {
        const cloudinaryConfig = {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        };
        if (Object.values(cloudinaryConfig).some((value) => !value)) {
          return res.status(503).json({
            error: "Image uploads are not configured on the server.",
          });
        }

        cloudinary.config(cloudinaryConfig);
        try {
          const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: "code-campus/messages",
          });
          imageUrl = uploadResponse.secure_url;
        } catch (uploadError) {
          console.error("Cloudinary message image upload failed:", uploadError);
          return res.status(502).json({
            error: "Image upload failed.",
            details: uploadError.message,
          });
        }
      } else {
        imageUrl = image;
      }
    }

    // Find or create conversation
    let conv = await Conversation.findOne({
      participants: { $all: [String(senderId), String(receiverId)] },
      isGroup: false,
    });
    if (!conv) {
      conv = new Conversation({
        participants: [String(senderId), String(receiverId)],
      });
    }

    const newMessage = new Message({
      senderId: String(senderId),
      receiverId: String(receiverId),
      conversationId: conv._id,
      text: text || "",
      image: imageUrl || "",
    });

    await newMessage.save();

    conv.lastMessage = newMessage._id;
    conv.lastMessageAt = new Date();
    await conv.save();

    // Real-time socket emission
    try {
      getSocket()
        .to(receiverId.toString())
        .emit("newMessage", { message: newMessage });
    } catch (socketErr) {
      console.warn("Socket emission error:", socketErr.message);
    }

    // Dispatch notification
    await dispatchNotification({
      recipientId: receiverId,
      senderId,
      type: "message",
      senderName: req.user?.name || req.user?.username || "Someone",
      senderAvatar: req.user?.profileImage || "",
      message: newMessage._id,
      title: `${req.user?.name || req.user?.username || "Someone"} sent you a message`,
      description: text ? text.substring(0, 80) : "Sent an attachment",
      actionUrl: `/messages`,
    });

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ error: "Failed to send message", details: err.message });
  }
};
