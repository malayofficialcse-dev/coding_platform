import { GraphQLError } from "graphql";
import { getServiceUrl } from "../../config/services.js";

const SERVICE_TIMEOUT_MS = 8_000;

export async function requestProfileService(serviceName, path, context) {
  const baseUrl = getServiceUrl(serviceName);
  if (!baseUrl) throw new Error(`Unknown profile data service: ${serviceName}`);

  const headers = { Accept: "application/json" };
  if (context.authorization) headers.Authorization = context.authorization;

  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;
  const response = await fetch(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(SERVICE_TIMEOUT_MS),
  });

  if (!response.ok) {
    const error = new Error(`${serviceName} returned HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function optionalProfileService(serviceName, path, context, fallback) {
  try {
    return await requestProfileService(serviceName, path, context);
  } catch (error) {
    console.warn(`[GraphQL profile] ${serviceName} request failed: ${error.message}`);
    return fallback;
  }
}

export async function requireProfileService(serviceName, path, context) {
  try {
    return await requestProfileService(serviceName, path, context);
  } catch (error) {
    if (error.status === 404) {
      throw new GraphQLError("Profile not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    console.error(`[GraphQL profile] ${serviceName} request failed: ${error.message}`);
    throw new GraphQLError("Profile data is temporarily unavailable.", {
      extensions: { code: "DOWNSTREAM_SERVICE_ERROR" },
    });
  }
}
