import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authRequire = createRequire(
  new URL("../auth-service/package.json", import.meta.url)
);
const dotenv = authRequire("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const profileFields = [
  "id",
  "name",
  "username",
  "email",
  "password",
  "role",
  "college",
  "degree",
  "yearOfPassing",
  "profileImage",
  "bannerImage",
  "isActive",
  "createdBy",
  "permissions",
  "googleId",
  "githubId",
  "authProvider",
  "createdAt",
  "updatedAt",
];

const syncDatabases = async () => {
  const [
    { default: AuthUser },
    { connectDB: connectAuthDb, sequelize: authSequelize },
    { default: UserProfile },
    { connectDB: connectUserDb, closeDB: closeUserDb },
  ] = await Promise.all([
    import("../auth-service/src/models/User.js"),
    import("../auth-service/src/config/db.js"),
    import("../user-service/src/models/User.js"),
    import("../user-service/src/config/db.js"),
  ]);

  try {
    await connectAuthDb();
    await connectUserDb();

    const [authUsers, profileUsers] = await Promise.all([
      AuthUser.findAll({ raw: true }),
      UserProfile.findAll({ raw: true }),
    ]);

    for (const authUser of authUsers) {
      const profileData = profileUsers.find(
        (profile) => profile.email.toLowerCase() === authUser.email.toLowerCase()
      );

      if (!profileData) {
        await UserProfile.create(authUser);
      } else if (profileData.id !== authUser.id) {
        const profile = await UserProfile.findByPk(profileData.id);
        await UserProfile.relocate(profile, authUser);
      }
    }

    for (const profile of profileUsers) {
      const authUser = authUsers.find(
        (user) => user.email.toLowerCase() === profile.email.toLowerCase()
      );
      if (!authUser) {
        const values = Object.fromEntries(
          profileFields
            .filter((field) => profile[field] !== undefined)
            .map((field) => [field, profile[field]])
        );
        await AuthUser.create(values);
      }
    }

    console.log(`User databases synchronized: ${authUsers.length} auth records, ${profileUsers.length} profile records.`);
  } finally {
    await authSequelize.close();
    await closeUserDb();
  }
};

syncDatabases().catch((err) => {
  console.error("User database synchronization failed:", err.message);
  process.exitCode = 1;
});
