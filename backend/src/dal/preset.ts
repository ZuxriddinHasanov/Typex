import TypeUZError from "../utils/error";
import * as db from "../init/db";
import { EditPresetRequest, Preset } from "@typeuz/schemas/presets";
import { omit } from "../utils/misc";

const MAX_PRESETS = 10;

type DBConfigPreset = {
  _id: string;
  uid: string;
  name: string;
  config: Record<string, unknown>;
  timestamp: number;
};

type PresetCreationResult = {
  presetId: string;
};

export async function getPresets(uid: string): Promise<DBConfigPreset[]> {
  return await db.queryAll<DBConfigPreset>(
    "SELECT * FROM presets WHERE uid = $1 ORDER BY timestamp DESC",
    [uid],
  );
}

export async function addPreset(
  uid: string,
  preset: Omit<Preset, "_id">,
): Promise<PresetCreationResult> {
  const countResult = await db.queryOne<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM presets WHERE uid = $1",
    [uid],
  );
  const presets = countResult?.count ?? 0;

  if (presets >= MAX_PRESETS) {
    throw new TypeUZError(409, "Too many presets");
  }

  const result = await db.queryOne<{ _id: string }>(
    `INSERT INTO presets (uid, name, config, timestamp)
     VALUES ($1, $2, $3::jsonb, $4)
     RETURNING _id`,
    [uid, preset.name, JSON.stringify(preset.config), (preset as Record<string, unknown>)["timestamp"] ?? Date.now()],
  );

  if (result === null) {
    throw new TypeUZError(500, "Failed to add preset", "add preset");
  }

  return {
    presetId: result._id,
  };
}

export async function editPreset(
  uid: string,
  preset: EditPresetRequest,
): Promise<void> {
  const update: Partial<Omit<Preset, "_id">> = omit(preset, ["_id"]);
  if (
    preset.config === undefined ||
    preset.config === null ||
    Object.keys(preset.config).length === 0
  ) {
    delete update.config;
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (update.name !== undefined) {
    setClauses.push(`name = $${idx++}`);
    values.push(update.name);
  }
  if (update.config !== undefined) {
    setClauses.push(`config = $${idx++}::jsonb`);
    values.push(JSON.stringify(update.config));
  }
  if ((update as Record<string, unknown>)["timestamp"] !== undefined) {
    setClauses.push(`timestamp = $${idx++}`);
    values.push((update as Record<string, unknown>)["timestamp"]);
  }

  if (setClauses.length === 0) return;

  values.push(uid, preset._id);
  await db.query(
    `UPDATE presets SET ${setClauses.join(", ")} WHERE uid = $${idx++} AND _id = $${idx}::uuid`,
    values,
  );
}

export async function removePreset(
  uid: string,
  presetId: string,
): Promise<void> {
  const result = await db.query(
    "DELETE FROM presets WHERE uid = $1 AND _id = $2::uuid",
    [uid, presetId],
  );
  if (result.rowCount === 0) {
    throw new TypeUZError(404, "Preset not found");
  }
}

export async function deleteAllPresets(uid: string): Promise<void> {
  await db.query("DELETE FROM presets WHERE uid = $1", [uid]);
}
