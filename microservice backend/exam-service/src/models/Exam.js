import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Exam extends Model {
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
    return await Exam.findByPk(id);
  }

  static async findByIdAndUpdate(id, data, options = {}) {
    const exam = await Exam.findByPk(id);
    if (!exam) return null;
    await exam.update(data);
    return exam;
  }

  static async findByIdAndDelete(id) {
    const exam = await Exam.findByPk(id);
    if (!exam) return null;
    await exam.destroy();
    return exam;
  }
}

Exam.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 30, // in minutes
    },
    questions: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Exam",
    tableName: "exams",
    timestamps: true,
  }
);

export default Exam;
