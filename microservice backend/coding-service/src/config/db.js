import { connectPg } from "./pgDb.js";
import { connectMongo } from "./mongoDb.js";

export const connectDB = async () => {
  await Promise.all([connectPg(), connectMongo()]);
};

export default connectDB;
