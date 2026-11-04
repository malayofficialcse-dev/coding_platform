const SERVICE_CONFIG = Object.freeze({
  auth: { env: "AUTH_SERVICE_URL", legacyProductionEnv: "Auth_Service", localUrl: "http://localhost:5001" },
  user: { env: "USER_SERVICE_URL", localUrl: "http://localhost:5002" },
  post: { env: "POST_SERVICE_URL", legacyProductionEnv: "Post_Service", localUrl: "http://localhost:5003" },
  exam: { env: "EXAM_SERVICE_URL", legacyProductionEnv: "Exam_Service", localUrl: "http://localhost:5004" },
  course: { env: "COURSE_SERVICE_URL", legacyProductionEnv: "Course_Service", localUrl: "http://localhost:5005" },
  enrollment: { env: "ENROLLMENT_SERVICE_URL", legacyProductionEnv: "Enrollment_Service", localUrl: "http://localhost:5006" },
  coding: { env: "CODING_SERVICE_URL", legacyProductionEnv: "Coding_Service", localUrl: "http://localhost:5007" },
  notification: { env: "NOTIFICATION_SERVICE_URL", legacyProductionEnv: "Notification_Service", localUrl: "http://localhost:5008" },
  chat: { env: "CHAT_SERVICE_URL", legacyProductionEnv: "Chat_Service", localUrl: "http://localhost:5009" },
  mentor: { env: "MENTOR_SERVICE_URL", legacyProductionEnv: "Mentor_Service", localUrl: "http://localhost:5010" },
  ai: { env: "AI_SERVICE_URL", legacyProductionEnv: "Ai_service", localUrl: "http://localhost:5011" },
});

const isProduction = () =>
  process.env.RENDER === "true" ||
  (process.env.APP_ENV || process.env.NODE_ENV || "local").toLowerCase() === "production";

export const getServiceUrl = (name) => {
  const config = SERVICE_CONFIG[name];
  if (!config) return null;

  if (isProduction()) {
    const url =
      process.env[`PRODUCTION_${config.env}`] ||
      (config.legacyProductionEnv && process.env[config.legacyProductionEnv]) ||
      process.env[config.env];

    if (!url) {
      throw new Error(`${config.env} must be set to the deployed service URL in production.`);
    }

    const normalizedUrl = url.replace(/\/+$/, "");
    const parsedUrl = new URL(normalizedUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error(`${config.env} must use http:// or https:// in production.`);
    }
    if (["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname)) {
      throw new Error(`${config.env} points to localhost in production; set its deployed service URL.`);
    }

    return normalizedUrl;
  }

  return (process.env[`LOCAL_${config.env}`] || process.env[config.env] || config.localUrl)
    .replace(/\/+$/, "");
};

export const getServices = () =>
  Object.fromEntries(Object.keys(SERVICE_CONFIG).map((name) => [name, getServiceUrl(name)]));
