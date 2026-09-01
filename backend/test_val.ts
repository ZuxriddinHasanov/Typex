import { connect, queryOne } from "./src/init/db";
import { UpdateAdConfigRequestSchema } from "@typeuz/contracts/admin";

async function main() {
  await connect();
  const row = await queryOne<{ data: unknown }>("SELECT data FROM configuration WHERE _id = 'ad_config'");
  const data = row?.data ?? {};
  console.log("DB DATA:", JSON.stringify(data).slice(0, 500));
  
  // Try to validate it
  const result = UpdateAdConfigRequestSchema.safeParse(data);
  if (!result.success) {
    console.error("VALIDATION ERROR:", JSON.stringify(result.error.errors, null, 2));
  } else {
    console.log("VALIDATION SUCCESS");
  }
  process.exit(0);
}
main();
