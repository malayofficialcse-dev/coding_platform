import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class RefreshSession extends Model {}

RefreshSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    familyId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    replacedByHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    absoluteExpiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "RefreshSession",
    tableName: "refresh_sessions",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["familyId"] },
      { fields: ["expiresAt"] },
    ],
  }
);

export default RefreshSession;
