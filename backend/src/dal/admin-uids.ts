import * as db from "../init/db";

import { isDevEnvironment } from "../utils/misc";

export async function isAdmin(uid: string): Promise<boolean> {
  if (isDevEnvironment()) return true;
  if (process.env["ADMIN_USERNAME"] && uid.toLowerCase() === process.env["ADMIN_USERNAME"].toLowerCase()) return true;
  
  const doc = await db.queryOne<{ uid: string }>(
    "SELECT uid FROM admin_uids WHERE uid = $1",
    [uid],
  );
  if (doc !== null) return true;

  try {
    const credDoc = await db.queryOne<{ username: string }>(
      "SELECT username FROM admin_credentials WHERE username = $1",
      [uid.toLowerCase()],
    );
    return credDoc !== null;
  } catch {
    return false;
  }
}
