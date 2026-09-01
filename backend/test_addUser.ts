import { connect } from "./src/init/db";
import { addUser, findByEmail } from "./src/dal/user";
import crypto from "crypto";
async function run() {
  await connect();
  const uid = crypto.randomUUID();
  const email = "test123456@github.com";
  try {
    await addUser("testuser1234", email, uid);
    const user = await findByEmail(email);
    console.log("User found:", user !== undefined);
  } catch (e) {
    console.error(e);
  }
}
run();
