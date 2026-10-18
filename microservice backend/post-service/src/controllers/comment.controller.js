import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { dispatchNotification } from "../utils/serviceClient.js";
import { fetchUsersBatch } from "../utils/userHydration.js";

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
    console.warn("[Post Service] User mirror upsert failed:", err.message);
  }
};

export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Comment text cannot be empty" });
    }

    const post = await Post.findById(postId).populate("author");
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Ensure the commenter exists in MongoDB mirror so populate works
    await upsertUserMirror(req);

    const comment = new Comment({
      author: userId,
      post: postId,
      text: text.trim(),
    });

    await comment.save();

    post.comments.push(comment._id);
    await post.save();

    const userMap = await fetchUsersBatch([userId]);
    const authorData = userMap.get(String(userId)) || {
      _id: userId,
      name: req.user?.name || req.user?.username || "Code Campus Member",
      username: req.user?.username || "",
      profileImage: req.user?.profileImage || "",
      role: req.user?.role || "student",
    };

    // Notify author if commenter is someone else
    if (post.author?._id && post.author._id.toString() !== userId.toString()) {
      await dispatchNotification({
        recipientId: post.author._id,
        senderId: userId,
        type: "comment",
        post: postId,
        comment: comment._id,
        title: `${authorData.name || "A user"} commented on your post`,
        description: text.substring(0, 100),
        actionUrl: `/posts/${postId}`,
      });
    }

    const commentObj = comment.toObject();
    commentObj.author = authorData;
    res.status(201).json(commentObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (comment.author.toString() !== userId.toString() && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Comment.findByIdAndDelete(commentId);
    await Post.findByIdAndUpdate(postId, { $pull: { comments: commentId } });

    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate("author", "name username profileImage")
      .sort({ createdAt: 1 })
      .lean();

    const authorIds = comments.map((c) => (typeof c.author === "string" ? c.author : c.author?._id || c.author?.id)).filter(Boolean);
    const userMap = await fetchUsersBatch(authorIds);

    const enriched = comments.map((c) => {
      const aId = String(typeof c.author === "string" ? c.author : c.author?._id || c.author?.id || "");
      if (userMap.has(aId)) {
        c.author = userMap.get(aId);
      }
      return c;
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

