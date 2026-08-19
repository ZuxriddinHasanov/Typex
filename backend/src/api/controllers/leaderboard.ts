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
  req: TypeUZRequest<GetLeaderboardQuery>,
): Promise<GetDailyLeaderboardResponse> {
  const { language, mode, mode2, page, pageSize, friendsOnly, numbers } = req.query;
  const { uid } = req.ctx.decodedToken;
  const connectionsConfig = req.ctx.configuration.connections;

  const friendsOnlyUid = getFriendsOnlyUid(uid, friendsOnly, connectionsConfig);

  const leaderboard = await LeaderboardsDAL.getPeriod(
    mode, mode2, language, page, pageSize,
    req.ctx.configuration.users.premium.enabled,
    friendsOnlyUid, numbers, 1
  );

  if (leaderboard === false) {
    throw new TypeUZError(503, "Leaderboard is currently updating.");
  }

  const count = await LeaderboardsDAL.getPeriodCount(mode, mode2, language, friendsOnlyUid, numbers, 1);
  const normalizedLeaderboard = leaderboard.map((entry) => {
    const publicEntry = { ...entry } as Record<string, unknown>;
    delete publicEntry["_id"];
    return publicEntry;
  }) as never[];

  return new TypeUZResponse("Daily leaderboard retrieved", {
    count, entries: normalizedLeaderboard, pageSize, minWpm: 0,
  } as any);
}

export async function getDailyLeaderboardRank(
  req: TypeUZRequest<GetLeaderboardRankQuery>,
): Promise<GetLeaderboardRankResponse> {
  const { language, mode, mode2, friendsOnly, numbers } = req.query;
  const { uid } = req.ctx.decodedToken;
  const connectionsConfig = req.ctx.configuration.connections;

  const data = await LeaderboardsDAL.getPeriodRank(
    mode, mode2, language, uid,
    getFriendsOnlyUid(uid, friendsOnly, connectionsConfig) !== undefined,
    numbers, 1
  );
  if (data === false) throw new TypeUZError(503, "Leaderboard is currently updating.");
  if (data === null) return new TypeUZResponse("Rank retrieved", null);

  const publicEntry = { ...data } as Record<string, unknown>;
  delete publicEntry["_id"];
  return new TypeUZResponse("Rank retrieved", publicEntry as never);
}

export async function getWeeklyLeaderboard(
  req: TypeUZRequest<GetLeaderboardQuery>,
): Promise<GetLeaderboardResponse> {
  const { language, mode, mode2, page, pageSize, friendsOnly, numbers } = req.query;
  const { uid } = req.ctx.decodedToken;
  const connectionsConfig = req.ctx.configuration.connections;

  const friendsOnlyUid = getFriendsOnlyUid(uid, friendsOnly, connectionsConfig);

  const leaderboard = await LeaderboardsDAL.getPeriod(
    mode, mode2, language, page, pageSize,
    req.ctx.configuration.users.premium.enabled,
    friendsOnlyUid, numbers, 7
  );

  if (leaderboard === false) {
    throw new TypeUZError(503, "Leaderboard is currently updating.");
  }

  const count = await LeaderboardsDAL.getPeriodCount(mode, mode2, language, friendsOnlyUid, numbers, 7);
  const normalizedLeaderboard = leaderboard.map((entry) => {
    const publicEntry = { ...entry } as Record<string, unknown>;
    delete publicEntry["_id"];
    return publicEntry;
  }) as never[];

  return new TypeUZResponse("Weekly leaderboard retrieved", {
    count, entries: normalizedLeaderboard, pageSize,
  });
}

export async function getWeeklyLeaderboardRank(
  req: TypeUZRequest<GetLeaderboardRankQuery>,
): Promise<GetLeaderboardRankResponse> {
  const { language, mode, mode2, friendsOnly, numbers } = req.query;
  const { uid } = req.ctx.decodedToken;
  const connectionsConfig = req.ctx.configuration.connections;

  const data = await LeaderboardsDAL.getPeriodRank(
    mode, mode2, language, uid,
    getFriendsOnlyUid(uid, friendsOnly, connectionsConfig) !== undefined,
    numbers, 7
  );
  if (data === false) throw new TypeUZError(503, "Leaderboard is currently updating.");
  if (data === null) return new TypeUZResponse("Rank retrieved", null);

  const publicEntry = { ...data } as Record<string, unknown>;
  delete publicEntry["_id"];
  return new TypeUZResponse("Rank retrieved", publicEntry as never);
}

export async function getMonthlyLeaderboard(
  req: TypeUZRequest<GetLeaderboardQuery>,
): Promise<GetLeaderboardResponse> {
  const { language, mode, mode2, page, pageSize, friendsOnly, numbers } = req.query;
  const { uid } = req.ctx.decodedToken;
  const connectionsConfig = req.ctx.configuration.connections;

  const friendsOnlyUid = getFriendsOnlyUid(uid, friendsOnly, connectionsConfig);

  const leaderboard = await LeaderboardsDAL.getPeriod(
    mode, mode2, language, page, pageSize,
    req.ctx.configuration.users.premium.enabled,
    friendsOnlyUid, numbers, 30
  );

  if (leaderboard === false) {
    throw new TypeUZError(503, "Leaderboard is currently updating.");
  }

  const count = await LeaderboardsDAL.getPeriodCount(mode, mode2, language, friendsOnlyUid, numbers, 30);
  const normalizedLeaderboard = leaderboard.map((entry) => {
    const publicEntry = { ...entry } as Record<string, unknown>;
    delete publicEntry["_id"];
    return publicEntry;
  }) as never[];

  return new TypeUZResponse("Monthly leaderboard retrieved", {
    count, entries: normalizedLeaderboard, pageSize,
  });
}

export async function getMonthlyLeaderboardRank(
  req: TypeUZRequest<GetLeaderboardRankQuery>,
): Promise<GetLeaderboardRankResponse> {
  const { language, mode, mode2, friendsOnly, numbers } = req.query;
  const { uid } = req.ctx.decodedToken;
  const connectionsConfig = req.ctx.configuration.connections;

  const data = await LeaderboardsDAL.getPeriodRank(
    mode, mode2, language, uid,
    getFriendsOnlyUid(uid, friendsOnly, connectionsConfig) !== undefined,
    numbers, 30
  );
  if (data === false) throw new TypeUZError(503, "Leaderboard is currently updating.");
  if (data === null) return new TypeUZResponse("Rank retrieved", null);

  const publicEntry = { ...data } as Record<string, unknown>;
  delete publicEntry["_id"];
  return new TypeUZResponse("Rank retrieved", publicEntry as never);
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

import * as db from "../../init/db";

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

  let results: { entries: any[]; count: number } | null = null;
  try {
    const weeklyXpLeaderboard = getWeeklyXpLeaderboardWithError(
      req.ctx.configuration.leaderboards.weeklyXp,
      weeksBefore,
    );
    results = await weeklyXpLeaderboard.getResults(
      page,
      pageSize,
      req.ctx.configuration.leaderboards.weeklyXp,
      req.ctx.configuration.users.premium.enabled,
      friendUids,
    );
  } catch {
    // Redis might be unavailable
  }

  // Fallback to PostgreSQL users table for XP
  if (!results || results.entries.length === 0) {
    const limit = pageSize;
    const offset = page * pageSize;
    let queryArgs: any[] = [limit, offset];
    let countQuery = "SELECT COUNT(*)::int AS count FROM users WHERE xp > 0";
    let dataQuery = `SELECT uid, name, xp AS "totalXp", 0 AS "timeTypedSeconds",
                     ROW_NUMBER() OVER (ORDER BY xp DESC)::int AS rank
                     FROM users WHERE xp > 0`;

    if (friendUids && friendUids.length > 0) {
      const allUids = [...friendUids, uid];
      queryArgs.push(allUids);
      countQuery += " AND uid = ANY($3::text[])";
      dataQuery += " AND uid = ANY($3::text[])";
    }

    dataQuery += " ORDER BY xp DESC LIMIT $1 OFFSET $2";

    const countRes = await db.queryOne<{ count: number }>(countQuery, queryArgs.slice(2));
    const dataRes = await db.queryAll<any>(dataQuery, queryArgs);

    results = {
      entries: dataRes,
      count: countRes?.count ?? 0,
    };
  }

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

  let rankEntry: any = null;
  try {
    const weeklyXpLeaderboard = getWeeklyXpLeaderboardWithError(
      req.ctx.configuration.leaderboards.weeklyXp,
      req.query.weeksBefore,
    );
    rankEntry = await weeklyXpLeaderboard.getRank(
      uid,
      req.ctx.configuration.leaderboards.weeklyXp,
      friendUids,
    );
  } catch {
    // Ignore Redis errors
  }

  if (!rankEntry) {
    let rankQuery = `SELECT uid, name, xp AS "totalXp", 0 AS "timeTypedSeconds",
                     (SELECT COUNT(*)+1 FROM users u2 WHERE u2.xp > u1.xp) AS rank
                     FROM users u1 WHERE uid = $1`;
    let args = [uid];
    if (friendUids && friendUids.length > 0) {
      const allUids = [...friendUids, uid];
      rankQuery = `SELECT uid, name, xp AS "totalXp", 0 AS "timeTypedSeconds",
                   (SELECT COUNT(*)+1 FROM users u2 WHERE u2.xp > u1.xp AND u2.uid = ANY($2::text[])) AS "friendsRank"
                   FROM users u1 WHERE uid = $1 AND uid = ANY($2::text[])`;
      args.push(allUids as any);
    }
    const row = await db.queryOne<any>(rankQuery, args);
    if (row && row.totalXp > 0) {
      rankEntry = row;
    }
  }

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
