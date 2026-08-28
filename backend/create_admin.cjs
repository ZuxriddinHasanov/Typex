const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

async function save() {
  const username = "admin";
  const passwordHash = await bcrypt.hash("admin", 10);
  const doc = { username, passwordHash, createdAt: Date.now() };

  // Local dev store
  const dir = path.join(process.cwd(), ".dev-data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "admin_credentials.json"),
    JSON.stringify({ [username]: doc }, null, 2)
  );
  console.log("Saved to local .dev-data/admin_credentials.json");

  // Postgres for production
  const { Client } = require("pg");
  const client = new Client({
    connectionString: "postgresql://postgres.knzbopsocekorqzngckc:Zuxriddin-2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
  });
  await client.connect();
  await client.query(
    `INSERT INTO admin_credentials (username, data)
     VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET data = $2`,
    [username, JSON.stringify(doc)]
  );
  console.log("Saved to PostgreSQL");
  await client.end();
}
save().catch(console.error);
