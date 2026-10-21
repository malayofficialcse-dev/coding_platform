import jwt from "jsonwebtoken";

const issuer = "code-campus-auth";
const audience = "code-campus-api";

export function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 64) {
    throw new Error("JWT_SECRET must be configured with at least 64 characters.");
  }

  const payload = jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer,
    audience,
  });
  if (payload.tokenUse !== "access") {
    throw new Error("Invalid access token.");
  }
  return payload;
}
