import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || "kweu249hp72hf4fh48g7w9f4wpef74",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, college, degree, yearOfPassing, username } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    let existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      username: username || email.split("@")[0] + "_" + Math.floor(Math.random() * 1000),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "student",
      college: college || "",
      degree: degree || "",
      yearOfPassing: yearOfPassing || "",
    });

    await user.save();
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        college: user.college,
        degree: user.degree,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    console.error("[Auth Service Register Error]:", err);
    res.status(500).json({ message: "Server error during registration", error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        college: user.college,
        degree: user.degree,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    console.error("[Auth Service Login Error]:", err);
    res.status(500).json({ message: "Server error during login", error: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("[Auth Service Password Update Error]:", err);
    res.status(500).json({ message: "Could not update password" });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    const imageUrl = req.file?.path || req.file?.secure_url || req.file?.url || req.file?.location;
    if (!imageUrl) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.profileImage = imageUrl;
    await user.save();

    res.json({ profileImage: user.profileImage, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBannerImage = async (req, res) => {
  try {
    const imageUrl = req.file?.path || req.file?.secure_url || req.file?.url || req.file?.location;
    if (!imageUrl) return res.status(400).json({ error: "No banner image uploaded" });

    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.bannerImage = imageUrl;
    await user.save();
    res.json({ bannerImage: user.bannerImage, user: user.toObject({ transform: (_, value) => { delete value.password; return value; } }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.body.token;
    if (!token) return res.status(400).json({ valid: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "kweu249hp72hf4fh48g7w9f4wpef74");
    const user = await User.findById(decoded.userId || decoded.id).select("-password");
    if (!user) return res.status(404).json({ valid: false, message: "User not found" });

    res.json({ valid: true, user });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
};
