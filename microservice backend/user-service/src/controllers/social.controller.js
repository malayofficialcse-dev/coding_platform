import { runCypher } from "../lib/neo4j.js";
import User, { Op } from "../models/User.js";
import { dispatchNotification } from "../utils/serviceClient.js";
import { deleteCached } from "../config/cache.js";

export const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user?._id || req.user?.id;

    if (String(targetUserId) === String(currentUserId)) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    let targetUser = await User.findByPk(targetUserId);
    let currentUser = await User.findByPk(currentUserId);

    if (!currentUser && req.user?.email) {
      currentUser = await User.findOne({ where: { email: req.user.email.toLowerCase().trim() } });
    }
    if (!currentUser && currentUserId) {
      try {
        currentUser = await User.create({
          id: currentUserId,
          name: req.user?.name || "Student",
          username: req.user?.username || `user_${currentUserId.slice(0, 6)}`,
          email: req.user?.email || `${currentUserId}@example.com`,
          role: req.user?.role || "student",
          permissions: req.user?.permissions || {},
        });
      } catch {}
    }

    if (!targetUser) return res.status(404).json({ error: "Target user not found" });
    if (!currentUser) return res.status(404).json({ error: "Current user not found" });

    // Neo4j graph follow
    try {
      await runCypher(
        `MERGE (a:User {id: $currentUserId})
         MERGE (b:User {id: $targetUserId})
         MERGE (a)-[r:FOLLOWS]->(b)
         ON CREATE SET r.createdAt = datetime()`,
        { currentUserId: String(currentUserId), targetUserId: String(targetUserId) }
      );
    } catch (neoErr) {
      console.warn("[Social Neo4j Warning]:", neoErr.message);
    }

    await deleteCached("users:directory");

    // Send notification
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
    const currentUserId = req.user?._id || req.user?.id;

    if (String(targetUserId) === String(currentUserId)) {
      return res.status(400).json({ error: "Cannot unfollow yourself" });
    }

    try {
      await runCypher(
        `MATCH (a:User {id: $currentUserId})-[r:FOLLOWS]->(b:User {id: $targetUserId})
         DELETE r`,
        { currentUserId: String(currentUserId), targetUserId: String(targetUserId) }
      );
    } catch (neoErr) {
      console.warn("[Social Neo4j Warning]:", neoErr.message);
    }

    await deleteCached("users:directory");
    res.json({ message: "Unfollowed", targetUserId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;
    let followerIds = [];

    try {
      const result = await runCypher(
        `MATCH (f:User)-[:FOLLOWS]->(u:User {id: $userId})
         RETURN f.id AS id`,
        { userId: String(userId) }
      );
      followerIds = result.records.map((r) => r.get("id"));
    } catch (neoErr) {
      console.warn("[Social Neo4j Warning]:", neoErr.message);
    }

    const followers = followerIds.length
      ? await User.findAll({
          where: { id: { [Op.in]: followerIds } },
          attributes: ["id", "name", "username", "profileImage", "bannerImage", "role"],
        })
      : [];

    res.json(followers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;
    let followingIds = [];

    try {
      const result = await runCypher(
        `MATCH (u:User {id: $userId})-[:FOLLOWS]->(f:User)
         RETURN f.id AS id`,
        { userId: String(userId) }
      );
      followingIds = result.records.map((r) => r.get("id"));
    } catch (neoErr) {
      console.warn("[Social Neo4j Warning]:", neoErr.message);
    }

    const following = followingIds.length
      ? await User.findAll({
          where: { id: { [Op.in]: followingIds } },
          attributes: ["id", "name", "username", "profileImage", "bannerImage", "role"],
        })
      : [];

    res.json(following);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMutualConnections = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const targetUserId = req.params.id;
    let mutualIds = [];

    try {
      const result = await runCypher(
        `MATCH (a:User {id: $currentUserId})-[:FOLLOWS]->(m:User)<-[:FOLLOWS]-(b:User {id: $targetUserId})
         RETURN m.id AS id`,
        { currentUserId: String(currentUserId), targetUserId: String(targetUserId) }
      );
      mutualIds = result.records.map((r) => r.get("id"));
    } catch (neoErr) {
      console.warn("[Social Neo4j Warning]:", neoErr.message);
    }

    const mutualUsers = mutualIds.length
      ? await User.findAll({
          where: { id: { [Op.in]: mutualIds } },
          attributes: ["id", "name", "username", "profileImage"],
        })
      : [];

    res.json({ count: mutualUsers.length, users: mutualUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    let recommendedIds = [];

    try {
      const result = await runCypher(
        `MATCH (u:User {id: $currentUserId})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(rec:User)
         WHERE NOT (u)-[:FOLLOWS]->(rec) AND rec.id <> $currentUserId
         RETURN rec.id AS id, count(friend) AS commonConnections
         ORDER BY commonConnections DESC
         LIMIT 10`,
        { currentUserId: String(currentUserId) }
      );
      recommendedIds = result.records.map((r) => r.get("id"));
    } catch (neoErr) {
      console.warn("[Social Neo4j Warning]:", neoErr.message);
    }

    let recommendations = [];
    if (recommendedIds.length) {
      recommendations = await User.findAll({
        where: { id: { [Op.in]: recommendedIds } },
        attributes: ["id", "name", "username", "profileImage", "college", "role"],
      });
    } else {
      // Fallback: suggest popular users
      recommendations = await User.findAll({
        where: { id: { [Op.ne]: currentUserId } },
        limit: 5,
        attributes: ["id", "name", "username", "profileImage", "college", "role"],
      });
    }

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
