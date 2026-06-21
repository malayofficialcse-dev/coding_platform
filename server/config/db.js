import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect( process.env.MONGO_URI || "mongodb://maitymalay334_db_user:dbmalay21mongo@ac-m8w7vpt-shard-00-00.vvosns0.mongodb.net:27017,ac-m8w7vpt-shard-00-01.vvosns0.mongodb.net:27017,ac-m8w7vpt-shard-00-02.vvosns0.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority");
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;
