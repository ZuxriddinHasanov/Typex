import * as db from "../init/db";
import Logger from "../utils/logger";
import { performance } from "perf_hooks";
import { setLeaderboard } from "../utils/prometheus";
import { isDevEnvironment, omit } from "../utils/misc";

import { addLog } from "./logs";
import { getFriendsUids } from "./connections";
import TypeUZError from "../utils/error";

export type DBLeaderboardEntry = {
  uid: string;
  wpm: number;
  acc: number;
  raw: number;
  consistency?: number;
  timestamp: number;
  rank: number;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  discordId?: string;
  discordAvatar?: string;
  badgeId?: number;
  isPremium?: boolean;
  friendsRank?: number;
};

type LeaderboardRow = {
  uid: string;
  wpm: number;
  acc: number;
  raw: number;
  consistency: number | null;
  timestamp: number;
  rank: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  discord_id: string | null;
  discord_avatar: string | null;
  badge_id: number | null;
  is_premium: boolean;
  friends_rank?: number;
};

function mapLeaderboardRow(row: LeaderboardRow): DBLeaderboardEntry {
  return {
    uid: row.uid,
    wpm: Number(row.wpm),
    acc: Number(row.acc),
    raw: Number(row.raw),
    timestamp: Number(row.timestamp),
    rank: Number(row.rank),
    name: row.name,
    ...(row.consistency === null
      ? {}
      : { consistency: Number(row.consistency) }),
    ...(row.first_name === null ? {} : { firstName: row.first_name }),
    ...(row.last_name === null ? {} : { lastName: row.last_name }),
    ...(row.avatar === null ? {} : { avatar: row.avatar }),
    ...(row.discord_id === null ? {} : { discordId: row.discord_id }),
    ...(row.discord_avatar === null
      ? {}
      : { discordAvatar: row.discord_avatar }),
    ...(row.badge_id === null ? {} : { badgeId: row.badge_id }),
    isPremium: row.is_premium,
    ...(row.friends_rank === undefined
      ? {}
      : { friendsRank: Number(row.friends_rank) }),
  };
}

export async function get(
  mode: string,
  mode2: string,
  language: string,
  page: number,
  pageSize: number,
  premiumFeaturesEnabled: boolean = false,
  uid?: string,
  numbers?: boolean,
): Promise<DBLeaderboardEntry[] | false> {
  return getPeriod(mode, mode2, language, page, pageSize, premiumFeaturesEnabled, uid, numbers, 36500);
}

export async function getCount(
  mode: string,
  mode2: string,
  language: string,
  uid?: string,
  numbers?: boolean,
): Promise<number> {
  return getPeriodCount(mode, mode2, language, uid, numbers, 36500);
}

export async function getRank(
  mode: string,
  mode2: string,
  language: string,
  uid: string,
  friendsOnly: boolean = false,
  numbers?: boolean,
): Promise<DBLeaderboardEntry | null | false> {
  return getPeriodRank(mode, mode2, language, uid, friendsOnly, numbers, 36500);
}

export async function update(
  mode: string,
  mode2: string,
  language: string,
  numbers?: boolean,
): Promise<{
  message: string;
  rank?: number;
}> {
  const leaderboardKey = `${language}:${mode}:${mode2}:${numbers ?? false}`;
  const statsKey = `${language}_${mode}_${mode2}${numbers ? "_numbers" : ""}`;

  const start1 = performance.now();
  const buckets = await db.transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      leaderboardKey,
    ]);
    await client.query(
      `DELETE FROM leaderboard_entries
       WHERE language = $1 AND mode = $2 AND mode2 = $3 AND numbers = $4`,
      [language, mode, mode2, numbers ?? false],
    );

    await client.query(
      `WITH candidates AS (
        SELECT
          u.uid,
          (pb->>'wpm')::numeric AS wpm,
          (pb->>'acc')::numeric AS acc,
          (pb->>'raw')::numeric AS raw,
          (pb->>'consistency')::numeric AS consistency,
          (pb->>'timestamp')::bigint AS timestamp,
          u.name,
          u.first_name,
          u.last_name,
          u.avatar,
          u.discord_id,
          u.discord_avatar,
          selected_badge.badge_id,
          CASE
            WHEN u.premium->>'expirationTimestamp' IS NULL THEN false
            WHEN (u.premium->>'expirationTimestamp')::bigint = -1 THEN true
            WHEN (u.premium->>'expirationTimestamp')::bigint > EXTRACT(EPOCH FROM NOW())::bigint * 1000 THEN true
            ELSE false
          END AS is_premium
        FROM users u
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(u.personal_bests #> ARRAY[$2, $3]::text[]) = 'array'
            THEN u.personal_bests #> ARRAY[$2, $3]::text[]
            ELSE '[]'::jsonb
          END
        ) AS pb
        LEFT JOIN LATERAL (
          SELECT (badge->>'id')::int AS badge_id
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(u.inventory->'badges') = 'array'
              THEN u.inventory->'badges'
              ELSE '[]'::jsonb
            END
          ) AS badge
          WHERE COALESCE((badge->>'selected')::boolean, false)
          LIMIT 1
        ) AS selected_badge ON true
        WHERE COALESCE((pb->>'numbers')::boolean, false) = $4
          AND pb->>'wpm' IS NOT NULL
          AND pb->>'acc' IS NOT NULL
          AND pb->>'raw' IS NOT NULL
          AND pb->>'timestamp' IS NOT NULL
          AND (pb->>'wpm')::numeric > 0
          AND COALESCE((pb->>'lazyMode')::boolean, false) = false
          AND COALESCE(u.banned, false) = false
          AND COALESCE(u.lb_opt_out, false) = false
          AND COALESCE(u.needs_to_change_name, false) = false
          AND u.time_typing >= $5
      ), best_per_user AS (
        SELECT DISTINCT ON (uid) *
        FROM candidates
        ORDER BY uid, wpm DESC, acc DESC, timestamp DESC
      ), ranked AS (
        SELECT *, ROW_NUMBER() OVER (
          ORDER BY wpm DESC, acc DESC, timestamp DESC
        ) AS rank
        FROM best_per_user
      )
      INSERT INTO leaderboard_entries (
        uid, language, mode, mode2, numbers,
        wpm, acc, raw, consistency, timestamp,
        rank, name, first_name, last_name, avatar,
        discord_id, discord_avatar, badge_id, is_premium
      )
      SELECT
        uid, $1, $2, $3, $4,
        wpm, acc, raw, consistency, timestamp,
        rank, name, first_name, last_name, avatar,
        discord_id, discord_avatar, badge_id, is_premium
      FROM ranked`,
      [language, mode, mode2, numbers ?? false, 0],
    );

    const histogramRows = await client.query<{
      boundary: number;
      count: number;
    }>(
      `SELECT (FLOOR(wpm / 10) * 10)::int AS boundary,
              COUNT(*)::int AS count
       FROM leaderboard_entries
       WHERE language = $1 AND mode = $2 AND mode2 = $3 AND numbers = $4
         AND wpm >= 0 AND wpm < 310
       GROUP BY boundary`,
      [language, mode, mode2, numbers ?? false],
    );
    const nextBuckets = Object.fromEntries(
      histogramRows.rows.map((row) => [String(row.boundary), row.count]),
    );

    await client.query(
      `INSERT INTO public_stats (_id, data)
       VALUES ('speedStatsHistogram', jsonb_build_object($2::text, $1::jsonb))
       ON CONFLICT (_id) DO UPDATE SET data = jsonb_set(
         COALESCE(public_stats.data, '{}'::jsonb),
         ARRAY[$2]::text[],
         $1::jsonb,
         true
       )`,
      [JSON.stringify(nextBuckets), statsKey],
    );
    return nextBuckets;
  });
  const end1 = performance.now();
  const timeToRunAggregate = (end1 - start1) / 1000;
  const timeToRunIndex = 0;
  const timeToSaveHistogram = 0;

  void addLog(
    `system_lb_update_${language}_${mode}_${mode2}_${numbers ?? "nowords"}`,
    `Aggregate ${timeToRunAggregate}s, entries ${Object.values(buckets).reduce((sum, count) => sum + count, 0)}, index ${timeToRunIndex}s, histogram ${timeToSaveHistogram}`,
  );

  setLeaderboard(language, mode, mode2, [
    timeToRunAggregate,
    0,
    0,
    timeToRunIndex,
  ]);

  return {
    message: "Successfully updated leaderboard",
  };
}

export async function createIndicies(): Promise<void> {
  if (isDevEnvironment()) {
    Logger.info("Updating leaderboards in dev mode...");
    const combos = [
      { mode: "time", mode2: "15", language: "english" },
      { mode: "time", mode2: "60", language: "english" },
      { mode: "time", mode2: "30", language: "english" },
      { mode: "time", mode2: "120", language: "english" },
      { mode: "time", mode2: "15", language: "uzbek" },
      { mode: "time", mode2: "60", language: "uzbek" },
      { mode: "time", mode2: "15", language: "russian" },
      { mode: "time", mode2: "60", language: "russian" },
    ];
    for (const { mode, mode2, language } of combos) {
      await update(mode, mode2, language);
    }
  }
}

export async function getActiveTimeModes(): Promise<string[]> {
  const res = await db.query(`
    SELECT DISTINCT jsonb_object_keys(personal_bests->'time') AS mode2
    FROM users
    WHERE personal_bests->'time' IS NOT NULL
  `);
  return (res.rows as { mode2: string }[]).map((row) => row.mode2);
}

export async function purgeUser(uid: string): Promise<void> {
  await db.query("DELETE FROM leaderboard_entries WHERE uid = $1", [uid]);
}

export async function getPeriod(
  mode: string,
  mode2: string,
  language: string,
  page: number,
  pageSize: number,
  premiumFeaturesEnabled: boolean = false,
  uid?: string,
  numbers?: boolean,
  daysBefore: number = 7,
): Promise<DBLeaderboardEntry[] | false> {
  const skip = page * pageSize;
  const limit = pageSize;
  const minTimestamp = Date.now() - (daysBefore * 24 * 60 * 60 * 1000);

  let uidsFilter: string[] = [];
  if (uid !== undefined) {
    uidsFilter = [...(await getFriendsUids(uid)), uid];
  }

  const query = `
    WITH valid_results AS (
      SELECT r.uid, r.wpm, r.acc, r.raw_wpm as raw, r.consistency, r.timestamp,
        CASE
          WHEN u.premium->>'expirationTimestamp' IS NULL THEN false
          WHEN (u.premium->>'expirationTimestamp')::bigint = -1 THEN true
          WHEN (u.premium->>'expirationTimestamp')::bigint > EXTRACT(EPOCH FROM NOW())::bigint * 1000 THEN true
          ELSE false
        END AS is_premium,
        u.name, u.first_name, u.last_name, u.avatar, u.discord_id, u.discord_avatar,
        (
          SELECT (badge->>'id')::int
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(u.inventory->'badges') = 'array' THEN u.inventory->'badges'
              ELSE '[]'::jsonb
            END
          ) AS badge
          WHERE COALESCE((badge->>'selected')::boolean, false)
          LIMIT 1
        ) as badge_id
      FROM results r
      JOIN users u ON r.uid = u.uid
      WHERE $1 = $1 AND r.mode = $2 AND r.mode2 = $3 AND COALESCE(r.numbers, false) = $4
        AND r.timestamp >= $5
        AND r.wpm > 0 AND r.acc > 0
        AND COALESCE(u.banned, false) = false
        AND COALESCE(u.lb_opt_out, false) = false
        AND COALESCE(u.needs_to_change_name, false) = false
    ),
    best_results AS (
      SELECT DISTINCT ON (uid) *
      FROM valid_results
      ORDER BY uid, wpm DESC, acc DESC, timestamp DESC
    ),
    ranked AS (
      SELECT *, ROW_NUMBER() OVER (ORDER BY wpm DESC, acc DESC, timestamp DESC)::int AS rank
      FROM best_results
    )
    SELECT *, ROW_NUMBER() OVER (ORDER BY rank ASC)::int AS friends_rank
    FROM ranked
    ${uid !== undefined ? 'WHERE uid = ANY($8::text[])' : ''}
    ORDER BY rank ASC
    LIMIT $6 OFFSET $7
  `;

  const params = uid !== undefined 
    ? [language, mode, mode2, numbers ?? false, minTimestamp, limit, skip, uidsFilter]
    : [language, mode, mode2, numbers ?? false, minTimestamp, limit, skip];
    
  try {
    const rows = await db.queryAll<LeaderboardRow>(query, params);
    const entries = rows.map(mapLeaderboardRow);
    return premiumFeaturesEnabled ? entries : entries.map(it => omit(it, ['isPremium']));
  } catch (e) {
    console.error("getPeriod query failed:", e);
    return false;
  }
}

export async function getPeriodRank(
  mode: string,
  mode2: string,
  language: string,
  uid: string,
  friendsOnly: boolean = false,
  numbers?: boolean,
  daysBefore: number = 7,
): Promise<DBLeaderboardEntry | null | false> {
  const minTimestamp = Date.now() - (daysBefore * 24 * 60 * 60 * 1000);
  let uidsFilter: string[] = [];
  if (friendsOnly) {
    uidsFilter = [...(await getFriendsUids(uid)), uid];
  }

  const query = `
    WITH valid_results AS (
      SELECT r.uid, r.wpm, r.acc, r.raw_wpm as raw, r.consistency, r.timestamp,
        CASE
          WHEN u.premium->>'expirationTimestamp' IS NULL THEN false
          WHEN (u.premium->>'expirationTimestamp')::bigint = -1 THEN true
          WHEN (u.premium->>'expirationTimestamp')::bigint > EXTRACT(EPOCH FROM NOW())::bigint * 1000 THEN true
          ELSE false
        END AS is_premium,
        u.name, u.first_name, u.last_name, u.avatar, u.discord_id, u.discord_avatar,
        (
          SELECT (badge->>'id')::int
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(u.inventory->'badges') = 'array' THEN u.inventory->'badges'
              ELSE '[]'::jsonb
            END
          ) AS badge
          WHERE COALESCE((badge->>'selected')::boolean, false)
          LIMIT 1
        ) as badge_id
      FROM results r
      JOIN users u ON r.uid = u.uid
      WHERE $1 = $1 AND r.mode = $2 AND r.mode2 = $3 AND COALESCE(r.numbers, false) = $4
        AND r.timestamp >= $5
        AND r.wpm > 0 AND r.acc > 0
        AND COALESCE(u.banned, false) = false
        AND COALESCE(u.lb_opt_out, false) = false
        AND COALESCE(u.needs_to_change_name, false) = false
    ),
    best_results AS (
      SELECT DISTINCT ON (uid) *
      FROM valid_results
      ORDER BY uid, wpm DESC, acc DESC, timestamp DESC
    ),
    ranked AS (
      SELECT *, ROW_NUMBER() OVER (ORDER BY wpm DESC, acc DESC, timestamp DESC)::int AS rank
      FROM best_results
    )
    SELECT *, ROW_NUMBER() OVER (ORDER BY rank ASC)::int AS friends_rank
    FROM ranked
    ${friendsOnly ? 'WHERE uid = ANY($6::text[])' : ''}
  `;

  const params = friendsOnly
    ? [language, mode, mode2, numbers ?? false, minTimestamp, uidsFilter]
    : [language, mode, mode2, numbers ?? false, minTimestamp];
    
  try {
    const rows = await db.queryAll<LeaderboardRow>(query, params);
    const rankedRows = rows.map(mapLeaderboardRow);
    return rankedRows.find(r => r.uid === uid) ?? null;
  } catch (e) {
    return false;
  }
}

export async function getPeriodCount(
  mode: string,
  mode2: string,
  language: string,
  uid?: string,
  numbers?: boolean,
  daysBefore: number = 7,
): Promise<number> {
  const minTimestamp = Date.now() - (daysBefore * 24 * 60 * 60 * 1000);
  let uidsFilter: string[] = [];
  if (uid !== undefined) {
    uidsFilter = [...(await getFriendsUids(uid)), uid];
  }

  const query = `
    WITH valid_results AS (
      SELECT r.uid
      FROM results r
      JOIN users u ON r.uid = u.uid
      WHERE $1 = $1 AND r.mode = $2 AND r.mode2 = $3 AND COALESCE(r.numbers, false) = $4
        AND r.timestamp >= $5
        AND r.wpm > 0 AND r.acc > 0
        AND COALESCE(u.banned, false) = false
        AND COALESCE(u.lb_opt_out, false) = false
        AND COALESCE(u.needs_to_change_name, false) = false
    ),
    best_results AS (
      SELECT DISTINCT ON (uid) uid
      FROM valid_results
    )
    SELECT COUNT(*)::int AS count FROM best_results
    ${uid !== undefined ? 'WHERE uid = ANY($6::text[])' : ''}
  `;

  const params = uid !== undefined
    ? [language, mode, mode2, numbers ?? false, minTimestamp, uidsFilter]
    : [language, mode, mode2, numbers ?? false, minTimestamp];
    
  try {
    const result = await db.queryOne<{ count: number }>(query, params);
    return result?.count ?? 0;
  } catch (e) {
    console.error("getPeriodCount query failed:", e);
    return 0;
  }
}


export async function getActiveLeaderboards(): Promise<
  { mode: string; mode2: string; language: string; numbers: boolean }[]
> {
  return await db.queryAll(
    `SELECT DISTINCT mode, mode2, language, numbers FROM (
       SELECT
         'time' AS mode,
         time_mode.mode2,
         pb->>'language' AS language,
         COALESCE((pb->>'numbers')::boolean, false) AS numbers
       FROM users u
       CROSS JOIN LATERAL jsonb_object_keys(
         COALESCE(u.personal_bests->'time', '{}'::jsonb)
       ) AS time_mode(mode2)
       CROSS JOIN LATERAL jsonb_array_elements(
         COALESCE(u.personal_bests #> ARRAY['time', time_mode.mode2]::text[], '[]'::jsonb)
       ) AS pb
       WHERE pb->>'language' IS NOT NULL
       UNION
       SELECT
         'words' AS mode,
         words_mode.mode2,
         pb->>'language' AS language,
         COALESCE((pb->>'numbers')::boolean, false) AS numbers
       FROM users u
       CROSS JOIN LATERAL jsonb_object_keys(
         COALESCE(u.personal_bests->'words', '{}'::jsonb)
       ) AS words_mode(mode2)
       CROSS JOIN LATERAL jsonb_array_elements(
         COALESCE(u.personal_bests #> ARRAY['words', words_mode.mode2]::text[], '[]'::jsonb)
       ) AS pb
       WHERE pb->>'language' IS NOT NULL
       UNION
       SELECT mode, mode2, language, numbers
       FROM leaderboard_entries
       WHERE mode IN ('time', 'words')
     ) AS active`,
  );
}
