import { GraphQLError } from "graphql";
import { mapPost } from "../profile/resolvers.js";
import { requireDashboardService, safeDashboardService } from "./dashboard.api.js";

const normalizeFollowers = (followers) =>
  Array.isArray(followers)
    ? followers.map((follower) =>
      String(follower?.id || follower?._id || follower)
    )
    : [];

function mapPerson(person, viewerId) {
  const id = person?.id || person?._id;
  if (!id) return null;

  const followers = normalizeFollowers(person.followers);
  return {
    id: String(id),
    _id: String(id),
    name: person.name || null,
    username: person.username || null,
    profileImage: person.profileImage || null,
    followers,
    isFollowing: person.isFollowing ?? followers.includes(viewerId),
    degree: person.degree || null,
    recommendationReason: person.recommendationReason || null,
  };
}

const safeArray = (value) => (Array.isArray(value) ? value : []);

export const dashboardResolvers = {
  Query: {
    homeDashboard: async (_root, { first }, context) => {
      // Default to 10 posts per batch for low latency on cloud deployments
      const limit = Math.min(Math.max(Number(first) || 10, 1), 30);

      const [usersResponse, recommendationsResponse, postsResponse] = await Promise.all([
        safeDashboardService("user", "/v1/users", context, []),
        context.viewer
          ? safeDashboardService("user", "/v1/social/recommendations", context, [])
          : Promise.resolve({ data: [] }),
        safeDashboardService(
          "post",
          `/v1/posts?group=${encodeURIComponent("General Feed")}&page=1&limit=${limit}`,
          context,
          []
        ),
      ]);

      const users = safeArray(usersResponse.data);
      const recommendations = safeArray(recommendationsResponse.data);
      const posts = safeArray(postsResponse.data);
      const viewerId = context.viewer?.id || "";

      return {
        users: users.map((p) => mapPerson(p, viewerId)).filter(Boolean),
        recommendations: recommendations.map((p) => mapPerson(p, viewerId)).filter(Boolean),
        posts: posts.map(mapPost).filter(Boolean),
        feedHasMore: postsResponse.headers?.get ? postsResponse.headers.get("x-has-more") === "true" : posts.length === limit,
      };
    },
  },
};
