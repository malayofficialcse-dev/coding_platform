import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import { getSocket } from "../lib/socket.js";
import { createNotification } from "./notification.controller.js";

// export const createPost = async (req, res) => {
//   try {
//     const { text, codeBlocks } = req.body;
//     const userId = req.user._id;

//     const post = new Post({
//       author: userId,
//       text,
//       codeBlocks: codeBlocks || [],
//       images: req.files?.map((f) => f.path) || [],
//     });

//     await post.save();
//     await post.populate("author", "name username profileImage");

//     res.json(post);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };



// ...existing code...
export const createPost = async (req, res) => {
  try {
    // DEBUG: log minimal request info — check server console when POST happens
    console.log("createPost called. user:", !!req.user, "bodyKeys:", Object.keys(req.body || {}), "files:", req.files?.length || 0);

    // Auth guard (prevents crash when req.user is missing)
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user._id;

    // Parse codeBlocks (client sends JSON string)
    let codeBlocks = req.body.codeBlocks || [];
    if (typeof codeBlocks === "string" && codeBlocks.trim()) {
      try {
        codeBlocks = JSON.parse(codeBlocks);
      } catch (err) {
        console.warn("createPost: invalid codeBlocks JSON, using empty array", err);
        codeBlocks = [];
      }
    }

    // Collect images from multer (path or filename depending on storage)
    const images = Array.isArray(req.files)
      ? req.files.map((f) => f.path || f.filename || f.location || "")
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

    return res.json(post);
  } catch (err) {
    console.error("createPost ERROR:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};


export const getFeed = async (req, res) => {
  try {
    // Show posts from followed users and self, sorted by date
    const user = await User.findById(req.user._id);
    const ids = [...user.following, user._id];
    const posts = await Post.find({ author: { $in: ids } })
      .populate("author", "name username profileImage")
      .populate({
        path: "comments",
        populate: { path: "author", select: "name username profileImage" },
      })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
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
    const posts = await Post.find(filter)
      .populate("author", "name username profileImage")
      .populate({
        path: "comments",
        populate: { path: "author", select: "name username profileImage" },
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// FIX: Use req.params.id (not userId) to match the route parameter
export const getPostsByUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const posts = await Post.find({ author: userId })
      .populate("author", "name username profileImage")
      .populate({
        path: "comments",
        populate: { path: "author", select: "name username profileImage" },
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("getPostsByUser error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate("author");
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userIdString = userId.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userIdString);

    if (alreadyLiked) {
      return res.status(400).json({ error: "Already liked" });
    }

    post.likes.push(userId);
    await post.save();

    // Create notification
    if (post.author._id.toString() !== userId.toString()) {
      const notification = await createNotification(
        post.author._id,
        userId,
        "like",
        {
          post: postId,
          title: `${req.user.name || req.user.username} liked your post`,
          description: post.text?.substring(0, 100),
          actionUrl: `/posts/${postId}`,
        }
      );

      try {
        const io = getSocket();
        io.to(post.author._id.toString()).emit("newNotification", {
          notification: notification,
          type: "like",
        });
      } catch (socketErr) {
        console.error("Socket error:", socketErr);
      }
    }

    res.json({ likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    await post.save();

    res.json({ likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate("author");
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = new Comment({
      author: userId,
      post: postId,
      text,
    });

    await comment.save();
    await comment.populate("author", "name username profileImage");

    post.comments.push(comment._id);
    await post.save();

    // Create notification
    if (post.author._id.toString() !== userId.toString()) {
      const notification = await createNotification(
        post.author._id,
        userId,
        "comment",
        {
          post: postId,
          comment: comment._id,
          title: `${req.user.name || req.user.username} commented on your post`,
          description: text?.substring(0, 100),
          actionUrl: `/posts/${postId}`,
        }
      );

      try {
        const io = getSocket();
        io.to(post.author._id.toString()).emit("newNotification", {
          notification: notification,
          type: "comment",
        });
      } catch (socketErr) {
        console.error("Socket error:", socketErr);
      }
    }

    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Comment.findByIdAndDelete(commentId);
    await Post.findByIdAndUpdate(postId, { $pull: { comments: commentId } });

    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const repost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const originalPost = await Post.findById(postId).populate("author");
    if (!originalPost) return res.status(404).json({ error: "Post not found" });

    const existingRepost = await Post.findOne({
      author: userId,
      repostedFrom: postId,
    });

    if (existingRepost) {
      return res.status(400).json({ error: "Already reposted" });
    }

    const repostedPost = new Post({
      author: userId,
      repostedFrom: postId,
      text: originalPost.text,
      images: originalPost.images,
      codeBlocks: originalPost.codeBlocks,
    });

    await repostedPost.save();

    if (originalPost.author._id.toString() !== userId.toString()) {
      const notification = await createNotification(
        originalPost.author._id,
        userId,
        "repost",
        {
          post: postId,
          title: `${req.user.name || req.user.username} reposted your post`,
          description: originalPost.text?.substring(0, 100),
          actionUrl: `/posts/${postId}`,
        }
      );

      try {
        const io = getSocket();
        io.to(originalPost.author._id.toString()).emit("newNotification", {
          notification: notification,
          type: "repost",
        });
      } catch (socketErr) {
        console.error("Socket error:", socketErr);
      }
    }

    res.json(repostedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const undoRepost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const repost = await Post.findOne({
      author: userId,
      repostedFrom: postId,
    });

    if (!repost) return res.status(404).json({ error: "Repost not found" });

    await Post.findByIdAndDelete(repost._id);
    res.json({ message: "Repost removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// export const updatePost = async (req, res) => {
//   try {
//     const postId = req.params.id;
//     const { text, codeBlocks } = req.body;
//     const userId = req.user._id;

//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ error: "Post not found" });

//     if (post.author.toString() !== userId.toString()) {
//       return res.status(403).json({ error: "Unauthorized" });
//     }

//     post.text = text || post.text;
//     post.codeBlocks = codeBlocks || post.codeBlocks;
//     if (req.files && req.files.length > 0) {
//       post.images = req.files.map((f) => f.path);
//     }

//     await post.save();
//     await post.populate("author", "name username profileImage");
//     res.json(post);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };



export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    post.text = req.body.text ?? post.text;

    let parsedBlocks = post.codeBlocks;

    if (req.body.codeBlocks) {
      try {
        parsedBlocks = JSON.parse(req.body.codeBlocks);
      } catch (err) {
        console.log("CodeBlock JSON parse error:", err);
      }
    }

    post.codeBlocks = parsedBlocks;

    // ----------------------------
    // IMAGES — FIXED COMPLETELY
    // Case 1: user uploaded NEW images → replace old
    // Case 2: no new upload → keep old images
    // ----------------------------
    if (req.files && req.files.length > 0) {
      post.images = req.files.map((f) => f.path);
    }

    await post.save();
    await post.populate("author", "name username profileImage");

    res.json(post);

  } catch (err) {
    console.error("updatePost ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};




export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Post.findByIdAndDelete(postId);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};