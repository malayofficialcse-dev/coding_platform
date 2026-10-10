import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["user", "student", "admin"],
    default: "student",
  },
  college: String,
  degree: String,
  yearOfPassing: Number,
  profileImage: { type: String, default: "" },
  bannerImage: { type: String, default: "" },
  lastSeen: { type: Date, default: null },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});
export default mongoose.model("User", userSchema);
