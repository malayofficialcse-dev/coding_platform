import jwt from "jsonwebtoken";

export function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 64) {
    throw new Error("JWT_SECRET must be configured with at least 64 characters.");
  }
  const payload = jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: "code-campus-auth",
    audience: "code-campus-api",
  });
  if (payload.tokenUse !== "access") throw new Error("Invalid access token.");
  return payload;
}
