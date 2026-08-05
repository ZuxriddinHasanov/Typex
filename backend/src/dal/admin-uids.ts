import * as db from "../init/db";

export async function isAdmin(uid: string): Promise<boolean> {
  const doc = await db.queryOne<{ uid: string }>(
    "SELECT uid FROM admin_uids WHERE uid = $1",
    [uid],
  );
  return doc !== null;
}
