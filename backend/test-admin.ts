import { getProfile } from "./src/api/controllers/user";
import { connect } from "./src/init/db";

async function run() {
  await connect();
  const req = { params: { uidOrName: "yaxyo" }, query: { isUid: false }, ip: "127.0.0.1", raw: { headers: {} } } as any;
  console.log("Calling getProfile...");
  const res = await getProfile(req);
  console.log("Result:", JSON.stringify(res, null, 2));
  process.exit(0);
}
run();
