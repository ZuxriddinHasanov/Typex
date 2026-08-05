import * as db from "../init/db";
import { createHash } from "crypto";
import { User } from "@typeuz/schemas/users";

type BlocklistEntryProperties = Pick<User, "name" | "email" | "discordId">;

export async function add(user: BlocklistEntryProperties): Promise<void> {
  const timestamp = Date.now();

  const usernameHash = hash(user.name);
  const emailHash = hash(user.email);

  await db.query(
    `INSERT INTO blocklist (_id, username_hash, timestamp)
     VALUES ($1, $2, $3)
     ON CONFLICT (username_hash) DO UPDATE SET timestamp = $3`,
    [usernameHash, usernameHash, timestamp],
  );
  await db.query(
    `INSERT INTO blocklist (_id, email_hash, timestamp)
     VALUES ($1, $2, $3)
     ON CONFLICT (email_hash) DO UPDATE SET timestamp = $3`,
    [emailHash, emailHash, timestamp],
  );

  if (user.discordId !== undefined && user.discordId !== "") {
    const discordIdHash = hash(user.discordId);
    await db.query(
      `INSERT INTO blocklist (_id, discord_id_hash, timestamp)
       VALUES ($1, $2, $3)
       ON CONFLICT (discord_id_hash) DO UPDATE SET timestamp = $3`,
      [discordIdHash, discordIdHash, timestamp],
    );
  }
}

export async function remove(
  user: Partial<BlocklistEntryProperties>,
): Promise<void> {
  const hashes: string[] = [];
  if (user.email !== undefined) hashes.push(hash(user.email));
  if (user.name !== undefined) hashes.push(hash(user.name));
  if (user.discordId !== undefined) hashes.push(hash(user.discordId));

  if (hashes.length === 0) return;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (user.email !== undefined) {
    conditions.push(`email_hash = $${idx++}`);
    params.push(hash(user.email));
  }
  if (user.name !== undefined) {
    conditions.push(`username_hash = $${idx++}`);
    params.push(hash(user.name));
  }
  if (user.discordId !== undefined) {
    conditions.push(`discord_id_hash = $${idx++}`);
    params.push(hash(user.discordId));
  }

  await db.query(`DELETE FROM blocklist WHERE ${conditions.join(" OR ")}`, params);
}

export async function contains(
  user: Partial<BlocklistEntryProperties>,
): Promise<boolean> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (user.email !== undefined) {
    conditions.push(`email_hash = $${idx++}`);
    params.push(hash(user.email));
  }
  if (user.name !== undefined) {
    conditions.push(`username_hash = $${idx++}`);
    params.push(hash(user.name));
  }
  if (user.discordId !== undefined) {
    conditions.push(`discord_id_hash = $${idx++}`);
    params.push(hash(user.discordId));
  }

  if (conditions.length === 0) return false;

  const result = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM blocklist WHERE ${conditions.join(" OR ")}`,
    params,
  );

  return (result?.count ?? 0) > 0;
}

export function hash(value: string): string {
  return createHash("sha256").update(value.toLocaleLowerCase()).digest("hex");
}

export async function createIndicies(): Promise<void> {
  await db.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_blocklist_username_hash ON blocklist(username_hash) WHERE username_hash IS NOT NULL",
  );
  await db.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_blocklist_email_hash ON blocklist(email_hash) WHERE email_hash IS NOT NULL",
  );
  await db.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_blocklist_discord_id_hash ON blocklist(discord_id_hash) WHERE discord_id_hash IS NOT NULL",
  );
}
