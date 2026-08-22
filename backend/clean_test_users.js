const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.knzbopsocekorqzngckc:Zuxriddin-2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    const res = await pool.query(`
      DELETE FROM users 
      WHERE name LIKE 'pro_typer_%' 
         OR name LIKE 'testuser%' 
         OR name LIKE 'test_user_%' 
         OR name = 'xxxxxx'
      RETURNING name
    `);
    console.log('Deleted test users:', res.rows.map(r => r.name));

    // Also delete any results for users that don't exist anymore
    const res2 = await pool.query(`
      DELETE FROM results 
      WHERE uid NOT IN (SELECT uid FROM users)
    `);
    console.log('Deleted orphaned results:', res2.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
