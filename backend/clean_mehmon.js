const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.knzbopsocekorqzngckc:Zuxriddin-2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    // Delete guest/mehmon users
    const res = await pool.query(`
      DELETE FROM users 
      WHERE name LIKE '%Mehmon%' OR name ILIKE '%guest%'
      RETURNING name
    `);
    console.log('Deleted Mehmon users:', res.rows.map(r => r.name));

    // Delete orphaned results
    const res2 = await pool.query(`
      DELETE FROM results 
      WHERE uid NOT IN (SELECT uid FROM users)
    `);
    console.log('Deleted orphaned results:', res2.rowCount);
    
    // Delete orphaned best_results
    const res3 = await pool.query(`
      DELETE FROM best_results 
      WHERE uid NOT IN (SELECT uid FROM users)
    `);
    console.log('Deleted orphaned best_results:', res3.rowCount);
    
    // Delete orphaned from leaderboard_entries (if it exists)
    const checkTable = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'leaderboard_entries'
    `);
    
    if (checkTable.rowCount > 0) {
      const res4 = await pool.query(`DELETE FROM leaderboard_entries WHERE uid NOT IN (SELECT uid FROM users)`);
      console.log('Deleted orphaned leaderboard_entries:', res4.rowCount);
      
      // Also strictly delete any entry named Mehmon directly just in case they don't have a user record
      const res5 = await pool.query(`DELETE FROM leaderboard_entries WHERE name LIKE '%Mehmon%' OR name ILIKE '%guest%'`);
      console.log('Deleted direct Mehmon leaderboard entries:', res5.rowCount);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
