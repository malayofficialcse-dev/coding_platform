import jwt from "jsonwebtoken";

export const verifyJwtSafely = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 64) return null;
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: "code-campus-auth",
      audience: "code-campus-api",
    });
    return payload.tokenUse === "access" ? payload : null;
  } catch {
    return null;
  }
};
