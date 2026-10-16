import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Enrollment extends Model {
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
    return await Enrollment.findByPk(id);
  }
}

Enrollment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    course: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    enrolledAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completedSubtopics: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    certificateNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    certificateIssuedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    certificateRecipientName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    certificateCeoName: {
      type: DataTypes.STRING,
      defaultValue: "Malay Maity",
    },
  },
  {
    sequelize,
    modelName: "Enrollment",
    tableName: "enrollments",
    timestamps: true,
    indexes: [
      { fields: ["user", "course"] },
      { fields: ["certificateNumber"] },
    ],
  }
);

export default Enrollment;
