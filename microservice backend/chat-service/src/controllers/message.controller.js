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

    const USER_SERVICE = process.env.USER_SERVICE_URL || "http://localhost:5002";
    const authHeaders = { "x-user-id": String(loggedInUserId) };

    let mutualUsers = [];

    // --- PRIMARY: fetch mutual follows, following, and followers ---
    try {
      const [mutualRes, followingRes, followersRes] = await Promise.allSettled([
        callService({
          baseURL: USER_SERVICE,
          path: `/api/social/${encodeURIComponent(loggedInUserId)}/mutual-follows`,
          headers: authHeaders,
        }),
        callService({
          baseURL: USER_SERVICE,
          path: `/api/social/${encodeURIComponent(loggedInUserId)}/following`,
          headers: authHeaders,
        }),
        callService({
          baseURL: USER_SERVICE,
          path: `/api/social/${encodeURIComponent(loggedInUserId)}/followers`,
          headers: authHeaders,
        }),
      ]);

      const mutualList = mutualRes.status === "fulfilled" && Array.isArray(mutualRes.value) ? mutualRes.value : [];
      const followingList = followingRes.status === "fulfilled" && Array.isArray(followingRes.value) ? followingRes.value : [];
      const followersList = followersRes.status === "fulfilled" && Array.isArray(followersRes.value) ? followersRes.value : [];

      // Combine with priority: mutuals first, then following, then followers
      const allConnected = [...mutualList, ...followingList, ...followersList];
      const map = new Map();
      for (const u of allConnected) {
        const id = String(u?.id || u?._id || "");
        if (id && id !== String(loggedInUserId) && !map.has(id)) {
          map.set(id, {
            id,
            _id: id,
            name: u.name || u.username || "User",
            username: u.username || "",
            profileImage: u.profileImage || "",
            bannerImage: u.bannerImage || "",
            role: u.role || "student",
            college: u.college || "",
          });
        }
      }
      mutualUsers = Array.from(map.values());
    } catch (lookupErr) {
      console.warn("[Chat] contacts lookup error:", lookupErr.message);
    }

    // --- FALLBACK B: load from existing conversation history ---
    if (!mutualUsers || mutualUsers.length === 0) {
      console.warn("[Chat] user-service unavailable; using conversation history");
      try {
        const conversations = await Conversation.find({
          participants: String(loggedInUserId),
          isGroup: false,
        }).lean();

        const otherIds = [
          ...new Set(
            conversations.flatMap((c) =>
              (c.participants || []).filter((p) => String(p) !== String(loggedInUserId))
            )
          ),
        ];

        if (otherIds.length) {
          try {
            const batch = await callService({
              baseURL: USER_SERVICE,
              path: "/api/users/batch",
              method: "POST",
              headers: authHeaders,
              data: { ids: otherIds },
            });
            if (batch?.users && Array.isArray(batch.users)) {
              mutualUsers = batch.users.map((u) => ({
                id: u.id || u._id,
                _id: u.id || u._id,
                name: u.name || u.username || "User",
                username: u.username || "",
                profileImage: u.profileImage || "",
                bannerImage: u.bannerImage || "",
                role: u.role || "student",
              }));
            }
          } catch {
            mutualUsers = otherIds.map((id) => ({
              id,
              _id: id,
              name: "User",
              username: "",
              profileImage: "",
              bannerImage: "",
              role: "student",
            }));
          }
        } else {
          mutualUsers = [];
        }
      } catch (convErr) {
        console.error("[Chat] conversation history fallback failed:", convErr.message);
        mutualUsers = [];
      }
    }

    // Deduplicate by id, exclude self
    const usersById = new Map();
    for (const user of mutualUsers) {
      const id = user?._id || user?.id;
      if (!id || String(id) === String(loggedInUserId)) continue;
      usersById.set(String(id), { ...user, _id: String(id) });
    }
    const users = Array.from(usersById.values());

    // Attach last message info from MongoDB
    const followingIds = users.map((u) => u._id);
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
    for (const msg of recentMessages) {
      const otherId =
        String(msg.senderId) === String(loggedInUserId)
          ? String(msg.receiverId)
          : String(msg.senderId);
      if (!latestByUser.has(otherId)) latestByUser.set(otherId, msg);
    }

    res.status(200).json(
      users
        .map((user) => {
          const lastMessage = latestByUser.get(String(user._id)) || null;
          return { ...user, lastMessage, lastChat: lastMessage?.createdAt || null };
        })
        .sort((a, b) => new Date(b.lastChat || 0) - new Date(a.lastChat || 0))
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
