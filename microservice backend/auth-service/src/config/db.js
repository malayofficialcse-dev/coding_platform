import { Sequelize } from "sequelize";

const dbUrl =
  process.env.AUTH_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:malay21@127.0.0.1:5432/auth_db";

export const sequelize = new Sequelize(dbUrl, {
  dialect: "postgres",
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

  // Safely ensure new OAuth columns exist and password can be null
  try {
    await sequelize.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255);
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "githubId" VARCHAR(255);
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "authProvider" VARCHAR(50) DEFAULT 'local';
      ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
    `);
  } catch (migErr) {
    console.warn("[Auth Service DB Migration Note]:", migErr.message);
  }

  await sequelize.sync();
  console.log("[Auth Service] PostgreSQL connected — auth_db");
};

export default connectDB;