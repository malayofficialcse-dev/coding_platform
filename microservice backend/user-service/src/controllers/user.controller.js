import { timingSafeEqual } from "node:crypto";
import User, { Op } from "../models/User.js";
import UserFollow from "../models/UserFollow.js";
import { runCypher } from "../lib/neo4j.js";
import { deleteCached, getCached, setCached } from "../config/cache.js";
export {
  followUser,
  unfollowUser,
  getConnectionTrail,
  getMutualConnections,
  getRecommendations,
  getUserNetworkStats,
} from "./social.controller.js";

export const getAllUsers = async (req, res) => {
  try {
    const cacheKey = "users:directory";
    const cached = await getCached(cacheKey);
    if (Array.isArray(cached)) {
      return res.json(cached.map(({ id, _id, name, username, profileImage, bannerImage, role, college, degree, yearOfPassing, followers }) => ({
        id,
        _id: _id || id,
        name,
        username,
        profileImage,
        bannerImage,
        role,
        college,
        degree,
        yearOfPassing,
        followers: Array.isArray(followers) ? followers : [],
      })));
    }
    // If cache had a bad value, clear it so it gets rebuilt
    if (cached !== null) await deleteCached(cacheKey);

    const users = await User.findAll({
      attributes: [
        "id",
        "name",
        "username",
        "profileImage",
        "bannerImage",
        "role",
        "college",
        "degree",
        "yearOfPassing",
      ],
      order: [["createdAt", "DESC"]],
    });

    // Build followers map from SQL (reliable, always up to date)
    const followersMap = {};
    try {
      const allFollows = await UserFollow.findAll({ attributes: ["followerId", "followingId"] });
      allFollows.forEach((r) => {
        const fId = String(r.followingId);
        if (!followersMap[fId]) followersMap[fId] = [];
        followersMap[fId].push(String(r.followerId));
      });
    } catch (sqlErr) {
      // Fallback to Neo4j if SQL fails
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
    }

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

export const syncAuthUserProfile = async (req, res) => {
  const configuredToken = process.env.INTERNAL_SERVICE_TOKEN || "";
  const suppliedToken = req.headers["x-internal-service-token"] || "";
  const expected = Buffer.from(configuredToken);
  const supplied = Buffer.from(String(suppliedToken));
  if (!configuredToken || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return res.status(403).json({ error: "Internal service authorization failed." });
  }

  try {
    const source = req.body?.profile;
    const id = typeof source?.id === "string" ? source.id.trim() : "";
    const email = typeof source?.email === "string" ? source.email.trim().toLowerCase() : "";
    const name = typeof source?.name === "string" ? source.name.trim() : "";
    if (!id || !email || !name) {
      return res.status(400).json({ error: "A profile id, name, and email are required." });
    }

    const profileFields = [
      "name",
      "username",
      "email",
      "role",
      "college",
      "degree",
      "yearOfPassing",
      "profileImage",
      "bannerImage",
      "isActive",
      "createdBy",
      "permissions",
      "googleId",
      "githubId",
      "authProvider",
    ];
    const profile = Object.fromEntries(
      profileFields
        .filter((field) => source[field] !== undefined)
        .map((field) => [field, source[field]])
    );
    profile.id = id;
    profile.email = email;

    let user = await User.findByPk(id);
    let created = false;
    if (user) {
      const identityFields = ["email", "role", "isActive", "googleId", "githubId", "authProvider"];
      const identity = Object.fromEntries(
        identityFields
          .filter((field) => profile[field] !== undefined)
          .map((field) => [field, profile[field]])
      );
      await user.update(identity);
    } else {
      const emailMatch = await User.findOne({ where: { email } });
      if (emailMatch) {
        return res.status(409).json({
          error: "A profile with this email already exists under a different user id.",
        });
      }
      user = await User.create(profile);
      created = true;
    }

    await deleteCached("users:directory");
    return res.status(created ? 201 : 200).json({ id: user.id, created });
  } catch (error) {
    console.error("[User Service] Auth profile sync failed:", error.message);
    return res.status(500).json({ error: "Could not synchronize the account profile." });
  }
};

export const getUsersBatch = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json({ users: [] });
    }
    const users = await User.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: [
        "id",
        "name",
        "username",
        "profileImage",
        "bannerImage",
        "role",
        "college",
        "degree",
      ],
    });
    res.json({ users: users.map((u) => u.toObject()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "name",
        "username",
        "profileImage",
        "bannerImage",
        "role",
        "college",
        "degree",
        "yearOfPassing",
      ],
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch followers and following from SQL (reliable)
    const [followerRows, followingRows] = await Promise.all([
      UserFollow.findAll({ where: { followingId: String(userId) }, attributes: ["followerId"] }),
      UserFollow.findAll({ where: { followerId: String(userId) }, attributes: ["followingId"] }),
    ]);

    const followerIds = followerRows.map((r) => r.followerId);
    const followingIds = followingRows.map((r) => r.followingId);

    const [followers, following] = await Promise.all([
      followerIds.length
        ? User.findAll({ where: { id: { [Op.in]: followerIds } }, attributes: ["id", "name", "username", "profileImage", "bannerImage"] })
        : [],
      followingIds.length
        ? User.findAll({ where: { id: { [Op.in]: followingIds } }, attributes: ["id", "name", "username", "profileImage", "bannerImage"] })
        : [],
    ]);

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
