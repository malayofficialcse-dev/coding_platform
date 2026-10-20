import { DataTypes, Model, Op } from "sequelize";
import { sequelize } from "../config/pgDb.js";
import CodingProblem from "./CodingProblem.js";

class CodingSubmission extends Model {
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
    return await CodingSubmission.findByPk(id);
  }

  /**
   * Compatibility wrapper for Mongoose-style .find({ ... }).sort(...).limit(...)
   */
  static find(filter = {}) {
    const where = {};
    if (filter.user) where.user = String(filter.user);
    if (filter.problem) where.problem = String(filter.problem);
    if (filter.result) where.result = filter.result;

    const queryState = {
      where,
      order: [["createdAt", "DESC"]],
      limit: undefined,
    };

    const queryPromise = {
      sort(orderObj) {
        if (orderObj && orderObj.createdAt === -1) {
          queryState.order = [["createdAt", "DESC"]];
        } else if (orderObj && orderObj.createdAt === 1) {
          queryState.order = [["createdAt", "ASC"]];
        }
        return queryPromise;
      },
      limit(n) {
        queryState.limit = n;
        return queryPromise;
      },
      select() {
        return queryPromise;
      },
      lean() {
        return queryPromise;
      },
      populate() {
        return queryPromise;
      },
      then(onFulfilled, onRejected) {
        return CodingSubmission.findAll(queryState)
          .then(async (results) => {
            const list = results.map((r) => r.toObject());
            // Enrich with problem title if available
            try {
              const problemIds = [...new Set(list.map((s) => s.problem))];
              if (problemIds.length) {
                const problems = await CodingProblem.find({ _id: { $in: problemIds } })
                  .select("title difficulty")
                  .lean();
                const probMap = new Map(problems.map((p) => [String(p._id), p]));
                list.forEach((sub) => {
                  sub.problem = probMap.get(String(sub.problem)) || { _id: sub.problem, title: "Problem" };
                });
              }
            } catch (e) {}
            return list;
          })
          .then(onFulfilled, onRejected);
      },
    };

    return queryPromise;
  }

  /**
   * Compatibility wrapper for aggregation pipelines
   */
  static async aggregate(pipeline = []) {
    // Return empty array or run basic SQL aggregation if needed
    const all = await CodingSubmission.findAll({ raw: true });
    return all.map((item) => ({ ...item, _id: item.id }));
  }
}

CodingSubmission.init(
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
    problem: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    result: {
      type: DataTypes.STRING,
      defaultValue: "Wrong Answer",
    },
    passedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    plagiarism: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    details: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    logicScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    logicDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: "CodingSubmission",
    tableName: "coding_submissions",
    timestamps: true,
    indexes: [
      { fields: ["user"] },
      { fields: ["problem"] },
      { fields: ["result"] },
      { fields: ["createdAt"] },
    ],
  }
);

export { Op };
export default CodingSubmission;
