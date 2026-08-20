/**
 * One-off script to grant admin privileges to a user.
 *
 * Usage:
 *   pnpm tsx backend/scripts/add-admin.ts <uid>
 *
 * The <uid> is the user's unique ID from the "users" PostgreSQL table.
 *
 * Environment variables:
 *   DATABASE_URL
 */

import "dotenv/config";
import { Client } from "pg";

const uid = process.argv[2];
if (uid === undefined || uid === "") {
  console.error("Usage: pnpm tsx backend/scripts/add-admin.ts <uid>");
  process.exit(1);
}

async function main(): Promise<void> {
  const { DATABASE_URL } = process.env;

  if (DATABASE_URL === undefined || DATABASE_URL === "") {
    console.error("DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const existing = await client.query("SELECT * FROM admin_uids WHERE uid = $1", [uid]);
  if (existing.rowCount !== null && existing.rowCount !== undefined && existing.rowCount > 0) {
    console.log(`User "${uid}" is already an admin.`);
    await client.end();
    return;
  }

  await client.query("INSERT INTO admin_uids (uid) VALUES ($1)", [uid]);
  console.log(`Admin privileges granted to user "${uid}".`);
  await client.end();
}

void main().catch((err: unknown) => {
  console.error("Failed to add admin:", err);
  process.exit(1);
});
