import { GraphQLError } from "graphql";
import { verifyJwtSafely } from "../security/jwt.js";

export const createGraphQLContext = ({ req }) => {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(\S+)$/i);
  const decoded = match ? verifyJwtSafely(match[1]) : null;
  const userId = decoded?.userId || decoded?.id || decoded?._id;

  return {
    authorization: decoded ? authorization : "",
    viewer: userId
      ? {
          id: String(userId),
          role: decoded.role || "user",
          name: decoded.name || "",
          username: decoded.username || "",
          email: decoded.email || "",
          permissions: decoded.permissions || {},
        }
      : null,
  };
};

export const requireViewer = (context) => {
  if (!context.viewer) {
    throw new GraphQLError("Authentication required.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return context.viewer;
};
