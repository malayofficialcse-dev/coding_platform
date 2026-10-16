import neo4j from "neo4j-driver";

const uri = process.env.NEO4J_URI || "bolt://127.0.0.1:7687";
const user = process.env.NEO4J_USER || "neo4j";
const password = process.env.NEO4J_PASSWORD || "cc_neo4j_pass";

let driver;
try {
  driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
} catch (err) {
  console.warn("[Neo4j Driver Warning]:", err.message);
}

export const runCypher = async (query, params = {}) => {
  if (!driver) {
    throw new Error("Neo4j driver is not initialized");
  }
  const session = driver.session();
  try {
    return await session.run(query, params);
  } finally {
    await session.close();
  }
};

export const verifyNeo4j = async () => {
  try {
    const res = await runCypher("RETURN 1 AS connected");
    console.log("[User Service] Neo4j graph connected — bolt");
    return true;
  } catch (err) {
    console.warn(`[User Service Neo4j Warning]: ${err.message}`);
    return false;
  }
};

export default driver;
