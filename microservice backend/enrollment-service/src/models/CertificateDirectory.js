import { DataTypes, Model } from "sequelize";
import { getCertificateDirectoryConnection, syncDatabase } from "../config/db.js";

class CertificateDirectory extends Model {}
CertificateDirectory.init({
  certificateNumber: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false },
  enrollmentId: { type: DataTypes.UUID, allowNull: false },
  shardId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  sequelize: getCertificateDirectoryConnection(),
  modelName: "CertificateDirectory",
  tableName: "certificate_directory",
  timestamps: true,
});

export const syncCertificateDirectory = async () => {
  if (syncDatabase) await CertificateDirectory.sync();
};

export default CertificateDirectory;
