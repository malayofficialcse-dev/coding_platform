import Post from "../models/Post.js";
import Comment from "../models/Comment.js";

/**
 * Dashboard Controller for Post Service
 * Handles administrative post controls and platform analytics
 */

// 1. Get all posts for admin moderation dashboard
export const getAllPostsAdmin = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name username email profileImage role")
      .populate("comments")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts for admin dashboard", details: err.message });
  }
};

// 2. Admin delete any post
export const deleteAnyPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const deleted = await Post.findByIdAndDelete(postId);
    if (!deleted) return res.status(404).json({ error: "Post not found" });

    await Comment.deleteMany({ post: postId });
    res.json({ message: "Post deleted successfully by admin", postId });
  } catch (err) {
    res.status(500).json({ error: "Server error deleting post" });
  }
};

// 3. Admin update any post
export const updateAnyPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const updated = await Post.findByIdAndUpdate(postId, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Post not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error updating post" });
  }
};

// 4. Create post as admin
export const createPostAsAdmin = async (req, res) => {
  try {
    const { title, text, content, group, author } = req.body;
    const postAuthor = author || req.user?._id || req.user?.id;

    const post = new Post({
      author: postAuthor,
      text: text || content || title,
      group: group || "Official Announcements",
    });

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: "Server error creating admin post" });
  }
};

// 5. Aggregate metrics for Post Dashboard Overview
export const getPostDashboardMetrics = async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();

    // Aggregate total likes across all posts
    const likeAggregation = await Post.aggregate([
      { $project: { numberOfLikes: { $size: { $ifNull: ["$likes", []] } } } },
      { $group: { _id: null, totalLikes: { $sum: "$numberOfLikes" } } },
    ]);
    const totalLikes = likeAggregation.length > 0 ? likeAggregation[0].totalLikes : 0;

    // Group posts by category/group
    const postsByGroup = await Post.aggregate([
      { $group: { _id: "$group", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top 5 trending posts by likes
    const trendingPosts = await Post.aggregate([
      { $project: { text: 1, author: 1, group: 1, createdAt: 1, likeCount: { $size: { $ifNull: ["$likes", []] } }, commentCount: { $size: { $ifNull: ["$comments", []] } } } },
      { $sort: { likeCount: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      totalPosts,
      totalComments,
      totalLikes,
      postsByGroup,
      trendingPosts,
    });
  } catch (err) {
    res.status(500).json({ error: "Error compiling post dashboard analytics", details: err.message });
  }
};
