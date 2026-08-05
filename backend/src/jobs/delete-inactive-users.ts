import { CronJob } from "cron";
import * as db from "../init/db";
import { isDevEnvironment } from "../utils/misc";
import Logger from "../utils/logger";

const INACTIVITY_DAYS = 14;
const BATCH_SIZE = 100;

async function deleteInactiveUsers(): Promise<void> {
  if (isDevEnvironment()) {
    Logger.info("Skipping inactive user deletion in dev mode");
    return;
  }

  const cutoff = Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000;

  let totalDeleted = 0;

  while (true) {
    const inactive = await db.queryAll<{ uid: string }>(
      `SELECT uid FROM users
       WHERE (last_login_at IS NOT NULL AND last_login_at < $1)
          OR (last_login_at IS NULL AND added_at < $1)
       LIMIT $2`,
      [cutoff, BATCH_SIZE],
    );

    if (inactive.length === 0) break;

    const uids = inactive.map((u) => u.uid);

    await db.query("DELETE FROM results WHERE uid = ANY($1::text[])", [uids]);
    await db.query("DELETE FROM user_passwords WHERE uid = ANY($1::text[])", [uids]);
    await db.query("DELETE FROM users WHERE uid = ANY($1::text[])", [uids]);

    totalDeleted += uids.length;
    Logger.info(`Deleted ${uids.length} inactive users (total: ${totalDeleted})`);
  }

  if (totalDeleted > 0) {
    Logger.info(`Inactive user cleanup complete: ${totalDeleted} users deleted`);
  }
}

export default new CronJob(
  "0 0 3 * * *",
  deleteInactiveUsers,
  null,
  false,
  "UTC",
);
