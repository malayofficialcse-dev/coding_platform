import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { createGraphQLContext } from "./context.js";
import { operationLimitsRule } from "./operation-limits.js";
import { dashboardResolvers } from "./dashboard/resolvers.js";
import { profileResolvers } from "./profile/resolvers.js";

const schemaPath = fileURLToPath(new URL("./schema.gql", import.meta.url));
const typeDefs = await readFile(schemaPath, "utf8");
const resolvers = {
  ...profileResolvers,
  Query: {
    ...profileResolvers.Query,
    ...dashboardResolvers.Query,
  },
};

export async function mountGraphQL(app) {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    validationRules: [operationLimitsRule],
    introspection: process.env.NODE_ENV !== "production",
    csrfPrevention: true,
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== "production",
    formatError(formattedError) {
      if (formattedError.extensions?.code === "INTERNAL_SERVER_ERROR") {
        return {
          message: "Internal server error.",
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        };
      }
      return formattedError;
    },
  });

  await server.start();
  app.use(
    "/api/graphql",
    express.json({ limit: "256kb" }),
    expressMiddleware(server, { context: createGraphQLContext })
  );
  return server;
}
