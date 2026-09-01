import { connect, getDb } from "./src/init/db";
import * as PublicController from "./src/api/controllers/public";
import * as AdminController from "./src/api/controllers/admin";

async function main() {
  await connect();
  console.log("--- PUBLIC API ---");
  const publicRes = await PublicController.getPublicAdConfig({} as any);
  console.log(JSON.stringify(publicRes, null, 2));
  
  console.log("--- ADMIN API ---");
  const adminRes = await AdminController.getAdConfig({} as any);
  console.log(JSON.stringify(adminRes, null, 2));
  
  process.exit(0);
}
main();
