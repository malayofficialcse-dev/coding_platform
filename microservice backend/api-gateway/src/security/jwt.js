import jwt from "jsonwebtoken";

export const verifyJwtSafely = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 64) return null;
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
};
