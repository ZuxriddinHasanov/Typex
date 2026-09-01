import * as db from './src/init/db.ts';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  await db.connect();
  const res = await db.queryOne<{uid: string}>('SELECT uid FROM admin_uids LIMIT 1');
  if(!res) return console.log('no admin');
  const hashed = await bcrypt.hash('TypeUZ_Admin!2026', 10);
  await db.query('UPDATE custom_auth_passwords SET password = $1 WHERE uid = $2', [hashed, res.uid]);
  console.log('Password updated for uid', res.uid);
  process.exit(0);
}
run();
