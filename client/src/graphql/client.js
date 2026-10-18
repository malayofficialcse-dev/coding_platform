import api from "../api/api";

export class GraphQLOperationError extends Error {
  constructor(errors) {
    super(errors.map((error) => error.message).filter(Boolean).join("\n") || "GraphQL request failed.");
    this.name = "GraphQLOperationError";
    this.errors = errors;
  }
}

export async function executeGraphQL(query, variables, operationName) {
  let response;
  try {
    response = await api.post("/graphql", { query, variables, operationName });
  } catch (error) {
    const errors = error.response?.data?.errors;
    if (Array.isArray(errors) && errors.length) {
      throw new GraphQLOperationError(errors);
    }
    throw error;
  }

  const { data, errors } = response.data || {};

  if (errors?.length) throw new GraphQLOperationError(errors);
  if (!data) throw new Error("GraphQL returned an empty response.");
  return data;
}
