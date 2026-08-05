import * as db from "../init/db";
import TypeUZError from "../utils/error";

export type DBApeKey = {
  _id: string;
  uid: string;
  name: string;
  hash: string;
  enabled: boolean;
  use_count: number;
  created_on: number;
  modified_on: number;
  last_used_on: number;
};

export async function getApeKeys(uid: string): Promise<DBApeKey[]> {
  return await db.queryAll<DBApeKey>(
    "SELECT * FROM ape_keys WHERE uid = $1",
    [uid],
  );
}

export async function getApeKey(keyId: string): Promise<DBApeKey | null> {
  return await db.queryOne<DBApeKey>(
    "SELECT * FROM ape_keys WHERE _id = $1::uuid",
    [keyId],
  );
}

export async function countApeKeysForUser(uid: string): Promise<number> {
  const result = await db.queryOne<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM ape_keys WHERE uid = $1",
    [uid],
  );
  return result?.count ?? 0;
}

export async function addApeKey(apeKey: DBApeKey): Promise<string> {
  const result = await db.queryOne<{ _id: string }>(
    `INSERT INTO ape_keys (_id, uid, name, hash, enabled, use_count, created_on, modified_on, last_used_on)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING _id`,
    [
      apeKey._id,
      apeKey.uid,
      apeKey.name,
      apeKey.hash,
      apeKey.enabled,
      apeKey.use_count ?? 0,
      apeKey.created_on,
      apeKey.modified_on,
      apeKey.last_used_on ?? -1,
    ],
  );
  if (result === null) {
    throw new TypeUZError(500, "Failed to add API key", "add ape key");
  }
  return result._id;
}

async function updateApeKey(
  uid: string,
  keyId: string,
  updates: Record<string, unknown>,
): Promise<void> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if ("last_used_on" in updates) {
    setClauses.push(`use_count = use_count + 1`);
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value !== null && value !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  values.push(uid, keyId);
  const result = await db.query(
    `UPDATE ape_keys SET ${setClauses.join(", ")} WHERE uid = $${idx++} AND _id = $${idx}::uuid`,
    values,
  );

  if (result.rowCount === 0) {
    throw new TypeUZError(404, "ApeKey not found");
  }
}

export async function editApeKey(
  uid: string,
  keyId: string,
  name?: string,
  enabled?: boolean,
): Promise<void> {
  if (name === undefined && enabled === undefined) return;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates["name"] = name;
  if (enabled !== undefined) updates["enabled"] = enabled;
  updates["modified_on"] = Date.now();

  await updateApeKey(uid, keyId, updates);
}

export async function updateLastUsedOn(
  uid: string,
  keyId: string,
): Promise<void> {
  await updateApeKey(uid, keyId, { last_used_on: Date.now() });
}

export async function deleteApeKey(
  uid: string,
  keyId: string,
): Promise<void> {
  const result = await db.query(
    "DELETE FROM ape_keys WHERE uid = $1 AND _id = $2::uuid",
    [uid, keyId],
  );
  if (result.rowCount === 0) {
    throw new TypeUZError(404, "ApeKey not found");
  }
}

export async function deleteAllApeKeys(uid: string): Promise<void> {
  await db.query("DELETE FROM ape_keys WHERE uid = $1", [uid]);
}
