import User, { Op } from "../models/User.js";
import { runCypher } from "../lib/neo4j.js";
import { deleteCached, getCached, setCached } from "../config/cache.js";
export { followUser, unfollowUser } from "./social.controller.js";

export const getAllUsers = async (req, res) => {
  try {
    const cacheKey = "users:directory";
    const cached = await getCached(cacheKey);
    if (cached) return res.json(cached);

    const users = await User.findAll({
      attributes: [
        "id",
        "name",
        "username",
        "email",
        "profileImage",
        "bannerImage",
        "role",
        "college",
        "degree",
        "yearOfPassing",
      ],
      order: [["createdAt", "DESC"]],
    });

    const followersMap = {};
    try {
      const followResult = await runCypher(
        `MATCH (f:User)-[:FOLLOWS]->(u:User) RETURN f.id AS followerId, u.id AS followedId`
      );
      if (followResult?.records) {
        followResult.records.forEach((r) => {
          const followed = r.get("followedId");
          const follower = r.get("followerId");
          if (!followersMap[followed]) followersMap[followed] = [];
          followersMap[followed].push(follower);
        });
      }
    } catch {}

    const userList = users.map((u) => {
      const obj = u.toObject();
      obj.followers = followersMap[obj.id] || [];
      return obj;
    });
    await setCached(cacheKey, userList, 15);
    res.json(userList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch followers and following from Neo4j
    let followerIds = [];
    let followingIds = [];
    try {
      const followersResult = await runCypher(
        `MATCH (f:User)-[:FOLLOWS]->(u:User {id: $userId}) RETURN f.id AS id`,
        { userId: String(userId) }
      );
      followerIds = followersResult.records.map((r) => r.get("id"));

      const followingResult = await runCypher(
        `MATCH (u:User {id: $userId})-[:FOLLOWS]->(f:User) RETURN f.id AS id`,
        { userId: String(userId) }
      );
      followingIds = followingResult.records.map((r) => r.get("id"));
    } catch (neoErr) {
      console.warn("[Social Graph Query Warning]:", neoErr.message);
    }

    const followers = followerIds.length
      ? await User.findAll({
          where: { id: { [Op.in]: followerIds } },
          attributes: ["id", "name", "username", "profileImage", "bannerImage"],
        })
      : [];

    const following = followingIds.length
      ? await User.findAll({
          where: { id: { [Op.in]: followingIds } },
          attributes: ["id", "name", "username", "profileImage", "bannerImage"],
        })
      : [];

    const userData = user.toObject();
    userData.followers = followers;
    userData.following = following;
    userData.followersCount = followers.length;
    userData.followingCount = following.length;

    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "Search query required" });

    const searchPattern = `%${query}%`;
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: searchPattern } },
          { username: { [Op.iLike]: searchPattern } },
          { email: { [Op.iLike]: searchPattern } },
        ],
      },
      attributes: ["id", "name", "username", "profileImage", "bannerImage", "role"],
      limit: 20,
    });

    res.json(users.map((u) => u.toObject()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { name, college, degree, yearOfPassing, bannerImage, profileImage } = req.body;

    const user = await User.findByPk(currentUserId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (name) user.name = name;
    if (college !== undefined) user.college = college;
    if (degree !== undefined) user.degree = degree;
    if (yearOfPassing !== undefined) user.yearOfPassing = yearOfPassing;
    if (bannerImage !== undefined) user.bannerImage = bannerImage;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();
    await deleteCached("users:directory");
    res.json({ message: "Profile updated successfully", user: user.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
