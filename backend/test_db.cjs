const { Client } = require("pg");
const client = new Client({
  connectionString:
    "postgresql://postgres.knzbopsocekorqzngckc:uzbektypexuz2010@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
});
client
  .connect()
  .then(() => {
    console.log("SUCCESS!");
    process.exit(0);
  })
  .catch((e) => {
    console.error("FAIL:", e.message);
    process.exit(1);
  });
