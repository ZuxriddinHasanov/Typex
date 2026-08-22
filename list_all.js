const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.knzbopsocekorqzngckc:Zuxriddin-2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    const res = await pool.query(`SELECT name FROM users`);
    console.log(res.rows.map(r => r.name));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
