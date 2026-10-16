import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Attempt extends Model {
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
    return await Attempt.findByPk(id);
  }

  static async deleteMany(condition = {}) {
    return await Attempt.destroy({ where: condition });
  }
}

Attempt.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    exam: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    answers: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    warningsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    autoSubmitted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    cheatingLogged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Attempt",
    tableName: "attempts",
    timestamps: true,
    indexes: [
      { fields: ["exam"] },
      { fields: ["user"] },
      { fields: ["exam", "user"] },
    ],
  }
);

export default Attempt;
