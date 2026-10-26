import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import axios from "axios";
import { dispatchNotification } from "../utils/serviceClient.js";
import { deleteCachedPrefix, getCached, setCached } from "../config/cache.js";
import { hydratePostsWithUsers } from "../utils/userHydration.js";

/**
 * Upsert a local User mirror in post-service's MongoDB.
 * The user-service lives in PostgreSQL and uses UUID PKs, so we mirror
 * the essential fields here so that Mongoose `.populate("author")` works.
 */
const upsertUserMirror = async (req) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) return;
  try {
    await User.findByIdAndUpdate(
      userId,
      {
        _id: userId,
        name: req.user.name || req.user.username || "User",
        username: req.user.username || "",
        email: req.user.email || "",
        role: req.user.role || "student",
        profileImage: req.user.profileImage || "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    // Non-fatal: log and continue — posts can still be created without populate
    console.warn("[Post Service] User mirror upsert failed:", err.message);
  }
};

const getPagination = (req) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

const sendPaginated = (res, posts, total, page, limit) => {
  res.set({
    "X-Page": String(page),
    "X-Page-Size": String(limit),
    "X-Total-Count": String(total),
    "X-Has-More": String(page * limit < total),
  });
  res.json(posts);
};

export const createPost = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Ensure the user mirror exists in MongoDB so populate works
    await upsertUserMirror(req);

    let codeBlocks = req.body.codeBlocks || [];
    if (typeof codeBlocks === "string" && codeBlocks.trim()) {
      try {
        codeBlocks = JSON.parse(codeBlocks);
      } catch (err) {
        codeBlocks = [];
      }
    }

    let poll = null;
    if (req.body.poll) {
      try {
        poll = typeof req.body.poll === "string" ? JSON.parse(req.body.poll) : req.body.poll;
        if (!poll.question || !Array.isArray(poll.options) || poll.options.length < 2) {
          poll = null;
        } else {
          poll.options = poll.options.map((opt) => ({
            text: typeof opt === "string" ? opt : opt.text,
            votes: [],
          }));
        }
      } catch (err) {
        poll = null;
      }
    }

    let tags = [];
    if (req.body.tags) {
      try {
        tags = typeof req.body.tags === "string"
          ? (req.body.tags.startsWith("[")
              ? JSON.parse(req.body.tags)
              : req.body.tags.split(",").map((t) => t.trim().toLowerCase().replace(/^#/, "")).filter(Boolean))
          : req.body.tags;
      } catch (err) {
        tags = [];
      }
    }

    let postType = req.body.postType || "text";
    if (poll) postType = "poll";
    else if (Array.isArray(codeBlocks) && codeBlocks.length > 0) postType = "code";

    const images = Array.isArray(req.files)
      ? req.files.map((f) => f.path || f.secure_url || f.url || f.filename || f.location || "")
      : [];

    const post = new Post({
      author: userId,
      group: req.body.group || "General Feed",
      text: req.body.text || "",
      codeBlocks: Array.isArray(codeBlocks) ? codeBlocks : [],
      images,
      poll,
      tags: Array.isArray(tags) ? tags : [],
      postType,
    });

    await post.save();
    await deleteCachedPrefix("posts:");

    const hydrated = await hydratePostsWithUsers(post);
    return res.status(201).json(hydrated);
  } catch (err) {
    console.error("[Post Service Create Error]:", err);
    return res.status(500).json({ error: err.message || "Failed to create post" });
  }
};


export const getFeed = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const key = `posts:feed:${page}:${limit}`;
    const cached = await getCached(key);
    if (cached) return sendPaginated(res, cached.posts, cached.total, page, limit);

    const [posts, total] = await Promise.all([
      Post.find()
      .populate("author", "name username profileImage")
      .populate({
        path: "repostedFrom",
        populate: [
          { path: "author", select: "name username profileImage" },
          { path: "comments", populate: { path: "author", select: "name username profileImage" } },
        ],
      })
      .populate({
        path: "comments",
        populate: { path: "author", select: "name username profileImage" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
      Post.countDocuments(),
    ]);

    const hydratedPosts = await hydratePostsWithUsers(posts);
    await setCached(key, { posts: hydratedPosts, total }, 20);
    sendPaginated(res, hydratedPosts, total, page, limit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.group && req.query.group !== "General Feed") {
      filter.group = req.query.group;
    }

    const type = req.query.type || req.query.tab;
    const currentUserId = (req.user?._id || req.user?.id || "").toString();

    if (type) {
      if (type === "code") {
        filter.$or = [{ postType: "code" }, { "codeBlocks.0": { $exists: true } }];
      } else if (type === "poll") {
        filter.$or = [{ postType: "poll" }, { "poll.options.0": { $exists: true } }];
      } else if (type === "question") {
        filter.$or = [{ postType: "question" }, { tags: "question" }];
      } else if (type === "saved") {
        if (currentUserId) {
          filter.bookmarks = currentUserId;
        } else {
          return res.json([]);
        }
      }
    }

    if (req.query.tag) {
      filter.tags = req.query.tag.toLowerCase().replace(/^#/, "");
    }

    const { page, limit, skip } = getPagination(req);
    const groupKey = req.query.group || "General Feed";
    const filterKey = `${groupKey}:${type || "all"}:${req.query.tag || "all"}:${currentUserId}:${page}:${limit}`;
    const key = `posts:all:${filterKey}`;
    const cached = await getCached(key);
    if (cached) return sendPaginated(res, cached.posts, cached.total, page, limit);

    const [posts, total] = await Promise.all([
      Post.find(filter)
      .populate("author", "name username profileImage")
      .populate({
        path: "repostedFrom",
        populate: [
          { path: "author", select: "name username profileImage" },
          { path: "comments", populate: { path: "author", select: "name username profileImage" } },
        ],
      })
      .populate({
        path: "comments",
        populate: { path: "author", select: "name username profileImage" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
      Post.countDocuments(filter),
    ]);

    const hydratedPosts = await hydratePostsWithUsers(posts);
    await setCached(key, { posts: hydratedPosts, total }, 20);
    sendPaginated(res, hydratedPosts, total, page, limit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPostsByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const { page, limit, skip } = getPagination(req);
    const key = `posts:user:${userId}:${page}:${limit}`;
    const cached = await getCached(key);
    if (cached) return sendPaginated(res, cached.posts, cached.total, page, limit);

    const filter = { author: userId };
    const [posts, total] = await Promise.all([
      Post.find(filter)
      .populate("author", "name username profileImage")
      .populate({
        path: "repostedFrom",
        populate: [
          { path: "author", select: "name username profileImage" },
          { path: "comments", populate: { path: "author", select: "name username profileImage" } },
        ],
      })
      .populate({
        path: "comments",
        populate: { path: "author", select: "name username profileImage" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
      Post.countDocuments(filter),
    ]);

    const hydratedPosts = await hydratePostsWithUsers(posts);
    await setCached(key, { posts: hydratedPosts, total }, 20);
    sendPaginated(res, hydratedPosts, total, page, limit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id || req.user?.id;

    const post = await Post.findById(postId).populate("author");
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userIdString = userId.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userIdString);

    if (alreadyLiked) {
      return res.json({ likes: post.likes.length, liked: true });
    }

    post.likes.push(userId);
    await post.save();
    await deleteCachedPrefix("posts:");

    // Dispatch notification if not liking own post
    if (post.author?._id && post.author._id.toString() !== userIdString) {
      await dispatchNotification({
        recipientId: post.author._id,
        senderId: userId,
        type: "like",
        senderName: req.user?.name || req.user?.username || "A user",
        senderAvatar: req.user?.profileImage || "",
        post: postId,
        title: `${req.user?.name || req.user?.username || "A user"} liked your post`,
        description: post.text?.substring(0, 100) || "",
        actionUrl: `/posts/${postId}`,
      });
    }

    res.json({ likes: post.likes.length, liked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id || req.user?.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    await post.save();
    await deleteCachedPrefix("posts:");

    res.json({ likes: post.likes.length, liked: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const repost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id || req.user?.id;

    const originalPost = await Post.findById(postId).populate("author");
    if (!originalPost) return res.status(404).json({ error: "Post not found" });

    const existingRepost = await Post.findOne({ author: userId, repostedFrom: postId });
    if (existingRepost) return res.status(400).json({ error: "Already reposted" });

    const repostedPost = new Post({
      author: userId,
      repostedFrom: postId,
      text: originalPost.text,
      images: originalPost.images,
      codeBlocks: originalPost.codeBlocks,
    });

    await repostedPost.save();
    await deleteCachedPrefix("posts:");

    if (originalPost.author?._id && originalPost.author._id.toString() !== userId.toString()) {
      await dispatchNotification({
        recipientId: originalPost.author._id,
        senderId: userId,
        type: "repost",
        senderName: req.user?.name || req.user?.username || "A user",
        senderAvatar: req.user?.profileImage || "",
        post: postId,
        title: `${req.user?.name || req.user?.username || "A user"} reposted your post`,
        description: originalPost.text?.substring(0, 100) || "",
        actionUrl: `/posts/${postId}`,
      });
    }

    res.json(repostedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const undoRepost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id || req.user?.id;

    const repostItem = await Post.findOne({ author: userId, repostedFrom: postId });
    if (!repostItem) return res.status(404).json({ error: "Repost not found" });

    await Post.findByIdAndDelete(repostItem._id);
    await deleteCachedPrefix("posts:");
    res.json({ message: "Repost removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id || req.user?.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== userId.toString() && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (req.body.text !== undefined) post.text = req.body.text;

    if (req.body.codeBlocks) {
      try {
        post.codeBlocks = typeof req.body.codeBlocks === "string" ? JSON.parse(req.body.codeBlocks) : req.body.codeBlocks;
      } catch (err) {
        console.warn("Error parsing codeBlocks:", err);
      }
    }

    if (req.files && req.files.length > 0) {
      post.images = req.files.map((f) => f.path || f.secure_url || f.url || f.location).filter(Boolean);
    }

    await post.save();
    await deleteCachedPrefix("posts:");

    const hydrated = await hydratePostsWithUsers(post);
    res.json(hydrated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id || req.user?.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== userId.toString() && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Post.findByIdAndDelete(postId);
    await Comment.deleteMany({ post: postId });
    await deleteCachedPrefix("posts:");

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const reactToPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = (req.user?._id || req.user?.id || "").toString();
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const type = req.body.type || "like"; // "like" | "fire" | "insight" | "rocket" | "clap"

    const post = await Post.findById(postId).populate("author");
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (!Array.isArray(post.reactions)) post.reactions = [];

    const existingIndex = post.reactions.findIndex(
      (r) => r.user?.toString() === userId
    );

    let activeType = null;

    if (existingIndex > -1) {
      if (post.reactions[existingIndex].type === type) {
        // Toggle off
        post.reactions.splice(existingIndex, 1);
        activeType = null;
      } else {
        // Switch reaction
        post.reactions[existingIndex].type = type;
        activeType = type;
      }
    } else {
      // Add new reaction
      post.reactions.push({ user: userId, type });
      activeType = type;
    }

    // Keep likes array in sync for legacy compatibility
    if (activeType === "like") {
      if (!post.likes.some((id) => id.toString() === userId)) {
        post.likes.push(userId);
      }
    } else {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    }

    await post.save();
    await deleteCachedPrefix("posts:");

    if (activeType && post.author?._id && post.author._id.toString() !== userId) {
      const emojiMap = { like: "❤️", fire: "🔥", insight: "💡", rocket: "🚀", clap: "👏" };
      await dispatchNotification({
        recipientId: post.author._id,
        senderId: userId,
        type: "reaction",
        senderName: req.user?.name || req.user?.username || "A user",
        senderAvatar: req.user?.profileImage || "",
        post: postId,
        title: `${req.user?.name || req.user?.username || "A user"} reacted ${emojiMap[type] || "❤️"} to your post`,
        description: post.text?.substring(0, 100) || "",
        actionUrl: `/posts/${postId}`,
      }).catch(() => {});
    }

    const reactionCounts = { like: 0, fire: 0, insight: 0, rocket: 0, clap: 0 };
    post.reactions.forEach((r) => {
      if (reactionCounts[r.type] !== undefined) reactionCounts[r.type]++;
    });

    res.json({
      reactions: post.reactions,
      reactionCounts,
      myReaction: activeType,
      likes: post.likes.length,
      liked: activeType === "like",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const votePoll = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = (req.user?._id || req.user?.id || "").toString();
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const optionIndex = Number.parseInt(req.body.optionIndex, 10);

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (!post.poll || !Array.isArray(post.poll.options) || post.poll.options.length === 0) {
      return res.status(400).json({ error: "Post does not contain a poll" });
    }
    if (post.poll.closed) {
      return res.status(400).json({ error: "This poll is closed" });
    }
    if (isNaN(optionIndex) || optionIndex < 0 || optionIndex >= post.poll.options.length) {
      return res.status(400).json({ error: "Invalid option index" });
    }

    let currentVotedIndex = -1;
    post.poll.options.forEach((opt, idx) => {
      if (Array.isArray(opt.votes) && opt.votes.some((v) => v.toString() === userId)) {
        currentVotedIndex = idx;
      }
    });

    if (currentVotedIndex === optionIndex) {
      // Toggle off
      post.poll.options[optionIndex].votes = post.poll.options[optionIndex].votes.filter(
        (v) => v.toString() !== userId
      );
    } else {
      // Remove old vote if voted in another option
      if (currentVotedIndex > -1) {
        post.poll.options[currentVotedIndex].votes = post.poll.options[currentVotedIndex].votes.filter(
          (v) => v.toString() !== userId
        );
      }
      post.poll.options[optionIndex].votes.push(userId);
    }

    await post.save();
    await deleteCachedPrefix("posts:");

    res.json({
      poll: post.poll,
      totalVotes: post.poll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = (req.user?._id || req.user?.id || "").toString();
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (!Array.isArray(post.bookmarks)) post.bookmarks = [];

    const isBookmarked = post.bookmarks.some((id) => id.toString() === userId);
    if (isBookmarked) {
      post.bookmarks = post.bookmarks.filter((id) => id.toString() !== userId);
    } else {
      post.bookmarks.push(userId);
    }

    await post.save();
    await deleteCachedPrefix("posts:");

    res.json({
      bookmarked: !isBookmarked,
      bookmarksCount: post.bookmarks.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBookmarkedPosts = async (req, res) => {
  try {
    const userId = (req.user?._id || req.user?.id || "").toString();
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { page, limit, skip } = getPagination(req);
    const filter = { bookmarks: userId };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "name username profileImage")
        .populate({
          path: "repostedFrom",
          populate: [
            { path: "author", select: "name username profileImage" },
            { path: "comments", populate: { path: "author", select: "name username profileImage" } },
          ],
        })
        .populate({
          path: "comments",
          populate: { path: "author", select: "name username profileImage" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    const hydratedPosts = await hydratePostsWithUsers(posts);
    sendPaginated(res, hydratedPosts, total, page, limit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const PISTON_URL = process.env.PISTON_URL || "https://emkc.org/api/v2/piston/execute";
const PISTON_LANG_MAP = {
  javascript: { language: "javascript", version: "18.15.0" },
  js: { language: "javascript", version: "18.15.0" },
  python: { language: "python", version: "3.10.0" },
  py: { language: "python", version: "3.10.0" },
  cpp: { language: "c++", version: "10.2.0" },
  "c++": { language: "c++", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
  java: { language: "java", version: "15.0.2" },
  sql: { language: "sqlite3", version: "3.36.0" },
};

export const executeSnippet = async (req, res) => {
  try {
    const { language = "javascript", code = "", stdin = "" } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ error: "Code content cannot be empty" });
    }

    const normLang = language.trim().toLowerCase();
    const runtime = PISTON_LANG_MAP[normLang] || PISTON_LANG_MAP.javascript;

    const response = await axios.post(
      PISTON_URL,
      {
        language: runtime.language,
        version: runtime.version,
        files: [{ content: code }],
        stdin: stdin || "",
      },
      { timeout: 12000 }
    );

    const run = response.data?.run || {};
    return res.json({
      stdout: run.stdout || "",
      stderr: run.stderr || "",
      output: run.output || run.stdout || run.stderr || "",
      exitCode: run.code ?? 0,
      language: runtime.language,
    });
  } catch (err) {
    console.error("[Post Snippet Execute Error]:", err.message);
    return res.status(500).json({
      error: "Execution failed or timed out",
      details: err.response?.data?.message || err.message,
    });
  }
};

