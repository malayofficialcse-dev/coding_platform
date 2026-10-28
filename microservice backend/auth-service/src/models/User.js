import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

export const ROLES = [
  "student",
  "exam_coordinator",
  "course_coordinator",
  "feed_coordinator",
  "super_admin",
  "admin",
  "teacher",
  "user",
];

class User extends Model {
  // Virtual getter so user._id works seamlessly across existing code
  get _id() {
    return this.getDataValue("id");
  }

  toObject(options) {
    const raw = this.toJSON();
    raw._id = raw.id;
    if (options && typeof options.transform === "function") {
      return options.transform(null, raw);
    }
    return raw;
  }

  // Compatibility helper
  static async findById(id) {
    if (!id) return null;
    return await User.findByPk(id);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(val) {
        this.setDataValue("email", val ? val.toLowerCase().trim() : val);
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    githubId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    authProvider: {
      type: DataTypes.STRING,
      defaultValue: "local",
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "student",
    },
    college: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    degree: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    yearOfPassing: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    profileImage: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    bannerImage: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["email"] },
      { unique: true, fields: ["username"] },
      { unique: true, fields: ["googleId"] },
      { unique: true, fields: ["githubId"] },
    ],
  }
);

export default User;
