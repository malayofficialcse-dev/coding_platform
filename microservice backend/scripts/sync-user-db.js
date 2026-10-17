import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authRequire = createRequire(
  new URL("../auth-service/package.json", import.meta.url)
);
const dotenv = authRequire("dotenv");
const { Sequelize } = authRequire("sequelize");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const authSequelize = new Sequelize(
  process.env.AUTH_DATABASE_URL || "postgresql://postgres:malay21@localhost:5432/auth_db",
  { dialect: "postgres", logging: false }
);

const userSequelize = new Sequelize(
  process.env.USER_DATABASE_URL || "postgresql://postgres:malay21@localhost:5432/user_db",
  { dialect: "postgres", logging: false }
);

async function syncDatabases() {
  try {
    console.log("Connecting to auth_db and user_db...");
    await authSequelize.authenticate();
    await userSequelize.authenticate();
    console.log("Connected to both databases.");

    const [authUsers] = await authSequelize.query('SELECT * FROM "users"');
    const [userDbUsers] = await userSequelize.query('SELECT * FROM "users"');

    console.log(`Found ${authUsers.length} users in auth_db, ${userDbUsers.length} users in user_db.`);

    for (const u of authUsers) {
      console.log(`Auth user: ${u.email} (id: ${u.id}, username: ${u.username})`);
      const existingByEmail = userDbUsers.find(
        (x) => x.email.toLowerCase() === u.email.toLowerCase()
      );
      if (existingByEmail) {
        if (existingByEmail.id !== u.id) {
          console.log(`Updating user_db user ${u.email} ID from ${existingByEmail.id} to ${u.id}...`);
          await userSequelize.query(
            'UPDATE "users" SET id = :newId, password = :pwd, username = :uname, permissions = :perms WHERE id = :oldId',
            {
              replacements: {
                newId: u.id,
                pwd: u.password,
                uname: u.username,
                perms: JSON.stringify(u.permissions || {}),
                oldId: existingByEmail.id,
              },
            }
          );
        } else {
          console.log(`User ${u.email} has matching ID ${u.id}.`);
        }
      } else {
        console.log(`Inserting ${u.email} into user_db...`);
        await userSequelize.query(
          `INSERT INTO "users" (id, name, username, email, password, role, college, degree, "yearOfPassing", "profileImage", "bannerImage", "isActive", "createdBy", permissions, "createdAt", "updatedAt")
           VALUES (:id, :name, :username, :email, :password, :role, :college, :degree, :yearOfPassing, :profileImage, :bannerImage, :isActive, :createdBy, :permissions, :createdAt, :updatedAt)`,
          {
            replacements: {
              id: u.id,
              name: u.name,
              username: u.username,
              email: u.email,
              password: u.password,
              role: u.role || "student",
              college: u.college || "",
              degree: u.degree || "",
              yearOfPassing: u.yearOfPassing || "",
              profileImage: u.profileImage || "",
              bannerImage: u.bannerImage || "",
              isActive: u.isActive !== false,
              createdBy: u.createdBy || null,
              permissions: JSON.stringify(u.permissions || {}),
              createdAt: u.createdAt || new Date(),
              updatedAt: u.updatedAt || new Date(),
            },
          }
        );
      }
    }

    for (const u of userDbUsers) {
      const existingInAuth = authUsers.find(
        (x) => x.email.toLowerCase() === u.email.toLowerCase()
      );
      if (!existingInAuth) {
        console.log(`Syncing user ${u.email} (${u.role}) into auth_db...`);
        await authSequelize.query(
          `INSERT INTO "users" (id, name, username, email, password, role, college, degree, "yearOfPassing", "profileImage", "bannerImage", "isActive", "createdBy", permissions, "createdAt", "updatedAt")
           VALUES (:id, :name, :username, :email, :password, :role, :college, :degree, :yearOfPassing, :profileImage, :bannerImage, :isActive, :createdBy, :permissions, :createdAt, :updatedAt)`,
          {
            replacements: {
              id: u.id,
              name: u.name,
              username: u.username,
              email: u.email,
              password: u.password,
              role: u.role || "student",
              college: u.college || "",
              degree: u.degree || "",
              yearOfPassing: u.yearOfPassing || "",
              profileImage: u.profileImage || "",
              bannerImage: u.bannerImage || "",
              isActive: u.isActive !== false,
              createdBy: u.createdBy || null,
              permissions: JSON.stringify(u.permissions || {}),
              createdAt: u.createdAt || new Date(),
              updatedAt: u.updatedAt || new Date(),
            },
          }
        );
      }
    }

    console.log("✅ Databases fully synchronized!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Sync error:", err);
    process.exit(1);
  }
}

syncDatabases();
