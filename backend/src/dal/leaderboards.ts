import * as db from "../init/db";
import Logger from "../utils/logger";
import { performance } from "perf_hooks";
import { setLeaderboard } from "../utils/prometheus";
import { isDevEnvironment, omit } from "../utils/misc";
import { getCachedConfiguration } from "../init/configuration";

import { addLog } from "./logs";
import { getFriendsUids } from "./connections";
import TypeUZError from "../utils/error";

export type DBLeaderboardEntry = {
  uid: string;
  language: string;
  mode: string;
  mode2: string;
  numbers: boolean;
  wpm: number;
  acc: number;
  raw: number;
  consistency: number | null;
  timestamp: number;
  rank: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  discord_id: string | null;
  discord_avatar: string | null;
  badge_id: number | null;
  is_premium: boolean;
};

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
  if (page < 0 || pageSize < 0) {
    throw new TypeUZError(500, "Invalid page or pageSize");
  }

  const skip = page * pageSize;
  const limit = pageSize;

  try {
    if (uid !== undefined) {
      const friendUids = await getFriendsUids(uid);
      const allUids = [...friendUids, uid];

      const rows = await db.queryAll<DBLeaderboardEntry>(
        `SELECT * FROM leaderboard_entries
         WHERE language = $1 AND mode = $2 AND mode2 = $3 AND numbers = $4
         AND uid = ANY($5::text[])
         ORDER BY rank ASC
         LIMIT $6 OFFSET $7`,
        [language, mode, mode2, numbers ?? false, allUids, limit, skip],
      );

      if (!premiumFeaturesEnabled) {
        return rows.map((it) =>
          omit(it, ["is_premium"]),
        ) as DBLeaderboardEntry[];
      }
      return rows;
    } else {
      const rows = await db.queryAll<DBLeaderboardEntry>(
        `SELECT * FROM leaderboard_entries
         WHERE language = $1 AND mode = $2 AND mode2 = $3 AND numbers = $4
         ORDER BY rank ASC
         LIMIT $5 OFFSET $6`,
        [language, mode, mode2, numbers ?? false, limit, skip],
      );

      if (!premiumFeaturesEnabled) {
        return rows.map((it) =>
          omit(it, ["is_premium"]),
        ) as DBLeaderboardEntry[];
      }
      return rows;
    }
  } catch (e) {
    if ((e as Record<string, unknown>)?.["message"] === "relation not found") {
      return false;
    }
    throw e;
  }
}

const cachedCounts = new Map<string, number>();

export async function getCount(
  mode: string,
  mode2: string,
  language: string,
  uid?: string,
  numbers?: boolean,
): Promise<number> {
  const key = `${language}_${mode}_${mode2}_${numbers ?? "nowords"}`;
  if (uid === undefined && cachedCounts.has(key)) {
    return cachedCounts.get(key) as number;
  } else {
    if (uid === undefined) {
      const result = await db.queryOne<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM leaderboard_entries
         WHERE language = $1 AND mode = $2 AND mode2 = $3 AND numbers = $4`,
        [language, mode, mode2, numbers ?? false],
      );
      const count = result?.count ?? 0;
      cachedCounts.set(key, count);
      return count;
    } else {
      const friendUids = await getFriendsUids(uid);
      const allUids = [...friendUids, uid];
      const result = await db.queryOne<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM leaderboard_entries
         WHERE language = $1 AND mode = $2 AND mode2 = $3 AND numbers = $4
         AND uid = ANY($5::text[])`,
        [language, mode, mode2, numbers ?? false, allUids],
      );
      return result?.count ?? 0;
    }
  }
}

export async function getRank(
  mode: string,
  mode2: string,
  language: string,
  uid: string,
  friendsOnly: boolean = false,
  numbers?: boolean,
): Promise<DBLeaderboardEntry | null | false> {
  try {
    if (!friendsOnly) {
      const entry = await db.queryOne<DBLeaderboardEntry>(
        `SELECT * FROM leaderboard_entries
         WHERE language = $1 AND mode = $2 AND mode2 = $3 AND numbers = $4 AND uid = $5`,
        [language, mode, mode2, numbers ?? false, uid],
      );
      return entry;
    } else {
      const friendUids = await getFriendsUids(uid);
      const allUids = [...friendUids, uid];
      const rows = await db.queryAll<DBLeaderboardEntry>(
        `SELECT * FROM leaderboard_entries
         WHERE language = $1 AND mode = $2 AND mode2 = $3 AND numbers = $4
         AND uid = ANY($5::text[])
         ORDER BY rank ASC`,
        [language, mode, mode2, numbers ?? false, allUids],
      );
      const rankedRows = rows.map((row, idx) => ({
        ...row,
        friendsRank: idx + 1,
      }));
      return rankedRows.find((r) => r.uid === uid) ?? null;
    }
  } catch (e) {
    if ((e as Record<string, unknown>)?.["message"] === "relation not found") {
      return false;
    }
    throw e;
  }
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
  const minTimeTyping = (await getCachedConfiguration(true)).leaderboards
    .minTimeTyping;

  const start1 = performance.now();
  await db.query(
    `DELETE FROM leaderboard_entries
     WHERE language = $1 AND mode = $2 AND mode2 = $3 AND numbers = $4`,
    [language, mode, mode2, numbers ?? false],
  );

  await db.query(
    `INSERT INTO leaderboard_entries (
      uid, language, mode, mode2, numbers,
      wpm, acc, raw, consistency, timestamp,
      rank, name, first_name, last_name,
      discord_id, discord_avatar, badge_id, is_premium
    )
    SELECT
      u.uid,
      $1 AS language,
      $2 AS mode,
      $3 AS mode2,
      $4 AS numbers,
      pb->>'wpm' AS wpm,
      pb->>'acc' AS acc,
      pb->>'raw' AS raw,
      pb->>'consistency' AS consistency,
      pb->>'timestamp' AS timestamp,
      ROW_NUMBER() OVER (
        ORDER BY (pb->>'wpm')::numeric DESC NULLS LAST,
                 (pb->>'acc')::numeric DESC NULLS LAST,
                 (pb->>'timestamp')::numeric DESC NULLS LAST
      ) AS rank,
      u.name,
      u.first_name,
      u.last_name,
      u.discord_id,
      u.discord_avatar,
      (SELECT (jsonb_array_elements(COALESCE(u.inventory->'badges', '[]'::jsonb))->>'id')::int
       WHERE (jsonb_array_elements(COALESCE(u.inventory->'badges', '[]'::jsonb))->>'selected')::bool = true
       LIMIT 1) AS badge_id,
      CASE
        WHEN u.premium->>'expirationTimestamp' IS NULL THEN false
        WHEN (u.premium->>'expirationTimestamp')::bigint = -1 THEN true
        WHEN (u.premium->>'expirationTimestamp')::bigint > EXTRACT(EPOCH FROM NOW())::bigint * 1000 THEN true
        ELSE false
      END AS is_premium
    FROM users u,
         jsonb_array_elements(u.personal_bests#>'{${mode},${mode2}}') AS pb
    WHERE
      u.personal_bests#>'{${mode},${mode2}}' IS NOT NULL
      AND pb->>'language' = $1
      AND (pb->>'numbers')::boolean = $4
      AND pb->>'wpm' IS NOT NULL
      AND (pb->>'wpm')::numeric > 0
      AND (u.banned IS NOT TRUE OR u.banned IS NULL)
      AND (u.lb_opt_out IS NOT TRUE OR u.lb_opt_out IS NULL)
      AND (u.needs_to_change_name IS NOT TRUE OR u.needs_to_change_name IS NULL)
      AND u.time_typing >= $5`,
    [
      language,
      mode,
      mode2,
      numbers ?? false,
      isDevEnvironment() ? 0 : minTimeTyping,
    ],
  );
  const end1 = performance.now();
  const timeToRunAggregate = (end1 - start1) / 1000;

  const start2 = performance.now();
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_lb_${language}_${mode}_${mode2}_${numbers ? "nums" : "words"}_uid
     ON leaderboard_entries(uid) WHERE language = $1 AND mode = $2 AND mode2 = $3 AND numbers = $4`,
    [language, mode, mode2, numbers ?? false],
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_lb_${language}_${mode}_${mode2}_${numbers ? "nums" : "words"}_rank
     ON leaderboard_entries(rank) WHERE language = $1 AND mode = $2 AND mode2 = $3 AND numbers = $4`,
    [language, mode, mode2, numbers ?? false],
  );
  const end2 = performance.now();
  const timeToRunIndex = (end2 - start2) / 1000;

  cachedCounts.delete(`${language}_${mode}_${mode2}_${numbers ?? "nowords"}`);

  const boundaries = [...Array(32).keys()].map((it) => it * 10);
  const statsKey = `${language}_${mode}_${mode2}_${numbers ?? "nowords"}`;

  const start3 = performance.now();
  const buckets: Record<string, number> = {};
  for (let i = 0; i < boundaries.length - 1; i++) {
    const result = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM leaderboard_entries
       WHERE language = $1 AND mode = $2 AND mode2 = $3 AND numbers = $4
       AND wpm >= $5 AND wpm < $6`,
      [
        language,
        mode,
        mode2,
        numbers ?? false,
        boundaries[i],
        boundaries[i + 1],
      ],
    );
    if (result && result.count > 0) {
      buckets[String(boundaries[i])] = result.count;
    }
  }
  const end3 = performance.now();
  const timeToSaveHistogram = (end3 - start3) / 1000;

  const existingHistogram = await db.queryOne<{
    data: Record<string, unknown>;
  }>("SELECT data FROM public_stats WHERE _id = 'speedStatsHistogram'");
  const histogramData = existingHistogram?.data ?? {};
  histogramData[statsKey] = buckets;
  await db.query(
    `INSERT INTO public_stats (_id, data) VALUES ('speedStatsHistogram', $1::jsonb)
     ON CONFLICT (_id) DO UPDATE SET data = $1::jsonb`,
    [JSON.stringify(histogramData)],
  );

  void addLog(
    `system_lb_update_${language}_${mode}_${mode2}_${numbers ?? "nowords"}`,
    `Aggregate ${timeToRunAggregate}s, loop 0s, insert 0s, index ${timeToRunIndex}s, histogram ${timeToSaveHistogram}`,
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
    SELECT DISTINCT jsonb_object_keys(lb_personal_bests->'time') AS mode2
    FROM users
    WHERE lb_personal_bests->'time' IS NOT NULL
  `);
  return (res.rows as { mode2: string }[]).map((row) => row.mode2);
}
