import { useState } from "react";
import {
  Heart,
  MessageCircle,
  MessageSquareText,
  Send,
  UsersRound,
} from "lucide-react";
import { api, getItems } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useResource } from "../lib/useResource";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  PageHeading,
  Panel,
  ResourceState,
} from "../components/ui";

const groups = [
  "General Feed",
  "Python Learners",
  "JavaScript Hub",
  "Java Specialists",
  "Algorithms & DS",
  "Web Dev Bootcamp",
];

export function CommunityPage() {
  const { user } = useAuth();
  const [activeGroup, setActiveGroup] = useState("General Feed");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState("");
  const {
    data: posts,
    loading,
    error,
    reload,
    setData: setPosts,
  } = useResource(
    () =>
      api(`/posts?group=${encodeURIComponent(activeGroup)}`).then((result) =>
        getItems(result, ["posts", "data"]),
      ),
    [activeGroup],
  );

  async function publish(event) {
    event.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    setNotice("");
    try {
      const body = new FormData();
      body.set("text", text.trim());
      body.set("group", activeGroup);
      await api("/posts", { method: "POST", body });
      setText("");
      setNotice("Your post has been published.");
      reload();
    } catch (reason) {
      setNotice(reason.message || "We couldn’t publish your post.");
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(post) {
    const userId = String(user?._id || user?.id);
    const currentLikes = Array.isArray(post.likes) ? post.likes : [];
    const liked = currentLikes.some(
      (like) => String(like?._id || like) === userId,
    );
    const path = `/posts/${liked ? "unlike" : "like"}/${post._id}`;
    try {
      const result = await api(path, { method: "POST" });
      setPosts((current) =>
        (current || []).map((item) =>
          item._id === post._id
            ? {
                ...item,
                likes: liked
                  ? currentLikes.filter(
                      (like) => String(like?._id || like) !== userId,
                    )
                  : [...currentLikes, userId],
                likesCount:
                  typeof result.likes === "number"
                    ? result.likes
                    : liked
                      ? currentLikes.length - 1
                      : currentLikes.length + 1,
              }
            : item,
        ),
      );
    } catch (reason) {
      setNotice(reason.message || "We couldn’t update this reaction.");
    }
  }

  async function addComment(postId, commentText) {
    const result = await api(`/posts/${postId}/comments`, {
      method: "POST",
      body: { text: commentText },
    });
    setPosts((current) =>
      (current || []).map((post) =>
        post._id === postId
          ? { ...post, comments: [...(post.comments || []), result] }
          : post,
      ),
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow="Learn together"
        title="Community"
        description="Share what you’re learning, ask questions, and help other developers move forward."
        action={
          <Badge tone="brand">
            <UsersRound size={14} className="mr-1.5" /> {activeGroup}
          </Badge>
        }
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {groups.map((group) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`shrink-0 border px-3 py-2 text-xs font-semibold transition-colors ${
              activeGroup === group
                ? "border-brand bg-brand text-white"
                : "border-line bg-surface text-muted hover:border-brand hover:text-brand"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {user ? (
        <Panel className="mb-5 p-4 sm:p-5">
          <form onSubmit={publish}>
            <label className="sr-only" htmlFor="community-post">
              Share with the community
            </label>
            <textarea
              id="community-post"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={`Share something with ${activeGroup}…`}
              rows={3}
              maxLength={4000}
              className="w-full resize-y border border-line bg-surface px-3 py-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-muted">
                {text.length}/4000 characters
              </span>
              <Button type="submit" disabled={posting || !text.trim()}>
                <Send size={15} /> {posting ? "Publishing…" : "Publish"}
              </Button>
            </div>
          </form>
          {notice && (
            <p role="status" className="mt-3 text-sm text-brand">
              {notice}
            </p>
          )}
        </Panel>
      ) : (
        <Panel className="mb-5 flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold">Join the conversation</h2>
            <p className="mt-1 text-sm text-muted">
              Sign in to publish posts, react, and comment.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex min-h-10 items-center bg-brand px-4 text-sm font-semibold text-white"
          >
            Sign in to participate
          </Link>
        </Panel>
      )}

      {!user && notice && (
        <p role="status" className="mb-4 text-sm text-negative">
          {notice}
        </p>
      )}

      <ResourceState
        loading={loading}
        error={error}
        onRetry={reload}
        empty="No posts in this group yet. Start the conversation."
      >
        <div className="mx-auto grid max-w-3xl gap-4">
          {(posts || []).map((post) => (
            <PostCard
              key={post._id}
              post={post}
              user={user}
              onLike={() => toggleLike(post)}
              onComment={(value) => addComment(post._id, value)}
            />
          ))}
        </div>
      </ResourceState>
    </div>
  );
}

function PostCard({ post, user, onLike, onComment }) {
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const author = post.author || {};
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const likes =
    post.likesCount ??
    (Array.isArray(post.likes) ? post.likes.length : Number(post.likes || 0));
  const liked =
    Array.isArray(post.likes) &&
    post.likes.some(
      (like) => String(like?._id || like) === String(user?._id || user?.id),
    );

  async function submitComment(event) {
    event.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    setCommentError("");
    try {
      await onComment(comment.trim());
      setComment("");
    } catch (reason) {
      setCommentError(reason.message || "We couldn’t add your comment.");
    } finally {
      setCommenting(false);
    }
  }

  return (
    <Panel className="p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center bg-brand-soft text-sm font-semibold text-brand">
          {(author.name || author.username || "C").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {author.name || author.username || "Code Campus learner"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {author.username ? `@${author.username} · ` : ""}
            {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Recently"}
          </p>
        </div>
        {post.group && <Badge>{post.group}</Badge>}
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink">
        {post.text || post.content || post.title}
      </p>

      {Array.isArray(post.images) && post.images.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {post.images.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`Post attachment ${index + 1}`}
              className="max-h-80 w-full border border-line object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-5 border-y border-line py-3 text-xs text-muted">
        <span>{likes} reactions</span>
        <span>{comments.length} comments</span>
      </div>
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={onLike}
          disabled={!user}
          className={`inline-flex items-center gap-2 px-2 py-2 text-xs font-semibold ${
            liked ? "text-negative" : "text-muted hover:text-negative"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
          {liked ? "Liked" : "Like"}
        </button>
        <span className="inline-flex items-center gap-2 px-2 py-2 text-xs font-semibold text-muted">
          <MessageCircle size={16} /> Comment
        </span>
      </div>

      {comments.length > 0 && (
        <div className="grid gap-2 border-t border-line pt-3">
          {comments.slice(-4).map((item, index) => (
            <div
              key={item._id || index}
              className="border border-line bg-surface-subtle px-3 py-2"
            >
              <p className="text-xs font-semibold">
                {item.author?.name || item.author?.username || "Learner"}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                {item.text || item.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {user && (
        <form onSubmit={submitComment} className="mt-3 flex gap-2">
          <label className="sr-only" htmlFor={`comment-${post._id}`}>
            Add a comment
          </label>
          <input
            id={`comment-${post._id}`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Write a comment…"
            maxLength={1000}
            className="h-10 min-w-0 flex-1 border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            disabled={commenting || !comment.trim()}
            aria-label="Send comment"
            className="grid size-10 shrink-0 place-items-center bg-brand text-white hover:bg-brand-strong disabled:opacity-50"
          >
            <MessageSquareText size={16} />
          </button>
        </form>
      )}
      {commentError && (
        <p role="alert" className="mt-2 text-xs text-negative">
          {commentError}
        </p>
      )}
    </Panel>
  );
}
