import { Sequelize } from "sequelize";

const dbUrl = (
  process.env.AUTH_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:malay21@127.0.0.1:5432/auth_db"
).replace(/^"|"$/g, "");

const isNeon = dbUrl.includes("neon.tech");
export const AUTH_SCHEMA = isNeon ? "auth_schema" : "public";

export const sequelize = new Sequelize(dbUrl, {
  dialect: "postgres",
  dialectOptions: {
    ssl: isNeon ? { require: true, rejectUnauthorized: false } : false,
  },
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectDB = async () => {
  await sequelize.authenticate();

  if (isNeon) {
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${AUTH_SCHEMA}"`);
  }

  await sequelize.sync();
  const usersTable = `"${AUTH_SCHEMA}"."users"`;
  const userColumnMigrations = [
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "username" VARCHAR(255)`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "password" VARCHAR(255)`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255)`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "githubId" VARCHAR(255)`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "authProvider" VARCHAR(50) DEFAULT 'local'`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "role" VARCHAR(255) DEFAULT 'student'`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "college" VARCHAR(255) DEFAULT ''`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "degree" VARCHAR(255) DEFAULT ''`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "yearOfPassing" VARCHAR(255) DEFAULT ''`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "profileImage" TEXT DEFAULT ''`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "bannerImage" TEXT DEFAULT ''`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "createdBy" UUID`,
    `ALTER TABLE ${usersTable} ADD COLUMN IF NOT EXISTS "permissions" JSONB DEFAULT '{}'::jsonb`,
    `ALTER TABLE ${usersTable} ALTER COLUMN "password" DROP NOT NULL`,
  ];
  for (const migration of userColumnMigrations) {
    await sequelize.query(migration);
  }

  const [passwordColumns] = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'password'
      AND table_schema = :schema
  `, { replacements: { schema: AUTH_SCHEMA } });
  if (passwordColumns.length === 0) {
    throw new Error(`Auth database migration failed: "${AUTH_SCHEMA}"."users"."password" is unavailable.`);
  }

  console.log(`[Auth Service] PostgreSQL connected — schema ${AUTH_SCHEMA}`);
};

export default connectDB;
