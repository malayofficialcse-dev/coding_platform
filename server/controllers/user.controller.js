import User from "../models/User.js";
import { getSocket } from "../lib/socket.js";
import { createNotification } from "./notification.controller.js";


export const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) return res.status(404).json({ error: "User not found" });

    if (currentUser.following.includes(targetUserId)) {
      return res.status(400).json({ error: "Already following" });
    }

    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    // Create notification
    const notification = await createNotification(
      targetUserId,
      currentUserId,
      "follow",
      {
        title: `${currentUser.name || currentUser.username} started following you`,
        description: "",
        actionUrl: `/profile/${currentUserId}`,
      }
    );

    // Emit real-time notification
    try {
      const io = getSocket();
      io.to(targetUserId.toString()).emit("newNotification", {
        notification: notification,
        type: "follow",
      });
    } catch (socketErr) {
      console.error("Socket error:", socketErr);
    }

    res.json({ message: "Following" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ error: "Cannot unfollow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) return res.status(404).json({ error: "User not found" });

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId
    );

    await currentUser.save();
    await targetUser.save();

    res.json({ message: "Unfollowed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate("followers", "name username profileImage")
    .populate("following", "name username profileImage");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
};

export const getAllUsers = async (req, res) => {
  try {
    // Just select the fields, don't populate
    const users = await User.find(
      {},
      "name username profileImage followers following"
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query required" });
    }

    const users = await User.find(
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { username: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      },
      "name username profileImage followers"
    ).limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
