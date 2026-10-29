import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import User from "../models/User.js";
import { createSession, DEFAULT_PERMISSIONS } from "./auth.controller.js";

const STATE_COOKIE_NAME = "oauth_state";

const isAllowedOAuthUrl = (parsed) => {
  if (parsed.username || parsed.password) return false;
  if (parsed.protocol === "https:") return true;
  const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  return parsed.protocol === "http:" &&
    (process.env.NODE_ENV !== "production" || isLocalHost);
};

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction || process.env.REFRESH_COOKIE_SECURE === "true",
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 10 * 60 * 1000, // 10 minutes
  };
};

const getClientUrl = () => {
  const localClientUrl = "http://localhost:5173";
  const configuredUrl = process.env.CLIENT_URL || (
    process.env.NODE_ENV === "production" ? "" : localClientUrl
  );
  if (!configuredUrl) return null;
  try {
    const parsed = new URL(configuredUrl);
    if (!isAllowedOAuthUrl(parsed)) return null;
    return parsed.origin;
  } catch {
    return null;
  }
};

const getGatewayUrl = () => {
  if (process.env.PUBLIC_API_URL) {
    try {
      const parsed = new URL(process.env.PUBLIC_API_URL);
      if (isAllowedOAuthUrl(parsed)) return parsed.origin;
    } catch {
      return null;
    }
    return null;
  }
  return process.env.NODE_ENV === "production" ? null : "http://localhost:5100";
};

const getOAuthStateSecret = () => {
  const secret = process.env.JWT_SECRET;
  return secret && secret.length >= 64 ? secret : null;
};

const generateSecureState = (provider, secret) => {
  const nonce = randomBytes(24).toString("base64url");
  const signature = createHmac("sha256", secret).update(`${provider}:${nonce}`).digest("base64url");
  return `${provider}.${nonce}.${signature}`;
};

const verifySecureState = (stateString, expectedProvider) => {
  if (!stateString || typeof stateString !== "string") return false;
  const parts = stateString.split(".");
  if (parts.length !== 3) return false;
  const [provider, nonce, signature] = parts;
  if (provider !== expectedProvider) return false;

  const secret = getOAuthStateSecret();
  if (!secret) return false;
  const expectedSig = createHmac("sha256", secret).update(`${provider}:${nonce}`).digest("base64url");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  } catch {
    return false;
  }
};

const getStateCookie = (req) => {
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${STATE_COOKIE_NAME}=`));
  if (!cookie) return "";
  try {
    return decodeURIComponent(cookie.slice(STATE_COOKIE_NAME.length + 1));
  } catch {
    return "";
  }
};

const hasValidBrowserState = (req, state, provider) => {
  const cookieState = getStateCookie(req);
  return typeof state === "string" &&
    Boolean(cookieState) &&
    cookieState === state &&
    verifySecureState(state, provider);
};

/**
 * Common user provisioning logic across OAuth providers
 */
const findOrCreateOAuthUser = async ({ email, name, avatar, provider, providerId }) => {
  const cleanEmail = (email || "").toLowerCase().trim();
  const idField = provider === "google" ? "googleId" : "githubId";

  // 1. Try finding by provider ID
  let user = await User.findOne({ where: { [idField]: String(providerId) } });
  if (user) {
    // Keep avatar updated if empty
    if (!user.profileImage && avatar) {
      user.profileImage = avatar;
      await user.save();
    }
    return user;
  }

  // 2. Try linking to existing account with the same verified email
  if (cleanEmail) {
    user = await User.findOne({ where: { email: cleanEmail } });
    if (user) {
      user[idField] = String(providerId);
      if (!user.profileImage && avatar) {
        user.profileImage = avatar;
      }
      await user.save();
      return user;
    }
  }

  // 3. Create a brand new user
  const baseName = name || cleanEmail.split("@")[0] || `coder_${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanBase = cleanEmail ? cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") : "user";
  const uniqueUsername = `${cleanBase}_${Math.floor(1000 + Math.random() * 9000)}`;

  const role = "student";
  const permissions = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.student;

  user = await User.create({
    name: baseName,
    username: uniqueUsername,
    email: cleanEmail || `${provider}_${providerId}@users.codecampus.local`,
    password: null, // Null password for OAuth users
    role,
    profileImage: avatar || "",
    authProvider: provider,
    [idField]: String(providerId),
    permissions,
    isActive: true,
  });

  return user;
};

// ============================================================================
// GOOGLE OAUTH
// ============================================================================

export const initiateGoogleAuth = async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({
      error: "Google OAuth is not configured on this server.",
      details: "Missing GOOGLE_CLIENT_ID environment variable.",
    });
  }
  const stateSecret = getOAuthStateSecret();
  if (!stateSecret) {
    return res.status(503).json({ error: "OAuth state signing is not securely configured." });
  }

  const gatewayUrl = getGatewayUrl();
  if (!process.env.GOOGLE_CALLBACK_URL && !gatewayUrl) {
    return res.status(503).json({ error: "Google OAuth callback URL is not securely configured." });
  }
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL || `${gatewayUrl}/v1/auth/google/callback`;

  const state = generateSecureState("google", stateSecret);
  res.cookie(STATE_COOKIE_NAME, state, getCookieOptions());

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", state);

  return res.redirect(googleAuthUrl.toString());
};

export const handleGoogleCallback = async (req, res) => {
  const clientUrl = getClientUrl();
  if (!clientUrl) {
    return res.status(503).json({ error: "OAuth client redirect URL is not securely configured." });
  }
  const { code, state, error } = req.query;

  const validState = hasValidBrowserState(req, state, "google");
  res.clearCookie(STATE_COOKIE_NAME, getCookieOptions());
  if (!validState) {
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Invalid or expired OAuth state (CSRF detected).")}`);
  }

  if (error) {
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(`Google sign-in cancelled: ${error}`)}`);
  }

  if (!code) {
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Missing authorization code from Google.")}`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const gatewayUrl = getGatewayUrl();
    if (!process.env.GOOGLE_CALLBACK_URL && !gatewayUrl) {
      return res.status(503).json({ error: "Google OAuth callback URL is not securely configured." });
    }
    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL || `${gatewayUrl}/v1/auth/google/callback`;

    // 1. Exchange authorization code for Google access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Google OAuth Error] Token exchange failed:", tokenData);
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Failed to exchange code with Google.")}`);
    }

    // 2. Fetch user profile from Google UserInfo endpoint
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email) {
      console.error("[Google OAuth Error] Failed to fetch profile:", profile);
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Unable to retrieve Google profile data.")}`);
    }

    // 3. Find or create the user in database
    const user = await findOrCreateOAuthUser({
      email: profile.email,
      name: profile.name,
      avatar: profile.picture,
      provider: "google",
      providerId: profile.sub,
    });

    if (user.isActive === false) {
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Your account is deactivated.")}`);
    }

    // 4. Create local session & refresh cookie
    const session = await createSession(user, req, res);

    // 5. Redirect to client with the short-lived access token
    return res.redirect(`${clientUrl}/oauth-callback?token=${encodeURIComponent(session.accessToken)}`);
  } catch (err) {
    console.error("[Google OAuth Callback Exception]:", err);
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Server error during Google authentication.")}`);
  }
};

/**
 * Endpoint for Google Identity Services (One-Tap / Fast Login)
 * POST /v1/auth/google/credential
 */
export const handleGoogleCredential = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: "Missing Google ID token credential." });
    }

    // Verify token with Google's tokeninfo endpoint
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const payload = await verifyRes.json();

    if (!verifyRes.ok || !payload.email) {
      return res.status(401).json({ error: "Invalid or expired Google credential." });
    }

    // Check audience if configured
    if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: "Google ID token audience mismatch." });
    }

    const user = await findOrCreateOAuthUser({
      email: payload.email,
      name: payload.name,
      avatar: payload.picture,
      provider: "google",
      providerId: payload.sub,
    });

    if (user.isActive === false) {
      return res.status(403).json({ error: "Your account is deactivated." });
    }

    const session = await createSession(user, req, res);
    return res.json(session);
  } catch (err) {
    console.error("[Google Credential Exception]:", err);
    return res.status(500).json({ error: "Failed to authenticate Google credential." });
  }
};

// ============================================================================
// GITHUB OAUTH
// ============================================================================

export const initiateGitHubAuth = async (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({
      error: "GitHub OAuth is not configured on this server.",
      details: "Missing GITHUB_CLIENT_ID environment variable.",
    });
  }
  const stateSecret = getOAuthStateSecret();
  if (!stateSecret) {
    return res.status(503).json({ error: "OAuth state signing is not securely configured." });
  }

  const gatewayUrl = getGatewayUrl();
  if (!process.env.GITHUB_CALLBACK_URL && !gatewayUrl) {
    return res.status(503).json({ error: "GitHub OAuth callback URL is not securely configured." });
  }
  const callbackUrl =
    process.env.GITHUB_CALLBACK_URL || `${gatewayUrl}/v1/auth/github/callback`;

  const state = generateSecureState("github", stateSecret);
  res.cookie(STATE_COOKIE_NAME, state, getCookieOptions());

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  githubAuthUrl.searchParams.set("scope", "read:user user:email");
  githubAuthUrl.searchParams.set("state", state);

  return res.redirect(githubAuthUrl.toString());
};

export const handleGitHubCallback = async (req, res) => {
  const clientUrl = getClientUrl();
  if (!clientUrl) {
    return res.status(503).json({ error: "OAuth client redirect URL is not securely configured." });
  }
  const { code, state, error } = req.query;

  const validState = hasValidBrowserState(req, state, "github");
  res.clearCookie(STATE_COOKIE_NAME, getCookieOptions());
  if (!validState) {
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Invalid or expired OAuth state (CSRF detected).")}`);
  }

  if (error) {
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(`GitHub sign-in cancelled: ${error}`)}`);
  }

  if (!code) {
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Missing authorization code from GitHub.")}`);
  }

  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const gatewayUrl = getGatewayUrl();
    if (!process.env.GITHUB_CALLBACK_URL && !gatewayUrl) {
      return res.status(503).json({ error: "GitHub OAuth callback URL is not securely configured." });
    }
    const callbackUrl =
      process.env.GITHUB_CALLBACK_URL || `${gatewayUrl}/v1/auth/github/callback`;

    // 1. Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[GitHub OAuth Error] Token exchange failed:", tokenData);
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Failed to exchange code with GitHub.")}`);
    }

    // 2. Fetch user profile
    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "Code-Campus-OAuth",
      },
    });
    const profile = await profileRes.json();

    // 3. GitHub users may have email set to private; fetch emails if needed
    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "User-Agent": "Code-Campus-OAuth",
        },
      });
      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        const primary = emails.find((e) => e.primary && e.verified) || emails[0];
        if (primary) email = primary.email;
      }
    }

    const user = await findOrCreateOAuthUser({
      email,
      name: profile.name || profile.login,
      avatar: profile.avatar_url,
      provider: "github",
      providerId: profile.id,
    });

    if (user.isActive === false) {
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Your account is deactivated.")}`);
    }

    const session = await createSession(user, req, res);
    res.clearCookie(STATE_COOKIE_NAME, getCookieOptions());

    return res.redirect(`${clientUrl}/oauth-callback?token=${encodeURIComponent(session.accessToken)}`);
  } catch (err) {
    console.error("[GitHub OAuth Callback Exception]:", err);
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Server error during GitHub authentication.")}`);
  }
};
