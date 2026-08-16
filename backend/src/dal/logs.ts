import * as db from "../init/db";
import Logger from "../utils/logger";

export async function addLog(
  event: string,
  message: string | Record<string, unknown>,
  uid = "",
): Promise<void> {
  await insertIntoDb(event, message, uid);
}

export async function addImportantLog(
  event: string,
  message: string | Record<string, unknown>,
  uid = "",
): Promise<void> {
  await insertIntoDb(event, message, uid, true);
}

export async function deleteUserLogs(uid: string): Promise<void> {
  await db.query("DELETE FROM logs WHERE uid = $1", [uid]);
}

async function insertIntoDb(
  event: string,
  message: string | Record<string, unknown>,
  uid = "",
  important = false,
): Promise<void> {
  const stringified = JSON.stringify(message);
  Logger.info(
    `${event}\t${uid}\t${
      stringified.length > 100 ? `${stringified.slice(0, 100)}...` : stringified
    }`,
  );

  try {
    await db.query(
      `INSERT INTO logs (timestamp, uid, important, event, message)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [Date.now(), uid ?? "", important, event, stringified],
    );
  } catch (error) {
    Logger.error(`Failed to insert log into DB: ${(error as Error).message}`);
  }
}
