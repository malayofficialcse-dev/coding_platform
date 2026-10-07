import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { dispatchNotification } from "../utils/serviceClient.js";

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

    const comment = new Comment({
      author: userId,
      post: postId,
      text: text.trim(),
    });

    await comment.save();
    await comment.populate("author", "name username profileImage");

    post.comments.push(comment._id);
    await post.save();

    // Notify author if commenter is someone else
    if (post.author?._id && post.author._id.toString() !== userId.toString()) {
      await dispatchNotification({
        recipientId: post.author._id,
        senderId: userId,
        type: "comment",
        post: postId,
        comment: comment._id,
        title: `${req.user?.name || req.user?.username || "A user"} commented on your post`,
        description: text.substring(0, 100),
        actionUrl: `/posts/${postId}`,
      });
    }

    res.status(201).json(comment);
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
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

