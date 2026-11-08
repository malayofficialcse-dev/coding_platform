import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authRequire = createRequire(
  new URL("../auth-service/package.json", import.meta.url)
);
const dotenv = authRequire("dotenv");
const bcrypt = authRequire("bcryptjs");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const email = process.argv[2]?.trim().toLowerCase();

const readSecret = (prompt) => {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal so the password can be entered privately.");
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
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: node scripts/reset-user-password.js <account-email>");
  }

  const password = await readSecret("New password (minimum 6 characters): ");
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  const confirmation = await readSecret("Confirm new password: ");
  if (password !== confirmation) {
    throw new Error("Passwords do not match.");
  }

  const [
    { default: User },
    { default: RefreshSession },
    { connectDB, sequelize },
  ] = await Promise.all([
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

    const passwordHash = await bcrypt.hash(password, 12);
    await sequelize.transaction(async (transaction) => {
      await user.update({ password: passwordHash }, { transaction });
      await RefreshSession.update(
        { revokedAt: new Date() },
        { where: { userId: user.id, revokedAt: null }, transaction }
      );
    });

    console.log("Password reset completed. Sign in with the new password.");
  } finally {
    await sequelize.close();
  }
};

resetPassword().catch((error) => {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
});
