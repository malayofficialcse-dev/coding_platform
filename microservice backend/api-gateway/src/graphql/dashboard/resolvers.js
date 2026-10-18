import { GraphQLError } from "graphql";
import { requireViewer } from "../context.js";
import { mapPost } from "../profile/resolvers.js";
import { requireDashboardService } from "./dashboard.api.js";

const normalizeFollowers = (followers) =>
  Array.isArray(followers)
    ? followers.map((follower) =>
        String(follower?.id || follower?._id || follower)
      )
    : [];

function mapPerson(person, viewerId) {
  const id = person?.id || person?._id;
  if (!id) {
    throw new GraphQLError("A dashboard user is missing an ID.", {
      extensions: { code: "DOWNSTREAM_SERVICE_ERROR" },
    });
  }

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

const requireArray = (value, serviceName) => {
  if (!Array.isArray(value)) {
    console.error(`[GraphQL dashboard] ${serviceName} returned an unexpected response.`);
    throw new GraphQLError("Dashboard data is temporarily unavailable.", {
      extensions: { code: "DOWNSTREAM_SERVICE_ERROR" },
    });
  }
  return value;
};

export const dashboardResolvers = {
  Query: {
    homeDashboard: async (_root, { first }, context) => {
      const viewer = requireViewer(context);
      const limit = Math.min(Math.max(Number(first) || 20, 1), 50);

      const [usersResponse, recommendationsResponse, postsResponse] = await Promise.all([
        requireDashboardService("user", "/api/users", context),
        requireDashboardService("user", "/api/social/recommendations", context),
        requireDashboardService(
          "post",
          `/api/posts?group=${encodeURIComponent("General Feed")}&page=1&limit=${limit}`,
          context
        ),
      ]);

      const users = requireArray(usersResponse.data, "user service");
      const recommendations = requireArray(recommendationsResponse.data, "recommendations service");
      const posts = requireArray(postsResponse.data, "post service");

      return {
        users: users.map((person) => mapPerson(person, viewer.id)),
        recommendations: recommendations.map((person) => mapPerson(person, viewer.id)),
        posts: posts.map(mapPost),
        feedHasMore: postsResponse.headers.get("x-has-more") === "true",
      };
    },
  },
};
