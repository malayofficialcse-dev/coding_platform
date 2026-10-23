import { GraphQLError } from "graphql";
import { JSONScalar } from "../json.scalar.js";
import { requireViewer } from "../context.js";
import { optionalProfileService, requireProfileService } from "./profile.api.js";

const userPath = (id) => `/v1/users/${encodeURIComponent(id)}`;
const isAdmin = (viewer) => ["admin", "super_admin"].includes(viewer.role);
const canViewLearning = (viewer, profileId) =>
  Boolean(viewer && (viewer.id === String(profileId) || isAdmin(viewer)));

const profileFields = [
  "id", "name", "username", "profileImage", "bannerImage", "role",
  "college", "degree", "yearOfPassing", "followers", "following",
  "followersCount", "followingCount",
];

function mapProfile(source) {
  if (!source) return null;
  const profile = Object.fromEntries(profileFields.map((field) => [field, source[field]]));
  profile.id = source.id || source._id;
  profile.followers = Array.isArray(source.followers) ? source.followers : [];
  profile.following = Array.isArray(source.following) ? source.following : [];
  profile.followersCount ??= profile.followers.length;
  profile.followingCount ??= profile.following.length;
  return profile;
}

function mapAuthor(author) {
  if (!author || typeof author !== "object") return author || null;
  return {
    id: author.id || author._id,
    _id: author._id || author.id,
    name: author.name,
    username: author.username,
    profileImage: author.profileImage,
  };
}

function mapComment(comment) {
  if (!comment || typeof comment !== "object") return null;
  return {
    _id: comment._id || comment.id,
    id: comment.id || comment._id,
    text: comment.text || "",
    createdAt: comment.createdAt || null,
    author: mapAuthor(comment.author),
  };
}

export function mapPost(post) {
  return {
    _id: post?._id || post?.id,
    id: post?.id || post?._id,
    text: post?.text || "",
    group: post?.group || "General Feed",
    createdAt: post?.createdAt || null,
    images: Array.isArray(post?.images) ? post.images : [],
    codeBlocks: Array.isArray(post?.codeBlocks) ? post.codeBlocks : [],
    author: mapAuthor(post?.author),
    likes: post?.likes ?? [],
    likedByMe: post?.likedByMe ?? null,
    repostedFrom: post?.repostedFrom || null,
    repostedPost: post?.repostedPost || null,
    comments: Array.isArray(post?.comments) ? post.comments.map(mapComment).filter(Boolean) : [],
  };
}

const emptyStats = {
  followersCount: 0,
  followingCount: 0,
  directConnections: 0,
  secondDegreeReach: 0,
  mutualCount: 0,
  influenceScore: 0,
};

const emptyTrail = {
  degree: "None",
  distance: null,
  isDirectFollowing: false,
  isFollowedBy: false,
  trail: [],
  mutualCount: 0,
};

export const profileResolvers = {
  JSON: JSONScalar,
  Query: {
    profilePage: (_root, { id, first }, context) => {
      requireViewer(context);
      if (!id || String(id).length > 128) {
        throw new GraphQLError("A valid profile ID is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      return { id: String(id), first };
    },
    myProfilePage: (_root, { id, first }, context) => {
      const viewer = requireViewer(context);
      if (viewer.id !== String(id)) {
        throw new GraphQLError("You can only load your own profile with this operation.", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      return { id: String(id), first };
    },
  },
  ProfilePage: {
    profile: async ({ id }, _args, context) => {
      const source = await requireProfileService("user", userPath(id), context);
      return mapProfile(source);
    },
    posts: async ({ id, first }, _args, context) => {
      const limit = Math.min(Math.max(Number(first) || 20, 1), 50);
      const path = `/v1/posts/user/${encodeURIComponent(id)}?page=1&limit=${limit}`;
      const posts = await optionalProfileService("post", path, context, []);
      return (Array.isArray(posts) ? posts : []).map(mapPost);
    },
    social: ({ id }, _args, context) => {
      return { id, viewerId: context.viewer?.id || null };
    },
    learning: ({ id }, _args, context) => {
      const viewer = context.viewer;
      return {
        id,
        viewerId: viewer?.id || null,
        canView: canViewLearning(viewer, id),
        isOwner: viewer?.id === String(id),
      };
    },
  },
  ProfileSocial: {
    stats: async ({ id, viewerId }, _args, context) => {
      if (!viewerId) return null;
      return (await optionalProfileService(
        "user",
        `/v1/social/stats/${encodeURIComponent(id)}`,
        context,
        emptyStats
      )) || emptyStats;
    },
    trail: async ({ id, viewerId }, _args, context) => {
      if (!viewerId || id === viewerId) return null;
      return (await optionalProfileService(
        "user",
        `/v1/social/trail/${encodeURIComponent(id)}`,
        context,
        emptyTrail
      )) || emptyTrail;
    },
    mutual: async ({ id, viewerId }, _args, context) => {
      if (!viewerId || id === viewerId) return null;
      return (await optionalProfileService(
        "user",
        `/v1/social/mutual/${encodeURIComponent(id)}`,
        context,
        { count: 0, users: [] }
      )) || { count: 0, users: [] };
    },
  },
  ProfileLearning: {
    enrollments: async ({ id, viewerId, canView }, _args, context) => {
      if (!canView) return [];
      const path = id === viewerId
        ? "/v1/enrollments/my"
        : `/v1/enrollments/user/${encodeURIComponent(id)}`;
      const result = await optionalProfileService("enrollment", path, context, []);
      return Array.isArray(result) ? result : [];
    },
    attempts: async ({ id, viewerId, canView }, _args, context) => {
      if (!canView) return [];
      const path = id === viewerId
        ? "/v1/attempts/my"
        : `/v1/attempts/user/${encodeURIComponent(id)}`;
      const result = await optionalProfileService("exam", path, context, []);
      return Array.isArray(result) ? result : [];
    },
    codingSubmissions: async ({ isOwner }, _args, context) => {
      if (!isOwner) return [];
      const result = await optionalProfileService(
        "coding",
        "/v1/coding/submissions/my",
        context,
        []
      );
      return Array.isArray(result) ? result : [];
    },
    courses: async (learning, _args, context) => {
      if (!learning.canView) return [];
      const enrollments = await profileResolvers.ProfileLearning.enrollments(learning, {}, context);
      return enrollments.map((enrollment) => enrollment.course).filter(Boolean);
    },
    exams: async (learning, _args, context) => {
      if (!learning.canView) return [];
      const attempts = await profileResolvers.ProfileLearning.attempts(learning, {}, context);
      return attempts.map((attempt) => attempt.exam).filter(Boolean);
    },
  },
};
