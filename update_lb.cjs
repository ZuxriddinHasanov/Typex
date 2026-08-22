const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.knzbopsocekorqzngckc:Zuxriddin-2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  const combos = [
    { mode: "time", mode2: "10", language: "english" },
    { mode: "time", mode2: "15", language: "english" },
    { mode: "time", mode2: "30", language: "english" },
    { mode: "time", mode2: "60", language: "english" },
    { mode: "time", mode2: "10", language: "uzbek" },
    { mode: "time", mode2: "15", language: "uzbek" },
    { mode: "time", mode2: "30", language: "uzbek" },
    { mode: "time", mode2: "60", language: "uzbek" }
  ];

  for (const c of combos) {
    await pool.query(`DELETE FROM leaderboard_entries WHERE language = $1 AND mode = $2 AND mode2 = $3`, [c.language, c.mode, c.mode2]);
    await pool.query(`
      WITH candidates AS (
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
          false AS is_premium
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
        WHERE COALESCE((pb->>'numbers')::boolean, false) = false
          AND pb->>'wpm' IS NOT NULL
          AND pb->>'acc' IS NOT NULL
          AND pb->>'raw' IS NOT NULL
      ),
      best_per_user AS (
        SELECT *, ROW_NUMBER() OVER (
          PARTITION BY uid
          ORDER BY wpm DESC, acc DESC, timestamp DESC
        ) as user_rank
        FROM candidates
      ),
      ranked AS (
        SELECT *, ROW_NUMBER() OVER (
          ORDER BY wpm DESC, acc DESC, timestamp DESC
        ) AS rank
        FROM best_per_user
        WHERE user_rank = 1
      )
      INSERT INTO leaderboard_entries (
        uid, language, mode, mode2, numbers,
        wpm, acc, raw, consistency, timestamp,
        rank, name, first_name, last_name, avatar,
        discord_id, discord_avatar, badge_id, is_premium
      )
      SELECT
        uid, $1, $2, $3, false,
        wpm, acc, raw, consistency, timestamp,
        rank, name, first_name, last_name, avatar,
        discord_id, discord_avatar, badge_id, is_premium
      FROM ranked
    `, [c.language, c.mode, c.mode2]);
    console.log(`Updated ${c.language} ${c.mode} ${c.mode2}`);
  }
  await pool.end();
}
run().catch(console.error);
