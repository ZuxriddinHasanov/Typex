import * as db from "../init/db";

import { isDevEnvironment } from "../utils/misc";

export async function isAdmin(uid: string): Promise<boolean> {
  if (isDevEnvironment()) return true;
  const doc = await db.queryOne<{ uid: string }>(
    "SELECT uid FROM admin_uids WHERE uid = $1",
    [uid],
  );
  return doc !== null;
}
