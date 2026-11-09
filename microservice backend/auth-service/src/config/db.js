import { Sequelize } from "sequelize";

const dbUrl = (
  process.env.AUTH_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:malay21@127.0.0.1:5432/auth_db"
).replace(/^"|"$/g, "");

const isNeon = dbUrl.includes("neon.tech");

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
    // Set search_path immediately after a new connection is created from the pool
    afterCreate: isNeon
      ? (conn, done) => {
          conn.query("SET search_path TO auth_schema, public", (err) => done(err, conn));
        }
      : undefined,
  },
});

export const connectDB = async () => {
  await sequelize.authenticate();

  const [tables] = await sequelize.query(`SELECT to_regclass('"users"') AS users_table`);
  if (tables[0]?.users_table) {
    await sequelize.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" VARCHAR(255);
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" VARCHAR(255);
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255);
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "githubId" VARCHAR(255);
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "authProvider" VARCHAR(50) DEFAULT 'local';
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" VARCHAR(255) DEFAULT 'student';
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "college" VARCHAR(255) DEFAULT '';
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "degree" VARCHAR(255) DEFAULT '';
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "yearOfPassing" VARCHAR(255) DEFAULT '';
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileImage" TEXT DEFAULT '';
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bannerImage" TEXT DEFAULT '';
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "createdBy" UUID;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
    `);
  }

  await sequelize.sync();
  await sequelize.query(`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" VARCHAR(255);
    ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
  `);

  const [passwordColumns] = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'password'
      AND table_schema = ANY(current_schemas(false))
  `);
  if (passwordColumns.length === 0) {
    throw new Error('Auth database migration failed: "users"."password" is unavailable on the active search path.');
  }

  console.log("[Auth Service] PostgreSQL connected — Neon (auth_schema)");
};

export default connectDB;
