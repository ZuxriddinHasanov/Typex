const test = async (name, url_uz, url_en) => {
  try {
    const [rUz, rEn] = await Promise.all([fetch(url_uz), fetch(url_en || url_uz)]);
    const [dUz, dEn] = await Promise.all([rUz.json(), rEn.json()]);
    const ok = rUz.ok && rEn.ok;
    const sameCount = dUz.data?.entries?.length === dEn.data?.entries?.length;
    const uzCount = dUz.data?.entries?.length;
    const enCount = dEn.data?.entries?.length;
    console.log(`${name}: OK=${ok}, Same=${sameCount}, CountUz=${uzCount}, CountEn=${enCount}`);
    if (!ok) console.log("  ERR:", dUz.message || dUz);
  } catch (e) {
    console.log(`${name}: ERR`, e.message);
  }
};

const base = 'https://typex-backend-yrvx.onrender.com';

const run = async () => {
  await test('Time 10 All-Time', 
    `${base}/leaderboards?mode=time&mode2=10&language=uzbek&page=0&pageSize=50`,
    `${base}/leaderboards?mode=time&mode2=10&language=english&page=0&pageSize=50`);
    
  await test('Time 15 All-Time', 
    `${base}/leaderboards?mode=time&mode2=15&language=uzbek&page=0&pageSize=50`,
    `${base}/leaderboards?mode=time&mode2=15&language=english&page=0&pageSize=50`);

  await test('Words 10 All-Time', 
    `${base}/leaderboards?mode=words&mode2=10&language=uzbek&page=0&pageSize=50`,
    `${base}/leaderboards?mode=words&mode2=10&language=english&page=0&pageSize=50`);

  await test('Time 15 Daily', 
    `${base}/leaderboards/daily?mode=time&mode2=15&language=uzbek&page=0&pageSize=50`,
    `${base}/leaderboards/daily?mode=time&mode2=15&language=english&page=0&pageSize=50`);
    
  await test('Weekly XP', 
    `${base}/leaderboards/weekly?page=0&pageSize=50`);
};

run();
