import { DataTypes, Model, Op } from "sequelize";
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
  get _id() {
    return this.getDataValue("id");
  }

  toObject() {
    const raw = this.toJSON();
    raw._id = raw.id;
    return raw;
  }

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
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
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
      defaultValue: "/default-avatar.svg",
    },
    bannerImage: {
      type: DataTypes.TEXT,
      defaultValue: "/default-banner.svg",
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
      { fields: ["name"] },
    ],
  }
);

export { Op };
export default User;
