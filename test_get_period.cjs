const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.knzbopsocekorqzngckc:Zuxriddin-2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function testGetPeriod() {
  const language = 'uzbek';
  const mode = 'time';
  const mode2 = '15';
  const numbers = false;
  const daysBefore = 36500;
  const minTimestamp = Date.now() - (daysBefore * 24 * 60 * 60 * 1000);
  const skip = 0;
  const limit = 50;

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
      
      ORDER BY rank ASC
      OFFSET $6 LIMIT $7
    `;
    
  try {
    const res = await pool.query(query, [language, mode, mode2, numbers, minTimestamp, skip, limit]);
    console.log("Success! Rows:", res.rows.length);
  } catch (e) {
    console.error("FAILED:", e.message);
  }
  await pool.end();
}

testGetPeriod();
