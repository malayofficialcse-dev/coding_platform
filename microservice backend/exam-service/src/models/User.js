import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

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
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Student",
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
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
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
  }
);

export default User;
