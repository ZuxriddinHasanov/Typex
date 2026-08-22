const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.knzbopsocekorqzngckc:Zuxriddin-2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    // Delete from best_results where the user doesn't exist anymore
    const res3 = await pool.query(`
      DELETE FROM best_results 
      WHERE uid NOT IN (SELECT uid FROM users)
    `);
    console.log('Deleted orphaned best_results:', res3.rowCount);
    
    // Check if there is a 'leaderboards' table or materialized view
    // If it's a table, we can just clear it and let the cron job rebuild it
    const checkTable = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'leaderboards'
    `);
    
    if (checkTable.rowCount > 0) {
      console.log('Leaderboards table exists.');
      const res4 = await pool.query(`DELETE FROM leaderboards WHERE uid NOT IN (SELECT uid FROM users)`);
      console.log('Deleted orphaned leaderboards:', res4.rowCount);
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
