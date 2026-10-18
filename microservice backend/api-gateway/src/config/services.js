const SERVICE_CONFIG = Object.freeze({
  auth: ["AUTH_SERVICE_URL", "http://localhost:5001"],
  user: ["USER_SERVICE_URL", "http://localhost:5002"],
  post: ["POST_SERVICE_URL", "http://localhost:5003"],
  exam: ["EXAM_SERVICE_URL", "http://localhost:5004"],
  course: ["COURSE_SERVICE_URL", "http://localhost:5005"],
  enrollment: ["ENROLLMENT_SERVICE_URL", "http://localhost:5006"],
  coding: ["CODING_SERVICE_URL", "http://localhost:5007"],
  notification: ["NOTIFICATION_SERVICE_URL", "http://localhost:5008"],
  chat: ["CHAT_SERVICE_URL", "http://localhost:5009"],
});

export const getServiceUrl = (name) => {
  const config = SERVICE_CONFIG[name];
  return config ? process.env[config[0]] || config[1] : null;
};

export const getServices = () =>
  Object.fromEntries(Object.keys(SERVICE_CONFIG).map((name) => [name, getServiceUrl(name)]));
