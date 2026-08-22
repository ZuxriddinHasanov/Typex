const { update } = require('./dist/dal/leaderboards.js');
const { initDB } = require('./dist/init/db.js');

async function run() {
  await initDB();
  const combos = [
    { mode: "time", mode2: "10", language: "english" },
    { mode: "time", mode2: "15", language: "english" },
    { mode: "time", mode2: "30", language: "english" },
    { mode: "time", mode2: "60", language: "english" },
    { mode: "time", mode2: "120", language: "english" },
    { mode: "time", mode2: "10", language: "uzbek" },
    { mode: "time", mode2: "15", language: "uzbek" },
    { mode: "time", mode2: "30", language: "uzbek" },
    { mode: "time", mode2: "60", language: "uzbek" },
    { mode: "time", mode2: "120", language: "uzbek" }
  ];
  
  for (const c of combos) {
    try {
      await update(c.mode, c.mode2, c.language);
      console.log(`Updated ${c.language} ${c.mode} ${c.mode2}`);
    } catch (e) {
      console.error(e.message);
    }
  }
  process.exit(0);
}
run();
