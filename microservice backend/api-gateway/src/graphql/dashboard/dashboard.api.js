import { GraphQLError } from "graphql";
import { getServiceUrl } from "../../config/services.js";

// Allow sufficient time for cold-starting cloud microservices (e.g. Render)
const SERVICE_TIMEOUT_MS = 20_000;

export async function requestDashboardService(serviceName, path, context) {
  const baseUrl = getServiceUrl(serviceName);
  if (!baseUrl) throw new Error(`Unknown dashboard data service: ${serviceName}`);

  const headers = { Accept: "application/json" };
  if (context.authorization) headers.Authorization = context.authorization;

  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
    headers,
    signal: AbortSignal.timeout(SERVICE_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`${serviceName} returned HTTP ${response.status}`);
  }

  return {
    data: await response.json(),
    headers: response.headers,
  };
}

export async function safeDashboardService(serviceName, path, context, defaultData = []) {
  try {
    return await requestDashboardService(serviceName, path, context);
  } catch (error) {
    console.warn(`[GraphQL dashboard safe] ${serviceName} request failed: ${error.message} - using fallback`);
    return {
      data: defaultData,
      headers: new Headers(),
    };
  }
}

export async function requireDashboardService(serviceName, path, context) {
  try {
    return await requestDashboardService(serviceName, path, context);
  } catch (error) {
    console.error(`[GraphQL dashboard] ${serviceName} request failed: ${error.message}`);
    throw new GraphQLError("Dashboard data is temporarily unavailable.", {
      extensions: { code: "DOWNSTREAM_SERVICE_ERROR" },
    });
  }
}
