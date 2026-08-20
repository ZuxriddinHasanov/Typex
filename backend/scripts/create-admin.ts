/**
 * One-off script to create the first admin account with username + password.
 *
 * Usage:
 *   pnpm tsx backend/scripts/create-admin.ts
 *
 * Generates a strong random password and stores the bcrypt hash in the
 * "admin_credentials" PostgreSQL table. Prints credentials once to stdout.
 *
 * Environment variables:
 *   DATABASE_URL
 */

import "dotenv/config";
import { Client } from "pg";
import crypto from "crypto";
import bcrypt from "bcrypt";

function generatePassword(length = 24): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[(bytes[i] ?? 0) % chars.length];
  }
  return result;
}

async function main(): Promise<void> {
  const { DATABASE_URL } = process.env;

  if (DATABASE_URL === undefined || DATABASE_URL === "") {
    console.error("DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const adminUsername = "admin";
  const adminPassword = generatePassword();
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existing = await client.query("SELECT * FROM admin_credentials WHERE username = $1", [adminUsername]);

  if (existing.rowCount !== null && existing.rowCount !== undefined && existing.rowCount > 0) {
    console.log(`Admin account "${adminUsername}" already exists.`);
    console.log("To reset, delete the row from admin_credentials first.");
    await client.end();
    return;
  }

  await client.query(
    "INSERT INTO admin_credentials (username, password_hash, created_at) VALUES ($1, $2, $3)",
    [adminUsername, passwordHash, Date.now()]
  );

  console.log("========================================");
  console.log("  Admin account created!");
  console.log("========================================");
  console.log(`  Username: ${adminUsername}`);
  console.log(`  Password: ${adminPassword}`);
  console.log("========================================");
  console.log("  SAVE THIS PASSWORD NOW - it will not");
  console.log("  be shown again.");
  console.log("========================================");

  await client.end();
}

void main().catch((err: unknown) => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});
