import * as db from "../init/db";
import { Config, PartialConfig } from "@typeuz/schemas/configs";

export type DBConfig = {
  uid: string;
  config: PartialConfig;
};

export async function saveConfig(
  uid: string,
  config: Partial<Config>,
): Promise<void> {
  const existing = await db.queryOne<DBConfig>(
    "SELECT config FROM configs WHERE uid = $1",
    [uid],
  );
  const merged = { ...(existing?.config ?? {}), ...config };
  await db.query(
    `INSERT INTO configs (uid, config) VALUES ($1, $2::jsonb)
     ON CONFLICT (uid)
     DO UPDATE SET config = $2::jsonb`,
    [uid, JSON.stringify(merged)],
  );
}

export async function getConfig(uid: string): Promise<DBConfig | null> {
  return await db.queryOne<DBConfig>(
    "SELECT uid, config FROM configs WHERE uid = $1",
    [uid],
  );
}

export async function deleteConfig(uid: string): Promise<void> {
  await db.query("DELETE FROM configs WHERE uid = $1", [uid]);
}
