import { Sequelize } from "sequelize";

const dbUrl =
  process.env.CODING_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgres://cc_coding:cc_coding_pass@127.0.0.1:5436/coding_db";

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

export const connectPg = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("[Coding Service] PostgreSQL connected — coding_db");
  } catch (err) {
    console.error(`[Coding Service PG Error]: ${err.message}`);
  }
};

export default connectPg;
