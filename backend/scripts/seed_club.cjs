const { Client } = require("pg");

const levelsData = [
  { level: 1, name: "F & J", text: "f j f j f j f j ff jj fj jf ff jj fj jf" },
  { level: 2, name: "Space Key", text: "f j f j f j f j f j f j f j f j" },
  { level: 3, name: "D & K", text: "d k d k d k d k dd kk dk kd dd kk dk kd" },
  { level: 4, name: "F J D K", text: "fd kj df jk f d k j fd kj df jk" },
  { level: 5, name: "S & L", text: "s l s l s l s l ss ll sl ls ss ll sl ls" },
  { level: 6, name: "A & ;", text: "a ; a ; a ; a ; aa ;; a; ;a aa ;; a; ;a" },
  { level: 7, name: "Home Row 1", text: "asdf jkl; asdf jkl; asdf jkl; asdf jkl;" },
  { level: 8, name: "Home Row 2", text: "fdsa ;lkj fdsa ;lkj fdsa ;lkj fdsa ;lkj" },
  { level: 9, name: "G & H", text: "g h g h g h g h gg hh gh hg gg hh gh hg" },
  { level: 10, name: "Home Row Full", text: "asdfg hjkl; asdfg hjkl; gfdsa ;lkjh gfdsa" }
];

// Let's generate up to 50 dynamically for MVP
const letters = "abcdefghijklmnopqrstuvwxyz";
for(let i = 11; i <= 50; i++) {
  const chars = letters.slice(0, (i % 26) + 1);
  let text = "";
  for(let j=0; j<20; j++) {
    text += chars[Math.floor(Math.random() * chars.length)] + (j % 4 === 0 ? " " : "");
  }
  levelsData.push({ level: i, name: `Level ${i}`, text: text.trim() });
}

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres.knzbopsocekorqzngckc:Zuxriddin-2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
  });
  await client.connect();
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS club_lessons (
      level INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      text TEXT NOT NULL
    );
  `);
  
  await client.query(`TRUNCATE TABLE club_lessons`);
  
  for(const lesson of levelsData) {
    await client.query(
      `INSERT INTO club_lessons (level, name, text) VALUES ($1, $2, $3)`,
      [lesson.level, lesson.name, lesson.text]
    );
  }
  console.log("Seeded 50 club lessons successfully.");
  await client.end();
}
run().catch(console.error);
