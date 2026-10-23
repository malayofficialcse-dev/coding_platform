import axios from "axios";
import User from "../models/User.js";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:5002";

// In-memory cache for user profiles (TTL 60 seconds)
const userCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

export const getCachedUser = (id) => {
  const cached = userCache.get(String(id));
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
};

export const setCachedUser = (id, data) => {
  userCache.set(String(id), { data, timestamp: Date.now() });
};

/**
 * Fetch a batch of user profiles from user-service and mirror them into post-service MongoDB.
 */
export const fetchUsersBatch = async (userIds) => {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean).map(String)));
  if (uniqueIds.length === 0) return new Map();

  const resultMap = new Map();
  const missingIds = [];

  // Check cache first
  for (const id of uniqueIds) {
    const cached = getCachedUser(id);
    if (cached) {
      resultMap.set(id, cached);
    } else {
      missingIds.push(id);
    }
  }

  if (missingIds.length === 0) return resultMap;

  // 1. Try batch API on user-service
  try {
    const res = await axios.post(
      `${USER_SERVICE_URL}/v1/users/batch`,
      { ids: missingIds },
      { timeout: 4000 }
    );
    const users = res.data?.users || [];
    for (const u of users) {
      const uId = String(u.id || u._id);
      const userObj = {
        _id: uId,
        id: uId,
        name: u.name || u.username || "Code Campus Member",
        username: u.username || "",
        email: u.email || "",
        profileImage: u.profileImage || "",
        role: u.role || "student",
      };
      setCachedUser(uId, userObj);
      resultMap.set(uId, userObj);

      // Async upsert to local MongoDB mirror so standard Mongoose populate also succeeds
      User.updateOne(
        { _id: uId },
        { $set: userObj },
        { upsert: true }
      ).catch(() => {});
    }
  } catch (err) {
    console.warn("[UserHydration] Batch fetch from user-service failed:", err.message);
  }

  // 2. For any remaining missing IDs, fallback to MongoDB User collection
  const stillMissing = missingIds.filter((id) => !resultMap.has(id));
  if (stillMissing.length > 0) {
    try {
      const localUsers = await User.find({ _id: { $in: stillMissing } }).lean();
      for (const lu of localUsers) {
        const uId = String(lu._id);
        const userObj = {
          _id: uId,
          id: uId,
          name: lu.name || lu.username || "Code Campus Member",
          username: lu.username || "",
          email: lu.email || "",
          profileImage: lu.profileImage || "",
          role: lu.role || "student",
        };
        setCachedUser(uId, userObj);
        resultMap.set(uId, userObj);
      }
    } catch (dbErr) {
      console.warn("[UserHydration] MongoDB fallback lookup failed:", dbErr.message);
    }
  }

  return resultMap;
};

/**
 * Hydrates an array of posts or single post with full author details (name, username, profileImage).
 * Handles post.author, post.repostedFrom.author, and post.comments[].author.
 */
export const hydratePostsWithUsers = async (posts) => {
  if (!posts) return posts;
  const isSingle = !Array.isArray(posts);
  const postList = isSingle ? [posts] : posts;

  // Collect all author IDs across posts, reposts, and comments
  const neededUserIds = new Set();

  for (const p of postList) {
    if (!p) continue;

    // Post author
    const authorId = typeof p.author === "string" ? p.author : p.author?._id || p.author?.id;
    if (authorId) neededUserIds.add(String(authorId));

    // Reposted post author
    const repost = p.repostedFrom;
    if (repost) {
      const repAuthorId = typeof repost.author === "string" ? repost.author : repost.author?._id || repost.author?.id;
      if (repAuthorId) neededUserIds.add(String(repAuthorId));
    }

    // Comment authors
    if (Array.isArray(p.comments)) {
      for (const c of p.comments) {
        const cAuthorId = typeof c.author === "string" ? c.author : c.author?._id || c.author?.id;
        if (cAuthorId) neededUserIds.add(String(cAuthorId));
      }
    }
  }

  const userMap = await fetchUsersBatch(Array.from(neededUserIds));

  // Enrich each post
  const enrichedPosts = postList.map((p) => {
    // If p is a Mongoose document, convert to plain JS object so modifications persist cleanly
    const postObj = typeof p.toObject === "function" ? p.toObject() : { ...p };

    const authorId = String(
      typeof postObj.author === "string"
        ? postObj.author
        : postObj.author?._id || postObj.author?.id || ""
    );

    if (userMap.has(authorId)) {
      const u = userMap.get(authorId);
      postObj.author = {
        _id: u._id,
        id: u._id,
        name: u.name,
        username: u.username,
        profileImage: u.profileImage,
        role: u.role,
      };
    } else if (postObj.author && typeof postObj.author === "object") {
      postObj.author = {
        _id: postObj.author._id || postObj.author.id || authorId,
        id: postObj.author._id || postObj.author.id || authorId,
        name: postObj.author.name || postObj.author.username || "Code Campus Member",
        username: postObj.author.username || "",
        profileImage: postObj.author.profileImage || "",
        role: postObj.author.role || "student",
      };
    } else if (authorId) {
      postObj.author = {
        _id: authorId,
        id: authorId,
        name: "Code Campus Member",
        username: "",
        profileImage: "",
        role: "student",
      };
    }

    // Repost author hydration
    if (postObj.repostedFrom && typeof postObj.repostedFrom === "object") {
      const repAuthorId = String(
        typeof postObj.repostedFrom.author === "string"
          ? postObj.repostedFrom.author
          : postObj.repostedFrom.author?._id || postObj.repostedFrom.author?.id || ""
      );
      if (userMap.has(repAuthorId)) {
        postObj.repostedFrom.author = userMap.get(repAuthorId);
      }
    }

    // Comments author hydration
    if (Array.isArray(postObj.comments)) {
      postObj.comments = postObj.comments.map((c) => {
        const cObj = typeof c.toObject === "function" ? c.toObject() : { ...c };
        const cAuthorId = String(
          typeof cObj.author === "string"
            ? cObj.author
            : cObj.author?._id || cObj.author?.id || ""
        );
        if (userMap.has(cAuthorId)) {
          cObj.author = userMap.get(cAuthorId);
        }
        return cObj;
      });
    }

    return postObj;
  });

  return isSingle ? enrichedPosts[0] : enrichedPosts;
};

/**
 * Startup synchronization: pull directory from user-service into post-service MongoDB.
 */
export const syncAllUsersFromUserService = async () => {
  try {
    const res = await axios.get(`${USER_SERVICE_URL}/v1/users`, { timeout: 5000 });
    const users = Array.isArray(res.data) ? res.data : [];
    for (const u of users) {
      const uId = String(u.id || u._id);
      const userObj = {
        _id: uId,
        name: u.name || u.username || "Code Campus Member",
        username: u.username || "",
        email: u.email || "",
        profileImage: u.profileImage || "",
        role: u.role || "student",
      };
      setCachedUser(uId, userObj);
      await User.updateOne({ _id: uId }, { $set: userObj }, { upsert: true });
    }
    console.log(`[UserHydration] Successfully synced ${users.length} users into MongoDB mirror.`);
  } catch (err) {
    console.warn("[UserHydration] Initial user-service sync notice:", err.message);
  }
};
