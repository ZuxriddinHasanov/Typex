const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.knzbopsocekorqzngckc:Zuxriddin-2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    const res = await pool.query(`SELECT name FROM leaderboard_entries WHERE name LIKE '%Mehmon%'`);
    console.log('Mehmon found:', res.rows.length);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
