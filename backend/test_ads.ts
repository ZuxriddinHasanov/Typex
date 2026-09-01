import { connect, getDb } from "./src/init/db";

async function main() {
  await connect();
  const db = getDb();
  if (!db) {
    console.log("No DB connection");
    return;
  }
  const res = await db.query("SELECT data FROM configuration WHERE _id = 'ad_config'");
  console.log("DB RESULT:");
  console.log(JSON.stringify(res.rows[0]?.data, null, 2));
  process.exit(0);
}
main();
