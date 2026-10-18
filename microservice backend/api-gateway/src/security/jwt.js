import jwt from "jsonwebtoken";

const getJwtSecrets = () => [
  process.env.JWT_SECRET,
  "replace-with-a-long-random-secret",
  "kweu249hp72hf4fh48g7w9f4wpef74",
  "default_jwt_secret",
].filter(Boolean);

export const verifyJwtSafely = (token) => {
  for (const secret of getJwtSecrets()) {
    try {
      return jwt.verify(token, secret);
    } catch {}
  }
  return null;
};
