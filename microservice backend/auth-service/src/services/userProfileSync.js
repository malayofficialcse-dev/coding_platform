const PROFILE_FIELDS = [
  "id",
  "name",
  "username",
  "email",
  "role",
  "college",
  "degree",
  "yearOfPassing",
  "profileImage",
  "bannerImage",
  "isActive",
  "createdBy",
  "permissions",
  "googleId",
  "githubId",
  "authProvider",
];

const syncError = (message) => Object.assign(new Error(message), {
  code: "USER_PROFILE_SYNC_FAILED",
});

export const syncUserProfile = async (user) => {
  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
  const serviceUrl = process.env.USER_SERVICE_URL ||
    (isProduction ? "" : "http://localhost:5002");
  const token = process.env.INTERNAL_SERVICE_TOKEN || "";
  if (!serviceUrl) {
    throw syncError("USER_SERVICE_URL is required for Auth profile synchronization.");
  }
  if (!token) {
    throw syncError("INTERNAL_SERVICE_TOKEN is required for Auth profile synchronization.");
  }

  const source = typeof user?.toJSON === "function" ? user.toJSON() : user;
  const profile = Object.fromEntries(
    PROFILE_FIELDS
      .filter((field) => source?.[field] !== undefined)
      .map((field) => [field, source[field]])
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const endpoint = new URL("/v1/users/internal/sync", serviceUrl);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-service-token": token,
      },
      body: JSON.stringify({ profile }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw syncError(`User Service profile synchronization failed (${response.status}).`);
    }
  } catch (error) {
    if (error.code === "USER_PROFILE_SYNC_FAILED") throw error;
    throw syncError("User Service profile synchronization could not be completed.");
  } finally {
    clearTimeout(timeout);
  }
};
