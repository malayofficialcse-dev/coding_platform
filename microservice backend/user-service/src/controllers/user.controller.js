import User from "../models/User.js";
import { dispatchNotification } from "../utils/serviceClient.js";
import { deleteCached, getCached, setCached } from "../config/cache.js";

export const getAllUsers = async (req, res) => {
  try {
    const cacheKey = "users:directory";
    const cached = await getCached(cacheKey);
    if (cached) return res.json(cached);
    const users = await User.find({}, "name username email profileImage bannerImage followers following role");
    await setCached(cacheKey, users, 30);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("followers", "name username profileImage bannerImage")
      .populate("following", "name username profileImage bannerImage")
      .select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "Search query required" });

    const users = await User.find(
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { username: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      },
      "name username profileImage bannerImage followers following"
    ).limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id || req.user.id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) return res.status(404).json({ error: "Target user not found" });
    if (!currentUser) return res.status(404).json({ error: "Current user not found" });

    if (currentUser.following.includes(targetUserId)) {
      return res.status(400).json({ error: "Already following" });
    }

    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await currentUser.save();
    await targetUser.save();
    await deleteCached("users:directory");

    // Notify target user asynchronously via notification service
    await dispatchNotification({
      recipientId: targetUserId,
      senderId: currentUserId,
      type: "follow",
      title: `${currentUser.name || currentUser.username} started following you`,
      description: "",
      actionUrl: `/profile/${currentUserId}`,
    });

    res.json({ message: "Following", targetUserId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id || req.user.id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ error: "Cannot unfollow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) return res.status(404).json({ error: "Target user not found" });
    if (!currentUser) return res.status(404).json({ error: "Current user not found" });

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId.toString()
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await targetUser.save();
    await deleteCached("users:directory");

    res.json({ message: "Unfollowed", targetUserId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { name, college, degree, yearOfPassing } = req.body;

    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (name) user.name = name;
    if (college !== undefined) user.college = college;
    if (degree !== undefined) user.degree = degree;
    if (yearOfPassing !== undefined) user.yearOfPassing = yearOfPassing;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

