import { runCypher } from "../lib/neo4j.js";
import User, { Op } from "../models/User.js";
import UserFollow from "../models/UserFollow.js";
import { dispatchNotification } from "../utils/serviceClient.js";
import { deleteCached } from "../config/cache.js";

/**
 * Helper to sync user node and college relationship in Neo4j
 */
export const syncUserToGraph = async (user) => {
  if (!user || !user.id) return;
  try {
    await runCypher(
      `MERGE (u:User {id: $id})
       SET u.name = $name, u.username = $username, u.role = $role`,
      {
        id: String(user.id),
        name: user.name || "User",
        username: user.username || "",
        role: user.role || "student",
      }
    );

    if (user.college && user.college.trim()) {
      await runCypher(
        `MATCH (u:User {id: $id})
         MERGE (c:College {name: $college})
         MERGE (u)-[:STUDIES_AT]->(c)`,
        {
          id: String(user.id),
          college: user.college.trim(),
        }
      );
    }
  } catch (err) {
    console.warn("[Neo4j syncUserToGraph Warning]:", err.message);
  }
};

/**
 * POST /api/social/:id/follow
 * or POST /api/users/follow/:id
 */
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

    // Ensure nodes exist in graph
    await syncUserToGraph(currentUser);
    await syncUserToGraph(targetUser);

    // 1. Persist in SQL (primary, reliable source of truth)
    const [, created] = await UserFollow.upsert(
      { followerId: String(currentUserId), followingId: String(targetUserId) },
      { returning: true }
    );

    // 2. Also sync to Neo4j graph for traversal/recommendation features
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
    if (created) await dispatchNotification({
      recipientId: targetUserId,
      senderId: currentUserId,
      type: "follow",
      senderName: currentUser.name || currentUser.username || "A user",
      senderAvatar: currentUser.profileImage || "",
      title: `${currentUser.name || currentUser.username} started following you`,
      description: "",
      actionUrl: `/profile/${currentUserId}`,
    });

    res.json({ message: "Following", targetUserId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/social/:id/follow
 * or POST /api/users/unfollow/:id
 */
export const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user?._id || req.user?.id;

    if (String(targetUserId) === String(currentUserId)) {
      return res.status(400).json({ error: "Cannot unfollow yourself" });
    }

    // 1. Remove from SQL
    await UserFollow.destroy({
      where: { followerId: String(currentUserId), followingId: String(targetUserId) },
    });

    // 2. Also remove from Neo4j
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

/**
 * GET /api/social/:id/followers
 */
export const getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;
    // Fetch followers from SQL (reliable)
    const followRows = await UserFollow.findAll({
      where: { followingId: String(userId) },
      attributes: ["followerId"],
    });
    const followerIds = followRows.map((r) => r.followerId);

    const followers = followerIds.length
      ? await User.findAll({
          where: { id: { [Op.in]: followerIds } },
          attributes: ["id", "name", "username", "profileImage", "bannerImage", "role", "college"],
        })
      : [];

    res.json(followers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/social/:id/following
 */
export const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;
    // Fetch following from SQL (reliable)
    const followRows = await UserFollow.findAll({
      where: { followerId: String(userId) },
      attributes: ["followingId"],
    });
    const followingIds = followRows.map((r) => r.followingId);

    const following = followingIds.length
      ? await User.findAll({
          where: { id: { [Op.in]: followingIds } },
          attributes: ["id", "name", "username", "profileImage", "bannerImage", "role", "college"],
        })
      : [];

    res.json(following);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/social/:id/mutual
 * or GET /api/users/graph/mutual/:id
 */
export const getMutualConnections = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const targetUserId = req.params.id;

    if (!currentUserId || !targetUserId || String(currentUserId) === String(targetUserId)) {
      return res.json({ count: 0, users: [] });
    }

    let mutualIds = [];
    try {
      const result = await runCypher(
        `MATCH (a:User {id: $currentUserId})-[:FOLLOWS]->(m:User)<-[:FOLLOWS]-(b:User {id: $targetUserId})
         RETURN DISTINCT m.id AS id`,
        { currentUserId: String(currentUserId), targetUserId: String(targetUserId) }
      );
      mutualIds = result.records.map((r) => r.get("id"));
    } catch (neoErr) {
      console.warn("[Social Neo4j Warning]:", neoErr.message);
    }

    const mutualUsers = mutualIds.length
      ? await User.findAll({
          where: { id: { [Op.in]: mutualIds } },
          attributes: ["id", "name", "username", "profileImage", "college", "role"],
        })
      : [];

    res.json({ count: mutualUsers.length, users: mutualUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/social/trail/:id
 * or GET /api/users/graph/trail/:id
 * Calculates degree of connection (1st, 2nd, 3rd+) and the full shortest path trail between users
 */
export const getConnectionTrail = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const targetUserId = req.params.id;

    if (!currentUserId || !targetUserId) {
      return res.status(400).json({ error: "Both user IDs are required" });
    }

    if (String(currentUserId) === String(targetUserId)) {
      return res.json({
        degree: "Self",
        distance: 0,
        isDirectFollowing: false,
        isFollowedBy: false,
        trail: [],
        mutualCount: 0,
      });
    }

    let trailNodeIds = [];
    let distance = -1;
    let isDirectFollowing = false;
    let isFollowedBy = false;
    let mutualCount = 0;

    try {
      // 1. Check direct follow (1st degree)
      const directCheck = await runCypher(
        `OPTIONAL MATCH (me:User {id: $currentUserId})-[r1:FOLLOWS]->(target:User {id: $targetUserId})
         OPTIONAL MATCH (target)-[r2:FOLLOWS]->(me)
         RETURN r1 IS NOT NULL AS following, r2 IS NOT NULL AS followedBy`,
        { currentUserId: String(currentUserId), targetUserId: String(targetUserId) }
      );

      if (directCheck.records.length > 0) {
        isDirectFollowing = !!directCheck.records[0].get("following");
        isFollowedBy = !!directCheck.records[0].get("followedBy");
      }

      // 2. Shortest path up to 4 hops
      const pathResult = await runCypher(
        `MATCH p = shortestPath((me:User {id: $currentUserId})-[:FOLLOWS*1..4]-(target:User {id: $targetUserId}))
         RETURN [n IN nodes(p) | n.id] AS trailIds, length(p) AS distance`,
        { currentUserId: String(currentUserId), targetUserId: String(targetUserId) }
      );

      if (pathResult.records.length > 0) {
        trailNodeIds = pathResult.records[0].get("trailIds") || [];
        const rawDist = pathResult.records[0].get("distance");
        distance = rawDist && typeof rawDist === "object" ? (rawDist.low ?? 0) : Number(rawDist);
      }

      // 3. Mutual followers count
      const mutualResult = await runCypher(
        `MATCH (me:User {id: $currentUserId})-[:FOLLOWS]->(m:User)<-[:FOLLOWS]-(target:User {id: $targetUserId})
         RETURN count(DISTINCT m) AS mutualCount`,
        { currentUserId: String(currentUserId), targetUserId: String(targetUserId) }
      );

      if (mutualResult.records.length > 0) {
        mutualCount = mutualResult.records[0].get("mutualCount").low ?? Number(mutualResult.records[0].get("mutualCount")) ?? 0;
      }
    } catch (neoErr) {
      console.warn("[Social Neo4j Trail Warning]:", neoErr.message);
    }

    // Determine degree badge
    let degree = "None";
    if (isDirectFollowing) {
      degree = "1st";
    } else if (distance === 1) {
      degree = "1st";
    } else if (distance === 2 || mutualCount > 0) {
      degree = "2nd";
    } else if (distance >= 3) {
      degree = "3rd+";
    }

    // Hydrate trail nodes
    let trail = [];
    if (trailNodeIds.length > 0) {
      const usersData = await User.findAll({
        where: { id: { [Op.in]: trailNodeIds } },
        attributes: ["id", "name", "username", "profileImage", "role", "college"],
      });
      const userMap = new Map(usersData.map((u) => [u.id, u.toObject()]));
      trail = trailNodeIds.map((id) => userMap.get(id)).filter(Boolean);
    }

    res.json({
      degree,
      distance: distance >= 0 ? distance : null,
      isDirectFollowing,
      isFollowedBy,
      trail,
      mutualCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/social/stats/:id
 * or GET /api/users/graph/stats/:id
 * Network reach & influence statistics
 */
export const getUserNetworkStats = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const targetUserId = req.params.id || currentUserId;

    let followersCount = 0;
    let followingCount = 0;
    let secondDegreeReach = 0;
    let mutualCount = 0;

    try {
      const statsResult = await runCypher(
        `MATCH (u:User {id: $userId})
         OPTIONAL MATCH (f:User)-[:FOLLOWS]->(u)
         OPTIONAL MATCH (u)-[:FOLLOWS]->(fo:User)
         OPTIONAL MATCH (u)-[:FOLLOWS*1..2]->(reach:User) WHERE reach.id <> u.id
         RETURN count(DISTINCT f) AS inDegree,
                count(DISTINCT fo) AS outDegree,
                count(DISTINCT reach) AS reachCount`,
        { userId: String(targetUserId) }
      );

      if (statsResult.records.length > 0) {
        const r = statsResult.records[0];
        followersCount = r.get("inDegree").low ?? Number(r.get("inDegree")) ?? 0;
        followingCount = r.get("outDegree").low ?? Number(r.get("outDegree")) ?? 0;
        secondDegreeReach = r.get("reachCount").low ?? Number(r.get("reachCount")) ?? 0;
      }

      if (currentUserId && String(currentUserId) !== String(targetUserId)) {
        const mutualRes = await runCypher(
          `MATCH (a:User {id: $currentUserId})-[:FOLLOWS]->(m:User)<-[:FOLLOWS]-(b:User {id: $targetUserId})
           RETURN count(DISTINCT m) AS mCount`,
          { currentUserId: String(currentUserId), targetUserId: String(targetUserId) }
        );
        if (mutualRes.records.length > 0) {
          mutualCount = mutualRes.records[0].get("mCount").low ?? Number(mutualRes.records[0].get("mCount")) ?? 0;
        }
      }
    } catch (neoErr) {
      console.warn("[Social Neo4j Stats Warning]:", neoErr.message);
    }

    // Dynamic Network Influence Score (out of 100)
    // Formula: inDegree * 5 + secondDegreeReach * 2 + outDegree * 1 capped at 100
    const rawScore = (followersCount * 6) + (secondDegreeReach * 2) + (followingCount * 2);
    const influenceScore = Math.min(100, Math.max(10, Math.round(rawScore)));

    res.json({
      followersCount,
      followingCount,
      directConnections: followersCount + followingCount,
      secondDegreeReach,
      mutualCount,
      influenceScore,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/social/recommendations
 * or GET /api/users/graph/recommendations
 * Multi-factor "People You May Know" graph recommendation engine
 */
export const getRecommendations = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    if (!currentUserId) return res.json([]);

    const currentUser = await User.findByPk(currentUserId);
    if (currentUser) await syncUserToGraph(currentUser);

    // Collect who current user already follows from SQL (reliable source of truth)
    let alreadyFollowingIds = new Set();
    try {
      const followRows = await UserFollow.findAll({
        where: { followerId: String(currentUserId) },
        attributes: ["followingId"],
      });
      followRows.forEach((r) => alreadyFollowingIds.add(String(r.followingId)));
    } catch (sqlErr) {
      console.warn("[Social SQL followingIds Warning]:", sqlErr.message);
      // Fallback to Neo4j
      try {
        const followingResult = await runCypher(
          `MATCH (me:User {id: $currentUserId})-[:FOLLOWS]->(target:User)
           RETURN target.id AS id`,
          { currentUserId: String(currentUserId) }
        );
        if (followingResult?.records) {
          followingResult.records.forEach((r) => alreadyFollowingIds.add(String(r.get("id"))));
        }
      } catch (neoErr) {
        console.warn("[Social Neo4j followingIds Warning]:", neoErr.message);
      }
    }

    let candidates = new Map(); // id -> { mutualCount, sameCollege, commonFriendIds }

    try {
      // 1. Friends of friends (2-hop triangle closing)
      const fofResult = await runCypher(
        `MATCH (me:User {id: $currentUserId})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(rec:User)
         WHERE NOT (me)-[:FOLLOWS]->(rec) AND rec.id <> $currentUserId
         RETURN rec.id AS id, collect(friend.id) AS commonFriends, count(friend) AS commonCount
         ORDER BY commonCount DESC
         LIMIT 15`,
        { currentUserId: String(currentUserId) }
      );

      fofResult.records.forEach((r) => {
        const id = String(r.get("id"));
        if (alreadyFollowingIds.has(id) || id === String(currentUserId)) return;
        const count = r.get("commonCount").low ?? Number(r.get("commonCount")) ?? 0;
        const friends = r.get("commonFriends") || [];
        candidates.set(id, {
          mutualCount: count,
          sameCollege: false,
          commonFriendIds: friends.slice(0, 3),
        });
      });

      // 2. Same college campus peers
      if (currentUser?.college && currentUser.college.trim()) {
        const collegeResult = await runCypher(
          `MATCH (me:User {id: $currentUserId})-[:STUDIES_AT]->(c:College)<-[:STUDIES_AT]-(peer:User)
           WHERE NOT (me)-[:FOLLOWS]->(peer) AND peer.id <> $currentUserId
           RETURN peer.id AS id`,
          { currentUserId: String(currentUserId) }
        );

        collegeResult.records.forEach((r) => {
          const id = String(r.get("id"));
          if (alreadyFollowingIds.has(id) || id === String(currentUserId)) return;
          const existing = candidates.get(id) || { mutualCount: 0, sameCollege: false, commonFriendIds: [] };
          existing.sameCollege = true;
          candidates.set(id, existing);
        });
      }
    } catch (neoErr) {
      console.warn("[Social Neo4j Recommendations Warning]:", neoErr.message);
    }

    // Hydrate candidates
    const candidateIds = Array.from(candidates.keys());
    let users = [];

    if (candidateIds.length > 0) {
      users = await User.findAll({
        where: { id: { [Op.in]: candidateIds } },
        attributes: ["id", "name", "username", "profileImage", "role", "college", "degree"],
      });
    }

    // Fallback: If network is small, suggest other active users (excluding already-followed users!)
    if (users.length < 5) {
      const excludedIds = Array.from(new Set([
        String(currentUserId),
        ...Array.from(alreadyFollowingIds),
        ...candidateIds.map(String),
      ]));
      const fallbackUsers = await User.findAll({
        where: { id: { [Op.notIn]: excludedIds } },
        limit: 8 - users.length,
        attributes: ["id", "name", "username", "profileImage", "role", "college", "degree"],
        order: [["createdAt", "DESC"]],
      });
      fallbackUsers.forEach((fu) => {
        candidates.set(String(fu.id), { mutualCount: 0, sameCollege: false, commonFriendIds: [] });
      });
      users = [...users, ...fallbackUsers];
    }

    // Collect all friend preview IDs to fetch their names/avatars in a single query
    const allPreviewFriendIds = new Set();
    candidates.forEach((info) => {
      (info.commonFriendIds || []).forEach((fid) => allPreviewFriendIds.add(fid));
    });

    let friendMap = new Map();
    if (allPreviewFriendIds.size > 0) {
      const previewFriends = await User.findAll({
        where: { id: { [Op.in]: Array.from(allPreviewFriendIds) } },
        attributes: ["id", "name", "username", "profileImage"],
      });
      previewFriends.forEach((pf) => friendMap.set(pf.id, pf.toObject()));
    }

    const targetUserIds = users.map((u) => String(u.id));
    const degreeMap = new Map();
    const followersMap = {};

    if (targetUserIds.length > 0) {
      // 1. Calculate true shortest path hop count for degree consistency
      try {
        const pathResult = await runCypher(
          `MATCH (me:User {id: $currentUserId})
           UNWIND $targetIds AS tid
           OPTIONAL MATCH p = shortestPath((me)-[:FOLLOWS*1..4]->(target:User {id: tid}))
           RETURN tid, length(p) AS hopCount`,
          { currentUserId: String(currentUserId), targetIds: targetUserIds }
        );
        if (pathResult?.records) {
          pathResult.records.forEach((r) => {
            const tid = r.get("tid");
            const hop = r.get("hopCount");
            const hopNum = hop?.low ?? (hop != null ? Number(hop) : null);
            if (hopNum === 1) degreeMap.set(tid, "1st");
            else if (hopNum === 2) degreeMap.set(tid, "2nd");
            else if (hopNum && hopNum >= 3) degreeMap.set(tid, "3rd+");
            else degreeMap.set(tid, "3rd+");
          });
        }
      } catch (pathErr) {
        console.warn("[Social Neo4j Degree Calculation Warning]:", pathErr.message);
      }

      // 2. Fetch followers for each recommended user from SQL
      try {
        const followRows = await UserFollow.findAll({
          where: { followingId: { [Op.in]: targetUserIds } },
          attributes: ["followerId", "followingId"],
        });
        followRows.forEach((r) => {
          const followed = String(r.followingId);
          const follower = String(r.followerId);
          if (!followersMap[followed]) followersMap[followed] = [];
          followersMap[followed].push(follower);
        });
      } catch (fErr) {
        // Fallback to Neo4j
        try {
          const followResult = await runCypher(
            `MATCH (f:User)-[:FOLLOWS]->(u:User)
             WHERE u.id IN $targetIds
             RETURN f.id AS followerId, u.id AS followedId`,
            { targetIds: targetUserIds }
          );
          if (followResult?.records) {
            followResult.records.forEach((r) => {
              const followed = r.get("followedId");
              const follower = r.get("followerId");
              if (!followersMap[followed]) followersMap[followed] = [];
              followersMap[followed].push(follower);
            });
          }
        } catch (neoErr) {
          console.warn("[Social Neo4j followers Warning]:", neoErr.message);
        }
      }
    }

    // Format final recommendations with reason tag, degree, and followers
    const recommendations = users.map((u) => {
      const obj = u.toObject();
      const meta = candidates.get(String(obj.id)) || { mutualCount: 0, sameCollege: false, commonFriendIds: [] };
      const mutualFriends = (meta.commonFriendIds || []).map((fid) => friendMap.get(fid)).filter(Boolean);

      let reason = "Active on Campus";
      if (meta.mutualCount > 0) {
        reason = `${meta.mutualCount} mutual connection${meta.mutualCount > 1 ? "s" : ""}`;
      } else if (meta.sameCollege && obj.college) {
        reason = `Attends ${obj.college}`;
      } else if (obj.role && obj.role !== "student") {
        reason = `${obj.role.replace("_", " ").toUpperCase()}`;
      }

      const degree = degreeMap.get(String(obj.id)) || (meta.mutualCount > 0 ? "2nd" : "3rd+");
      const userFollowers = followersMap[String(obj.id)] || [];
      const isFollowing = alreadyFollowingIds.has(String(obj.id)) || userFollowers.includes(String(currentUserId));

      return {
        ...obj,
        degree,
        followers: userFollowers,
        isFollowing,
        mutualCount: meta.mutualCount,
        mutualFriends,
        recommendationReason: reason,
      };
    });

    // Sort by mutualCount first, then sameCollege
    recommendations.sort((a, b) => (b.mutualCount || 0) - (a.mutualCount || 0));

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
