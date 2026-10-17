import mongoose from "mongoose";

export const connectDB = async () => {
  const uri =
    process.env.NOTIFICATION_MONGO_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/notification_db";
  try {
    const conn = await mongoose.connect(uri, {
      dbName: process.env.NOTIFICATION_DB_NAME || "notification_db",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[Notification Service] MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
    return conn;
  } catch (err) {
    console.error(`[Notification Service DB Error] Connection failed: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
