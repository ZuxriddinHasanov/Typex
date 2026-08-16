import { CronJob } from "cron";
import GeorgeQueue from "../queues/george-queue";
import * as LeaderboardsDAL from "../dal/leaderboards";
import { getCachedConfiguration } from "../init/configuration";
import Logger from "../utils/logger";

const CRON_SCHEDULE = "0 */2 * * * *";
const RECENT_AGE_MINUTES = 10;
const RECENT_AGE_MILLISECONDS = RECENT_AGE_MINUTES * 60 * 1000;

async function updateLeaderboardAndNotifyChanges(
  mode: string,
  leaderboardMode2: string,
  language: string,
  numbers: boolean,
): Promise<void> {
  const top10BeforeUpdate = (await LeaderboardsDAL.get(
    mode,
    leaderboardMode2,
    language,
    0,
    10,
    false,
    undefined,
    numbers,
  )) as LeaderboardsDAL.DBLeaderboardEntry[];

  const previousRecordsMap = Object.fromEntries(
    top10BeforeUpdate.map((record) => {
      return [record.uid, record];
    }),
  );

  await LeaderboardsDAL.update(mode, leaderboardMode2, language, numbers);

  const top10AfterUpdate = (await LeaderboardsDAL.get(
    mode,
    leaderboardMode2,
    language,
    0,
    10,
    false,
    undefined,
    numbers,
  )) as LeaderboardsDAL.DBLeaderboardEntry[];

  const newRecords = top10AfterUpdate.filter((record) => {
    const userId = record.uid;

    const previousMapUser = previousRecordsMap[userId];
    const userImprovedRank =
      previousMapUser && previousMapUser.rank > record.rank;

    const newUserInTop10 = !(userId in previousRecordsMap);

    const isRecentRecord =
      record.timestamp > Date.now() - RECENT_AGE_MILLISECONDS;

    return (userImprovedRank === true || newUserInTop10) && isRecentRecord;
  });

  if (newRecords.length > 0) {
    const leaderboardId = `${mode} ${leaderboardMode2} ${language}${numbers ? " numbers" : ""}`;

    const mapped = newRecords.map((r) => ({
      ...r,
      consistency: r.consistency ?? undefined,
    }));
    await GeorgeQueue.announceLeaderboardUpdate(mapped, leaderboardId);
  }
}

async function updateLeaderboards(): Promise<void> {
  try {
    const { maintenance } = await getCachedConfiguration();
    if (maintenance) {
      return;
    }

    const activeLeaderboards = await LeaderboardsDAL.getActiveLeaderboards();

    for (const { mode, mode2, language, numbers } of activeLeaderboards) {
      await updateLeaderboardAndNotifyChanges(mode, mode2, language, numbers);
    }
  } catch (error) {
    Logger.error(`Failed to update leaderboards: ${(error as Error).message}`);
  }
}

export default new CronJob(CRON_SCHEDULE, updateLeaderboards);
