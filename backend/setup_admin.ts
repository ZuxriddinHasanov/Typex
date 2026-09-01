import * as db from './src/init/db.ts';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await db.connect();
  const username = 'admin';
  const hashed = await bcrypt.hash('TypeUZ!2026', 10);
  const data = JSON.stringify({
    username,
    passwordHash: hashed,
    createdAt: Date.now()
  });
  
  await db.query(`
    INSERT INTO admin_credentials (username, data)
    VALUES ($1, $2)
    ON CONFLICT (username) DO UPDATE SET data = EXCLUDED.data
  `, [username, data]);

  // also add to admin_uids so they bypass permission check
  await db.query('INSERT INTO admin_uids (uid) VALUES ($1) ON CONFLICT DO NOTHING', [username]);

  console.log('Admin user updated:', username);
  process.exit(0);
}
run();
