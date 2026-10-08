import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { dispatchNotification } from "../utils/serviceClient.js";
import { deleteCachedPrefix, getCached, setCached } from "../config/cache.js";

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

    let codeBlocks = req.body.codeBlocks || [];
    if (typeof codeBlocks === "string" && codeBlocks.trim()) {
      try {
        codeBlocks = JSON.parse(codeBlocks);
      } catch (err) {
        codeBlocks = [];
      }
    }

    const images = Array.isArray(req.files)
      ? req.files.map((f) => f.path || f.secure_url || f.url || f.filename || f.location || "")
      : [];

    const post = new Post({
      author: userId,
      group: req.body.group || "General Feed",
      text: req.body.text || "",
      codeBlocks: Array.isArray(codeBlocks) ? codeBlocks : [],
      images,
    });

    await post.save();
    await post.populate("author", "name username profileImage");
    await deleteCachedPrefix("posts:");

    return res.status(201).json(post);
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
    await setCached(key, { posts, total }, 20);
    sendPaginated(res, posts, total, page, limit);
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

    const { page, limit, skip } = getPagination(req);
    const groupKey = req.query.group || "General Feed";
    const key = `posts:all:${groupKey}:${page}:${limit}`;
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

    await setCached(key, { posts, total }, 20);
    sendPaginated(res, posts, total, page, limit);
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

    await setCached(key, { posts, total }, 20);
    sendPaginated(res, posts, total, page, limit);
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
      return res.status(400).json({ error: "Already liked" });
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
        post: postId,
        title: `${req.user?.name || req.user?.username || "A user"} liked your post`,
        description: post.text?.substring(0, 100) || "",
        actionUrl: `/posts/${postId}`,
      });
    }

    res.json({ likes: post.likes.length });
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

    res.json({ likes: post.likes.length });
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
    await post.populate("author", "name username profileImage");
    await deleteCachedPrefix("posts:");

    res.json(post);
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

