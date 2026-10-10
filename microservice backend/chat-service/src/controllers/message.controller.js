import User from "../models/User.js";
import Message from "../models/Message.js";
import { v2 as cloudinary } from "cloudinary";
import { getSocket } from "../lib/socket.js";
import { dispatchNotification } from "../utils/serviceClient.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user?._id || req.user?.id;
    const loggedInUser = await User.findById(loggedInUserId).select("following");
    const followings = loggedInUser?.following || [];

    const users = await User.find({ _id: { $in: followings } }).select(
      "_id name email username profileImage lastSeen"
    );

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
            ...user.toObject(),
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

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl || "",
    });

    await newMessage.save();
    await newMessage.populate("senderId", "name username profileImage");
    await newMessage.populate("receiverId", "name username profileImage");

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
