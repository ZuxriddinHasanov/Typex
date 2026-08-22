const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.knzbopsocekorqzngckc:Zuxriddin-2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    const res4 = await pool.query(`DELETE FROM leaderboard_entries WHERE uid NOT IN (SELECT uid FROM users)`);
    console.log('Deleted orphaned leaderboard_entries:', res4.rowCount);
    
    const res5 = await pool.query(`DELETE FROM leaderboard_entries WHERE name LIKE '%Mehmon%' OR name ILIKE '%guest%'`);
    console.log('Deleted direct Mehmon leaderboard entries:', res5.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
