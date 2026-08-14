import { TypeUZResponse } from "../../utils/typeuz-response";
import * as LeaderboardsDAL from "../../dal/leaderboards";
import * as ConnectionsDal from "../../dal/connections";
import TypeUZError from "../../utils/error";
import * as DailyLeaderboards from "../../utils/daily-leaderboards";
import * as WeeklyXpLeaderboard from "../../services/weekly-xp-leaderboard";
import {
  DailyLeaderboardQuery,
  GetDailyLeaderboardQuery,
  GetDailyLeaderboardRankQuery,
  GetDailyLeaderboardResponse,
  GetLeaderboardDailyRankResponse,
  GetLeaderboardQuery,
  GetLeaderboardRankQuery,
  GetLeaderboardRankResponse,
  GetLeaderboardResponse,
  GetWeeklyXpLeaderboardQuery,
  GetWeeklyXpLeaderboardRankQuery,
  GetWeeklyXpLeaderboardRankResponse,
  GetWeeklyXpLeaderboardResponse,
} from "@typeuz/contracts/leaderboards";
import { Configuration } from "@typeuz/schemas/configuration";
import {
  getCurrentDayTimestamp,
  getCurrentWeekTimestamp,
  MILLISECONDS_IN_DAY,
} from "@typeuz/util/date-and-time";
import { TypeUZRequest } from "../types";

export async function getLeaderboard(
  req: TypeUZRequest<GetLeaderboardQuery>,
): Promise<GetLeaderboardResponse> {
  const { language, mode, mode2, page, pageSize, friendsOnly, numbers } =
    req.query;
  const { uid } = req.ctx.decodedToken;
  const connectionsConfig = req.ctx.configuration.connections;

  const friendsOnlyUid = getFriendsOnlyUid(uid, friendsOnly, connectionsConfig);

  const leaderboard = await LeaderboardsDAL.get(
    mode,
    mode2,
    language,
    page,
    pageSize,
    req.ctx.configuration.users.premium.enabled,
    friendsOnlyUid,
    numbers,
  );

  if (leaderboard === false) {
    throw new TypeUZError(
      503,
      "Leaderboard is currently updating. Please try again in a few seconds.",
    );
  }

  const count = await LeaderboardsDAL.getCount(
    mode,
    mode2,
    language,
    friendsOnlyUid,
    numbers,
  );
  const normalizedLeaderboard = leaderboard.map((entry) => {
    const publicEntry = { ...entry } as Record<string, unknown>;
    delete publicEntry["_id"];
    return publicEntry;
  }) as never[];

  return new TypeUZResponse("Leaderboard retrieved", {
    count,
    entries: normalizedLeaderboard,
    pageSize,
  });
}

export async function getRankFromLeaderboard(
  req: TypeUZRequest<GetLeaderboardRankQuery>,
): Promise<GetLeaderboardRankResponse> {
  const { language, mode, mode2, friendsOnly, numbers } = req.query;
  const { uid } = req.ctx.decodedToken;
  const connectionsConfig = req.ctx.configuration.connections;

  const data = await LeaderboardsDAL.getRank(
    mode,
    mode2,
    language,
    uid,
    getFriendsOnlyUid(uid, friendsOnly, connectionsConfig) !== undefined,
    numbers,
  );
  if (data === false) {
    throw new TypeUZError(
      503,
      "Leaderboard is currently updating. Please try again in a few seconds.",
    );
  }

  if (data === null) {
    return new TypeUZResponse("Rank retrieved", null);
  }

  const publicEntry = { ...data } as Record<string, unknown>;
  delete publicEntry["_id"];
  return new TypeUZResponse("Rank retrieved", publicEntry as never);
}

function getDailyLeaderboardWithError(
  { language, mode, mode2, daysBefore }: DailyLeaderboardQuery,
  config: Configuration["dailyLeaderboards"],
): DailyLeaderboards.DailyLeaderboard {
  const customTimestamp =
    daysBefore === undefined
      ? -1
      : getCurrentDayTimestamp() - daysBefore * MILLISECONDS_IN_DAY;

  const dailyLeaderboard = DailyLeaderboards.getDailyLeaderboard(
    language,
    mode,
    mode2,
    config,
    customTimestamp,
  );
  if (!dailyLeaderboard) {
    throw new TypeUZError(404, "There is no daily leaderboard for this mode");
  }

  return dailyLeaderboard;
}

export async function getDailyLeaderboard(
  req: TypeUZRequest<GetDailyLeaderboardQuery>,
): Promise<GetDailyLeaderboardResponse> {
  const { page, pageSize, friendsOnly } = req.query;
  const { uid } = req.ctx.decodedToken;
  const connectionsConfig = req.ctx.configuration.connections;

  const friendUids = await getFriendsUids(
    uid,
    friendsOnly === true,
    connectionsConfig,
  );

  const dailyLeaderboard = getDailyLeaderboardWithError(
    req.query,
    req.ctx.configuration.dailyLeaderboards,
  );

  const results = await dailyLeaderboard.getResults(
    page,
    pageSize,
    req.ctx.configuration.dailyLeaderboards,
    req.ctx.configuration.users.premium.enabled,
    friendUids,
  );

  return new TypeUZResponse("Daily leaderboard retrieved", {
    entries: results?.entries ?? [],
    count: results?.count ?? 0,
    minWpm: results?.minWpm ?? 0,
    pageSize,
  });
}

export async function getDailyLeaderboardRank(
  req: TypeUZRequest<GetDailyLeaderboardRankQuery>,
): Promise<GetLeaderboardDailyRankResponse> {
  const { friendsOnly } = req.query;
  const { uid } = req.ctx.decodedToken;
  const connectionsConfig = req.ctx.configuration.connections;

  const friendUids = await getFriendsUids(
    uid,
    friendsOnly === true,
    connectionsConfig,
  );

  const dailyLeaderboard = getDailyLeaderboardWithError(
    req.query,
    req.ctx.configuration.dailyLeaderboards,
  );

  const rank = await dailyLeaderboard.getRank(
    uid,
    req.ctx.configuration.dailyLeaderboards,
    friendUids,
  );

  return new TypeUZResponse("Daily leaderboard rank retrieved", rank);
}

function getWeeklyXpLeaderboardWithError(
  config: Configuration["leaderboards"]["weeklyXp"],
  weeksBefore?: number,
): WeeklyXpLeaderboard.WeeklyXpLeaderboard {
  const customTimestamp =
    weeksBefore === undefined
      ? -1
      : getCurrentWeekTimestamp() - weeksBefore * MILLISECONDS_IN_DAY * 7;

  const weeklyXpLeaderboard = WeeklyXpLeaderboard.get(config, customTimestamp);
  if (!weeklyXpLeaderboard) {
    throw new TypeUZError(404, "XP leaderboard for this week not found.");
  }

  return weeklyXpLeaderboard;
}

export async function getWeeklyXpLeaderboard(
  req: TypeUZRequest<GetWeeklyXpLeaderboardQuery>,
): Promise<GetWeeklyXpLeaderboardResponse> {
  const { page, pageSize, weeksBefore, friendsOnly } = req.query;

  const { uid } = req.ctx.decodedToken;
  const connectionsConfig = req.ctx.configuration.connections;

  const friendUids = await getFriendsUids(
    uid,
    friendsOnly === true,
    connectionsConfig,
  );

  const weeklyXpLeaderboard = getWeeklyXpLeaderboardWithError(
    req.ctx.configuration.leaderboards.weeklyXp,
    weeksBefore,
  );
  const results = await weeklyXpLeaderboard.getResults(
    page,
    pageSize,
    req.ctx.configuration.leaderboards.weeklyXp,
    req.ctx.configuration.users.premium.enabled,
    friendUids,
  );

  return new TypeUZResponse("Weekly xp leaderboard retrieved", {
    entries: results?.entries ?? [],
    count: results?.count ?? 0,
    pageSize,
  });
}

export async function getWeeklyXpLeaderboardRank(
  req: TypeUZRequest<GetWeeklyXpLeaderboardRankQuery>,
): Promise<GetWeeklyXpLeaderboardRankResponse> {
  const { friendsOnly } = req.query;
  const { uid } = req.ctx.decodedToken;
  const connectionsConfig = req.ctx.configuration.connections;

  const friendUids = await getFriendsUids(
    uid,
    friendsOnly === true,
    connectionsConfig,
  );

  const weeklyXpLeaderboard = getWeeklyXpLeaderboardWithError(
    req.ctx.configuration.leaderboards.weeklyXp,
    req.query.weeksBefore,
  );
  const rankEntry = await weeklyXpLeaderboard.getRank(
    uid,
    req.ctx.configuration.leaderboards.weeklyXp,
    friendUids,
  );

  return new TypeUZResponse("Weekly xp leaderboard rank retrieved", rankEntry);
}

async function getFriendsUids(
  uid: string,
  friendsOnly: boolean,
  friendsConfig: Configuration["connections"],
): Promise<string[] | undefined> {
  if (uid !== "" && friendsOnly) {
    if (!friendsConfig.enabled) {
      throw new TypeUZError(503, "This feature is currently unavailable.");
    }
    return await ConnectionsDal.getFriendsUids(uid);
  }
  return undefined;
}

function getFriendsOnlyUid(
  uid: string,
  friendsOnly: boolean | undefined,
  friendsConfig: Configuration["connections"],
): string | undefined {
  if (uid !== "" && friendsOnly === true) {
    if (!friendsConfig.enabled) {
      throw new TypeUZError(503, "This feature is currently unavailable.");
    }
    return uid;
  }
  return undefined;
}
