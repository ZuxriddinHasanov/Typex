import TypeUZError from "../utils/error";
import * as db from "../init/db";
import { getUser, getTags } from "./user";
import { DBResult, replaceLegacyValues } from "../utils/result";
import { tryCatch } from "@typeuz/util/trycatch";

type ResultRow = {
  _id: string;
  uid: string;
  wpm: number;
  raw_wpm: number;
  char_stats: unknown;
  acc: number;
  mode: string;
  mode2: string;
  quote_length: number | null;
  timestamp: number;
  test_duration: number;
  consistency: number;
  key_consistency: number | null;
  chart_data: unknown;
  restart_count: number | null;
  incomplete_test_seconds: number | null;
  afk_duration: number | null;
  tags: string[] | null;
  bailed_out: boolean | null;
  blind_mode: boolean | null;
  lazy_mode: boolean | null;
  funbox: unknown;
  language: string | null;
  difficulty: string | null;
  numbers: boolean | null;
  punctuation: boolean | null;
  name: string;
  is_pb: boolean | null;
  key_spacing_stats: unknown;
  key_duration_stats: unknown;
};

function rowToDBResult(row: ResultRow): DBResult {
  const base: Record<string, unknown> = {
    _id: row._id,
    wpm: row.wpm,
    rawWpm: row.raw_wpm,
    charStats: row.char_stats,
    acc: row.acc,
    mode: row.mode,
    mode2: row.mode2,
    quoteLength: row.quote_length ?? undefined,
    timestamp: row.timestamp,
    testDuration: row.test_duration,
    consistency: row.consistency,
    keyConsistency: row.key_consistency ?? undefined,
    chartData:
      row.chart_data === "toolong"
        ? "toolong"
        : (row.chart_data ?? { wpm: [], burst: [], err: [] }),
    restartCount: row.restart_count ?? undefined,
    incompleteTestSeconds: row.incomplete_test_seconds ?? undefined,
    afkDuration: row.afk_duration ?? undefined,
    tags: row.tags ?? undefined,
    bailedOut: row.bailed_out ?? undefined,
    blindMode: row.blind_mode ?? undefined,
    lazyMode: row.lazy_mode ?? undefined,
    funbox: row.funbox ?? undefined,
    language: row.language ?? undefined,
    difficulty: row.difficulty ?? undefined,
    numbers: row.numbers ?? undefined,
    punctuation: row.punctuation ?? undefined,
    name: row.name,
    isPb: row.is_pb ?? undefined,
    keySpacingStats: row.key_spacing_stats ?? undefined,
    keyDurationStats: row.key_duration_stats ?? undefined,
    uid: row.uid,
  };
  return replaceLegacyValues(base as unknown as DBResult);
}

export async function addResult(
  uid: string,
  result: DBResult,
): Promise<{ insertedId: string }> {
  const { data: user } = await tryCatch(getUser(uid, "add result"));
  if (!user) throw new TypeUZError(404, "User not found", "add result");

  const r = await db.queryOne<{ _id: string }>(
    `INSERT INTO results (
      uid, wpm, raw_wpm, char_stats, acc, mode, mode2, quote_length,
      timestamp, test_duration, consistency, key_consistency, chart_data,
      restart_count, incomplete_test_seconds, afk_duration, tags,
      bailed_out, blind_mode, lazy_mode, funbox, language, difficulty,
      numbers, punctuation, name, is_pb, key_spacing_stats, key_duration_stats
    ) VALUES (
      $1, $2, $3, $4::jsonb, $5, $6, $7, $8,
      $9, $10, $11, $12, $13::jsonb,
      $14, $15, $16, $17::jsonb,
      $18, $19, $20, $21::jsonb, $22, $23,
      $24, $25, $26, $27, $28::jsonb, $29::jsonb
    ) RETURNING _id`,
    [
      result.uid ?? uid,
      result.wpm,
      result.rawWpm,
      JSON.stringify(result.charStats),
      result.acc,
      result.mode,
      result.mode2,
      result.quoteLength ?? null,
      result.timestamp,
      result.testDuration,
      result.consistency,
      result.keyConsistency ?? null,
      JSON.stringify(result.chartData),
      result.restartCount ?? null,
      result.incompleteTestSeconds ?? null,
      result.afkDuration ?? null,
      JSON.stringify(result.tags ?? []),
      result.bailedOut ?? null,
      result.blindMode ?? null,
      result.lazyMode ?? null,
      JSON.stringify(result.funbox ?? []),
      result.language ?? null,
      result.difficulty ?? null,
      result.numbers ?? null,
      result.punctuation ?? null,
      result.name ?? "",
      result.isPb ?? null,
      JSON.stringify(result.keySpacingStats ?? null),
      JSON.stringify(result.keyDurationStats ?? null),
    ],
  );

  if (r === null) {
    throw new TypeUZError(500, "Failed to save result", "add result");
  }
  return { insertedId: r._id };
}

export async function deleteAll(uid: string): Promise<void> {
  await db.query("DELETE FROM results WHERE uid = $1", [uid]);
}

export async function updateTags(
  uid: string,
  resultId: string,
  tags: string[],
): Promise<void> {
  const result = await db.queryOne<{ _id: string }>(
    "SELECT _id FROM results WHERE _id = $1::uuid AND uid = $2",
    [resultId, uid],
  );
  if (!result) throw new TypeUZError(404, "Result not found");

  const userTags = await getTags(uid);
  const userTagIds = new Set(userTags.map((tag) => tag._id));
  let validTags = true;
  tags.forEach((tagId) => {
    if (!userTagIds.has(tagId)) validTags = false;
  });
  if (!validTags) {
    throw new TypeUZError(422, "One of the tag id's is not valid");
  }

  await db.query(
    "UPDATE results SET tags = $1::jsonb WHERE _id = $2::uuid AND uid = $3",
    [JSON.stringify(tags), resultId, uid],
  );
}

export async function getResult(uid: string, id: string): Promise<DBResult> {
  const row = await db.queryOne<ResultRow>(
    "SELECT * FROM results WHERE _id = $1::uuid AND uid = $2",
    [id, uid],
  );
  if (!row) throw new TypeUZError(404, "Result not found");
  return rowToDBResult(row);
}

export async function getLastResult(uid: string): Promise<DBResult> {
  const row = await db.queryOne<ResultRow>(
    "SELECT * FROM results WHERE uid = $1 ORDER BY timestamp DESC LIMIT 1",
    [uid],
  );
  if (!row) throw new TypeUZError(404, "No last result found");
  return rowToDBResult(row);
}

export async function getLastResultTimestamp(uid: string): Promise<number> {
  const row = await db.queryOne<{ timestamp: number }>(
    "SELECT timestamp FROM results WHERE uid = $1 ORDER BY timestamp DESC LIMIT 1",
    [uid],
  );
  if (!row) throw new TypeUZError(404, "No last result found");
  return row.timestamp;
}

export async function getResultByTimestamp(
  uid: string,
  timestamp: number,
): Promise<DBResult | null> {
  const row = await db.queryOne<ResultRow>(
    "SELECT * FROM results WHERE uid = $1 AND timestamp = $2",
    [uid, timestamp],
  );
  if (!row) return null;
  return rowToDBResult(row);
}

type GetResultsOpts = {
  onOrAfterTimestamp?: number;
  limit?: number;
  offset?: number;
};

export async function getResults(
  uid: string,
  opts?: GetResultsOpts,
): Promise<DBResult[]> {
  const { onOrAfterTimestamp, offset, limit } = opts ?? {};

  let sql = `SELECT _id, uid, wpm, raw_wpm, char_stats, acc, mode, mode2, quote_length,
    timestamp, test_duration, consistency, key_consistency,
    restart_count, incomplete_test_seconds, afk_duration, tags,
    bailed_out, blind_mode, lazy_mode, funbox, language, difficulty,
    numbers, punctuation, is_pb
    FROM results WHERE uid = $1`;
  const params: unknown[] = [uid];
  let idx = 2;

  if (onOrAfterTimestamp !== undefined && !isNaN(onOrAfterTimestamp)) {
    sql += ` AND timestamp >= $${idx++}`;
    params.push(onOrAfterTimestamp);
  }

  sql += " ORDER BY timestamp DESC";

  if (limit !== undefined) {
    sql += ` LIMIT $${idx++}`;
    params.push(limit);
  }
  if (offset !== undefined) {
    sql += ` OFFSET $${idx++}`;
    params.push(offset);
  }

  const rows = await db.queryAll<ResultRow>(sql, params);
  if (rows === undefined) throw new TypeUZError(404, "Result not found");
  return rows.map(rowToDBResult);
}
