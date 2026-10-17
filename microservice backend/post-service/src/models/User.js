import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // _id is a String (UUID) to match the PostgreSQL user-service's primary key
    _id: { type: String },
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    email: { type: String, required: true },
    role: { type: String, default: "student" },
    profileImage: { type: String, default: "" },
  },
  { timestamps: true, _id: false }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
