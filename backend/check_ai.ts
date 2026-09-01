import db from "./src/init/db";

async function check() {
  const config = await db.queryOne('SELECT data FROM config LIMIT 1');
  console.log(JSON.stringify(config, null, 2));
}
check();
