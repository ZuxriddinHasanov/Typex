import * as db from "./src/init/db";

async function run() {
  await db.connect();
  const row = await db.queryOne(
    "SELECT github_client_id, github_client_secret FROM app_secrets LIMIT 1"
  );
  console.log(row);
  db.getPool().end();
}
run();
