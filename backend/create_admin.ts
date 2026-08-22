import bcrypt from "bcrypt";
import * as db from "./src/init/db";
import { devGet, devSet, isDevEnvironment } from "./src/utils/dev-store";

async function save() {
  const username = "admin";
  const passwordHash = await bcrypt.hash("TypexAdmin#2026!Secure", 10);
  const doc = { username, passwordHash, createdAt: Date.now() };

  if (isDevEnvironment()) {
    const creds = devGet("admin_credentials") || {};
    creds[username] = doc;
    devSet("admin_credentials", creds);
    console.log("Saved to dev store");
  } else {
    // Actually we are testing this in local so dev store is enough for localhost.
    // If not dev store:
    console.log("Connecting DB...");
    await db.query(
      `INSERT INTO admin_credentials (username, data)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET data = $2`,
      [username, JSON.stringify(doc)]
    );
    console.log("Saved to PostgreSQL");
  }
}
save().then(() => process.exit(0)).catch(console.error);
