import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authRequire = createRequire(
  new URL("../auth-service/package.json", import.meta.url)
);
const dotenv = authRequire("dotenv");
const bcrypt = authRequire("bcryptjs");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const email = process.argv[2]?.trim().toLowerCase();

const readHidden = (prompt) => {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal to enter the password privately.");
  }

  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          process.stdout.write("\n");
          reject(new Error("Password reset cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u0008" || character === "\u007f") {
          value = Array.from(value).slice(0, -1).join("");
        } else if (character >= " ") {
          value += character;
        }
      }
    };

    process.stdout.write(prompt);
    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
};

const resetPassword = async () => {
  if (process.argv.includes("--help")) {
    console.log("Usage: npm run reset:auth-password -- <account-email>");
    console.log("Requires AUTH_DATABASE_URL; uses AUTH_DATABASE_URL_UNPOOLED when set.");
    return;
  }
  if (process.argv.length !== 3 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: npm run reset:auth-password -- <account-email>");
  }
  const authDatabaseUrl = (
    process.env.AUTH_DATABASE_URL_UNPOOLED || process.env.AUTH_DATABASE_URL || ""
  ).replace(/^"|"$/g, "");
  if (!authDatabaseUrl) {
    throw new Error(
      "Set AUTH_DATABASE_URL (or AUTH_DATABASE_URL_UNPOOLED) in microservice backend/.env."
    );
  }

  let authDatabaseTarget;
  try {
    authDatabaseTarget = new URL(authDatabaseUrl);
  } catch {
    throw new Error("AUTH_DATABASE_URL must be a valid PostgreSQL connection URL.");
  }
  if (!["postgres:", "postgresql:"].includes(authDatabaseTarget.protocol)) {
    throw new Error("AUTH_DATABASE_URL must use the postgres:// or postgresql:// scheme.");
  }
  if (["localhost", "127.0.0.1", "::1", "[::1]"].includes(authDatabaseTarget.hostname)) {
    throw new Error("Password resets must target a cloud database, not a local PostgreSQL server.");
  }

  process.env.AUTH_DATABASE_URL = authDatabaseUrl;
  console.log(
    `[Auth password reset] Target database: ${authDatabaseTarget.hostname}${authDatabaseTarget.pathname}`
  );

  const confirmationPrompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let confirmedEmail;
  try {
    confirmedEmail = (await confirmationPrompt.question(
      `This will reset the Auth database password for ${email} and sign out its sessions.\nType the email to confirm: `
    )).trim().toLowerCase();
  } finally {
    confirmationPrompt.close();
  }
  if (confirmedEmail !== email) {
    throw new Error("Email confirmation did not match; no changes were made.");
  }

  const [{ default: User }, { default: RefreshSession }, { connectDB, sequelize }] =
    await Promise.all([
      import("../auth-service/src/models/User.js"),
      import("../auth-service/src/models/RefreshSession.js"),
      import("../auth-service/src/config/db.js"),
    ]);

  try {
    await connectDB();
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error("No account with that email exists in the Auth database.");
    }

    const password = await readHidden("New password (minimum 8 characters): ");
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters; no changes were made.");
    }
    const confirmation = await readHidden("Confirm new password: ");
    if (password !== confirmation) {
      throw new Error("Passwords do not match; no changes were made.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await sequelize.transaction(async (transaction) => {
      await user.update({ password: passwordHash }, { transaction });
      await RefreshSession.update(
        { revokedAt: new Date() },
        { where: { userId: user.id, revokedAt: null }, transaction }
      );
    });

    console.log(`Password reset completed for ${email}. Sign in with the new password.`);
  } finally {
    await sequelize.close();
  }
};

resetPassword().catch((error) => {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
});
