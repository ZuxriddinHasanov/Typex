const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const client = new Client({
  connectionString:
    "postgresql://postgres:uzbektypexuz2010@db.knzbopsocekorqzngckc.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase.");

    const res = await client.query(
      "SELECT to_regclass('public.users') as table_exists;",
    );
    if (res.rows[0].table_exists === null) {
      console.log("Tables don't exist. Running migrations...");
      const sql = fs.readFileSync(
        path.join(__dirname, "supabase/migrations/0001_init.sql"),
        "utf8",
      );
      await client.query(sql);
      console.log("Migrations applied successfully!");
    } else {
      console.log("Tables already exist.");
    }
  } catch (e) {
    console.error("DB error:", e.message);
  } finally {
    await client.end();
  }
}
run();
