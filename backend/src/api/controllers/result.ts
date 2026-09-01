import * as ResultDAL from "../../dal/result";
import * as PublicDAL from "../../dal/public";
import * as LeaderboardsDAL from "../../dal/leaderboards";
import {
  isDevEnvironment,
  omit,
  replaceObjectId,
  replaceObjectIds,
} from "../../utils/misc";
import objectHash from "object-hash";
import Logger from "../../utils/logger";
import "dotenv/config";
import { TypeUZResponse } from "../../utils/typeuz-response";
import TypeUZError from "../../utils/error";
import { isTestTooShort } from "../../utils/validation";
import {
  implemented as anticheatImplemented,
  validateResult,
  validateKeys,
} from "../../anticheat/index";
import MonkeyStatusCodes from "../../constants/monkey-status-codes";
import {
  incrementResult,
  incrementDailyLeaderboard,
} from "../../utils/prometheus";
import GeorgeQueue from "../../queues/george-queue";
import { getDailyLeaderboard } from "../../utils/daily-leaderboards";
import * as UserDAL from "../../dal/user";
import { buildMonkeyMail } from "../../utils/monkey-mail";
import * as WeeklyXpLeaderboard from "../../services/weekly-xp-leaderboard";
import { UAParser } from "ua-parser-js";
import { canFunboxGetPb } from "../../utils/pb";
import { buildDbResult } from "../../utils/result";
import { Configuration } from "@typeuz/schemas/configuration";
import { addImportantLog, addLog } from "../../dal/logs";
import {
  AddResultRequest,
  AddResultResponse,
  GetLastResultResponse,
  GetResultByIdPath,
  GetResultByIdResponse,
  GetResultsQuery,
  GetResultsResponse,
  UpdateResultTagsRequest,
  UpdateResultTagsResponse,
} from "@typeuz/contracts/results";
import {
  CompletedEvent,
  KeyStats,
  PostResultResponse,
  XpBreakdown,
} from "@typeuz/schemas/results";
import { isSafeNumber, mapRange, roundTo2, stdDev } from "@typeuz/util/numbers";
import {
  getCurrentDayTimestamp,
  getStartOfDayTimestamp,
} from "@typeuz/util/date-and-time";
import { TypeUZRequest } from "../types";
import { getFunbox, checkCompatibility } from "@typeuz/funbox";
import { tryCatch } from "@typeuz/util/trycatch";
import { getChallenges } from "@typeuz/challenges";
import type { DBUser } from "../../dal/user";

try {
  if (!anticheatImplemented()) throw new Error("undefined");
  Logger.success("Anticheat module loaded");
} catch (e) {
  Logger.warning(
    "No anticheat module found. Continuing without anticheat validation.",
  );
}

const autoRoleChallengeNames = new Set(
  getChallenges()
    .filter((it) => it.settings?.autoRole)
    .map((it) => it.name),
);

export async function getResults(
  req: TypeUZRequest<GetResultsQuery>,
): Promise<GetResultsResponse> {
  const { uid } = req.ctx.decodedToken;
  const premiumFeaturesEnabled = req.ctx.configuration.users.premium.enabled;
  const { onOrAfterTimestamp = NaN, offset = 0 } = req.query;
  const userHasPremium = await UserDAL.checkIfUserIsPremium(uid);

  const maxLimit =
    premiumFeaturesEnabled && userHasPremium
      ? req.ctx.configuration.results.limits.premiumUser
      : req.ctx.configuration.results.limits.regularUser;

  let limit =
    req.query.limit ??
    Math.min(req.ctx.configuration.results.maxBatchSize, maxLimit);

  //check if premium features are disabled and current call exceeds the limit for regular users
  if (
    userHasPremium &&
    !premiumFeaturesEnabled &&
    limit + offset > req.ctx.configuration.results.limits.regularUser
  ) {
    throw new TypeUZError(503, "Premium feature disabled.");
  }

  if (limit + offset > maxLimit) {
    if (offset < maxLimit) {
      //batch is partly in the allowed ranged. Set the limit to the max allowed and return partly results.
      limit = maxLimit - offset;
    } else {
      throw new TypeUZError(422, `Max results limit of ${maxLimit} exceeded.`);
    }
  }

  const results = await ResultDAL.getResults(uid, {
    onOrAfterTimestamp,
    limit,
    offset,
  });
  void addLog(
    "user_results_requested",
    {
      limit,
      offset,
      onOrAfterTimestamp,
      isPremium: userHasPremium,
    },
    uid,
  );

  return new TypeUZResponse("Results retrieved", replaceObjectIds(results));
}

export async function getResultById(
  req: TypeUZRequest<undefined, undefined, GetResultByIdPath>,
): Promise<GetResultByIdResponse> {
  const { uid } = req.ctx.decodedToken;
  const { resultId } = req.params;

  const result = await ResultDAL.getResult(uid, resultId);
  return new TypeUZResponse("Result retrieved", replaceObjectId(result));
}

export async function getLastResult(
  req: TypeUZRequest,
): Promise<GetLastResultResponse> {
  const { uid } = req.ctx.decodedToken;
  const result = await ResultDAL.getLastResult(uid);
  return new TypeUZResponse("Result retrieved", replaceObjectId(result));
}

export async function deleteAll(req: TypeUZRequest): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;

  await ResultDAL.deleteAll(uid);
  void addLog("user_results_deleted", "", uid);
  return new TypeUZResponse("All results deleted", null);
}

export async function updateTags(
  req: TypeUZRequest<undefined, UpdateResultTagsRequest>,
): Promise<UpdateResultTagsResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagIds, resultId } = req.body;

  if (uid.startsWith("guest_")) {
    throw new TypeUZError(403, "Guests cannot update tags");
  }

  await ResultDAL.updateTags(uid, resultId, tagIds);
  const result = await ResultDAL.getResult(uid, resultId);

  result.difficulty ??= "normal";
  result.language ??= "english";
  result.funbox ??= [];
  result.lazyMode ??= false;
  result.punctuation ??= false;
  result.numbers ??= false;

  const user = await UserDAL.getPartialUser(uid, "update tags", ["tags"]);
  const tagPbs = await UserDAL.checkIfTagPb(uid, user, result);
  return new TypeUZResponse("Result tags updated", {
    tagPbs,
  });
}

export async function addResult(
  req: TypeUZRequest<undefined, AddResultRequest>,
): Promise<AddResultResponse> {
  const { uid } = req.ctx.decodedToken;

  let user: DBUser;
  if (uid === "" || uid.startsWith("guest_")) {
    const guestUid = uid === "" ? "guest_user" : uid;
    const rawGuestName = uid.startsWith("guest_")
      ? uid.replace("guest_", "").split("_")[0]
      : "Mehmon";
    const guestName = `${rawGuestName} (Mehmon)`;

    try {
      user = await UserDAL.getUser(guestUid, "add result");
    } catch (e) {
      await UserDAL.addUser(
        guestName,
        `${guestUid}@typex.uz`,
        guestUid,
        undefined,
        undefined,
        `https://api.dicebear.com/7.x/bottts/svg?seed=${rawGuestName}`,
      );
      user = await UserDAL.getUser(guestUid, "add result");
    }
    user.timeTyping = 999999; // enough time to be on leaderboard
  } else {
    user = await UserDAL.getUser(uid, "add result");

    if (user.needsToChangeName) {
      throw new TypeUZError(
        403,
        "Please change your name before submitting a result",
      );
    }
  }

  const completedEvent = req.body.result;
  completedEvent.uid = user.uid;

  if (
    isTestTooShort(
      completedEvent,
      req.ctx.decodedToken?.uid?.startsWith("guest_") ?? true,
    )
  ) {
    const status = MonkeyStatusCodes.TEST_TOO_SHORT;
    throw new TypeUZError(status.code, status.message);
  }

  if (user.lbOptOut !== true && completedEvent.acc < 75) {
    throw new TypeUZError(400, "Accuracy too low");
  }

  const resulthash = completedEvent.hash;
  if (req.ctx.configuration.results.objectHashCheckEnabled) {
    const objectToHash = omit(completedEvent, ["hash"]);
    const serverhash = objectHash(objectToHash);
    if (serverhash !== resulthash) {
      void addLog(
        "incorrect_result_hash",
        {
          serverhash,
          resulthash,
          result: completedEvent,
        },
        uid,
      );
      const status = MonkeyStatusCodes.RESULT_HASH_INVALID;
      throw new TypeUZError(status.code, "Incorrect result hash");
    }
  } else {
    Logger.warning("Object hash check is disabled, skipping hash check");
  }

  if (completedEvent.funbox.length !== new Set(completedEvent.funbox).size) {
    throw new TypeUZError(400, "Duplicate funboxes");
  }

  if (!checkCompatibility(completedEvent.funbox)) {
    throw new TypeUZError(400, "Impossible funbox combination");
  }

  let keySpacingStats: KeyStats | undefined = undefined;
  if (
    completedEvent.keySpacing !== "toolong" &&
    completedEvent.keySpacing.length > 0
  ) {
    keySpacingStats = {
      average:
        completedEvent.keySpacing.reduce(
          (previous, current) => (current += previous),
        ) / completedEvent.keySpacing.length,
      sd: stdDev(completedEvent.keySpacing),
    };
  }

  let keyDurationStats: KeyStats | undefined = undefined;
  if (
    completedEvent.keyDuration !== "toolong" &&
    completedEvent.keyDuration.length > 0
  ) {
    keyDurationStats = {
      average:
        completedEvent.keyDuration.reduce(
          (previous, current) => (current += previous),
        ) / completedEvent.keyDuration.length,
      sd: stdDev(completedEvent.keyDuration),
    };
  }

  if (user.suspicious && completedEvent.testDuration <= 120) {
    await addImportantLog("suspicious_user_result", completedEvent, uid);
  }

  if (
    completedEvent.mode === "time" &&
    (completedEvent.mode2 === "60" || completedEvent.mode2 === "15") &&
    completedEvent.wpm > 250 &&
    user.lbOptOut !== true
  ) {
    await addImportantLog("highwpm_user_result", completedEvent, uid);
  }

  if (anticheatImplemented() && process.env["BYPASS_ANTICHEAT"] !== "true") {
    if (
      !validateResult(
        completedEvent,
        ((req.raw.headers["x-client-version"] as string) ||
          req.raw.headers["client-version"]) as string,
        JSON.stringify(new UAParser(req.raw.headers["user-agent"]).getResult()),
        user.lbOptOut === true,
      )
    ) {
      const status = MonkeyStatusCodes.RESULT_DATA_INVALID;
      throw new TypeUZError(status.code, "Result data doesn't make sense");
    } else if (isDevEnvironment()) {
      Logger.success("Result data validated");
    }
  }

  //dont use - result timestamp is unreliable, can be changed by system time and stuff
  // if (result.timestamp > Math.round(Date.now() / 1000) * 1000 + 10) {
  //   log(
  //     "time_traveler",
  //     {
  //       resultTimestamp: result.timestamp,
  //       serverTimestamp: Math.round(Date.now() / 1000) * 1000 + 10,
  //     },
  //     uid
  //   );
  //   return res.status(400).json({ message: "Time traveler detected" });

  const { data: lastResultTimestamp } = await tryCatch(
    ResultDAL.getLastResultTimestamp(uid),
  );

  //convert result test duration to miliseconds
  completedEvent.timestamp = Math.floor(Date.now() / 1000) * 1000;

  //check if now is earlier than last result plus duration (-1 second as a buffer)
  const testDurationMilis = completedEvent.testDuration * 1000;
  const incompleteTestsMilis = completedEvent.incompleteTestSeconds * 1000;
  const earliestPossible =
    (lastResultTimestamp ?? 0) + testDurationMilis + incompleteTestsMilis;
  const nowNoMilis = Math.floor(Date.now() / 1000) * 1000;
  if (
    isSafeNumber(lastResultTimestamp) &&
    nowNoMilis < earliestPossible - 1000
  ) {
    void addLog(
      "invalid_result_spacing",
      {
        lastTimestamp: lastResultTimestamp,
        earliestPossible,
        now: nowNoMilis,
        testDuration: testDurationMilis,
        difference: nowNoMilis - earliestPossible,
      },
      uid,
    );
    const status = MonkeyStatusCodes.RESULT_SPACING_INVALID;
    throw new TypeUZError(status.code, "Invalid result spacing");
  }

  //check keyspacing and duration here for bots
  if (
    completedEvent.mode === "time" &&
    completedEvent.wpm > 130 &&
    completedEvent.testDuration < 122 &&
    (user.verified === false || user.verified === undefined) &&
    user.lbOptOut !== true
  ) {
    if (!keySpacingStats || !keyDurationStats) {
      const status = MonkeyStatusCodes.MISSING_KEY_DATA;
      throw new TypeUZError(status.code, "Missing key data");
    }
    if (completedEvent.keyOverlap === undefined) {
      throw new TypeUZError(400, "Old key data format");
    }
    if (anticheatImplemented() && process.env["BYPASS_ANTICHEAT"] !== "true") {
      if (
        !validateKeys(completedEvent, keySpacingStats, keyDurationStats, uid)
      ) {
        //autoban
        const autoBanConfig = req.ctx.configuration.users.autoBan;
        if (autoBanConfig.enabled) {
          const didUserGetBanned = await UserDAL.recordAutoBanEvent(
            uid,
            autoBanConfig.maxCount,
            autoBanConfig.maxHours,
          );
          if (didUserGetBanned) {
            const mail = buildMonkeyMail({
              subject: "Banned",
              body: "Your account has been automatically banned for triggering the anticheat system. If you believe this is a mistake, please contact support.",
            });
            await UserDAL.addToInbox(
              uid,
              [mail],
              req.ctx.configuration.users.inbox,
            );
            user.banned = true;
          }
        }
        const status = MonkeyStatusCodes.BOT_DETECTED;
        throw new TypeUZError(status.code, "Possible bot detected");
      }
    }
  }

  if (req.ctx.configuration.users.lastHashesCheck.enabled) {
    let lastHashes = user.lastResultHashes ?? [];
    if (lastHashes.includes(resulthash)) {
      void addLog(
        "duplicate_result",
        {
          lastHashes,
          resulthash,
          result: completedEvent,
        },
        uid,
      );
      const status = MonkeyStatusCodes.DUPLICATE_RESULT;
      throw new TypeUZError(status.code, "Duplicate result");
    } else {
      lastHashes.unshift(resulthash);
      const maxHashes = req.ctx.configuration.users.lastHashesCheck.maxHashes;
      if (lastHashes.length > maxHashes) {
        lastHashes = lastHashes.slice(0, maxHashes);
      }
      await UserDAL.updateLastHashes(uid, lastHashes);
    }
  }

  if (keyDurationStats) {
    keyDurationStats.average = roundTo2(keyDurationStats.average);
    keyDurationStats.sd = roundTo2(keyDurationStats.sd);
  }
  if (keySpacingStats) {
    keySpacingStats.average = roundTo2(keySpacingStats.average);
    keySpacingStats.sd = roundTo2(keySpacingStats.sd);
  }

  let isPb = false;
  let tagPbs: string[] = [];

  if (!completedEvent.bailedOut && completedEvent.testDuration >= 10) {
    [isPb, tagPbs] = await Promise.all([
      UserDAL.checkIfPb(uid, user, completedEvent),
      UserDAL.checkIfTagPb(uid, user, completedEvent),
    ]);
  }

  if (completedEvent.mode === "time" && completedEvent.mode2 === "60") {
    void UserDAL.incrementBananas(uid, completedEvent.wpm);
    if (
      isPb &&
      user.discordId !== undefined &&
      user.discordId !== "" &&
      user.lbOptOut !== true
    ) {
      void GeorgeQueue.updateDiscordRole(user.discordId, completedEvent.wpm);
    }
  }

  if (
    completedEvent.challenge !== null &&
    completedEvent.challenge !== undefined &&
    autoRoleChallengeNames.has(completedEvent.challenge) &&
    user.discordId !== undefined &&
    user.discordId !== ""
  ) {
    void GeorgeQueue.awardChallenge(user.discordId, completedEvent.challenge);
  } else {
    delete completedEvent.challenge;
  }

  const afk = completedEvent.afkDuration ?? 0;
  const totalDurationTypedSeconds =
    completedEvent.testDuration + completedEvent.incompleteTestSeconds - afk;
  void UserDAL.updateTypingStats(
    uid,
    completedEvent.restartCount,
    totalDurationTypedSeconds,
  );
  void PublicDAL.updateStats(
    completedEvent.restartCount,
    totalDurationTypedSeconds,
  );

  const dailyLeaderboardsConfig = req.ctx.configuration.dailyLeaderboards;
  const dailyLeaderboard = getDailyLeaderboard(
    completedEvent.language,
    completedEvent.mode,
    completedEvent.mode2,
    dailyLeaderboardsConfig,
  );

  let dailyLeaderboardRank = -1;

  const stopOnLetterTriggered =
    completedEvent.stopOnLetter && completedEvent.acc < 100;

  const userEligibleForLeaderboard =
    user.banned !== true && user.lbOptOut !== true;

  const validResultCriteria =
    canFunboxGetPb(completedEvent) &&
    !completedEvent.bailedOut &&
    userEligibleForLeaderboard &&
    completedEvent.testDuration >= 10 &&
    !stopOnLetterTriggered;

  const selectedBadgeId = user.inventory?.badges?.find((b) => b.selected)?.id;
  const isPremium =
    (await UserDAL.checkIfUserIsPremium(user.uid, user)) || undefined;

  if (dailyLeaderboard && validResultCriteria) {
    incrementDailyLeaderboard(
      completedEvent.mode,
      completedEvent.mode2,
      completedEvent.language,
    );
    dailyLeaderboardRank = await dailyLeaderboard.addResult(
      {
        name: user.name,
        wpm: completedEvent.wpm,
        raw: completedEvent.rawWpm,
        acc: completedEvent.acc,
        consistency: completedEvent.consistency,
        timestamp: completedEvent.timestamp,
        uid,
        discordAvatar: user.discordAvatar,
        discordId: user.discordId,
        badgeId: selectedBadgeId,
        isPremium,
      },
      dailyLeaderboardsConfig,
    );
    if (
      dailyLeaderboardRank >= 1 &&
      dailyLeaderboardRank <= 10 &&
      completedEvent.testDuration <= 120
    ) {
      const now = Date.now();
      const reset = getCurrentDayTimestamp();
      const limit = 6 * 60 * 60 * 1000;
      if (now - reset >= limit) {
        await addLog("daily_leaderboard_top_10_result", completedEvent, uid);
      }
    }
  }

  const streak = await UserDAL.updateStreak(uid, completedEvent.timestamp);
  const badgeWaitingInInbox = (
    user.inbox?.flatMap((i) =>
      (i.rewards ?? []).map((r) => (r.type === "badge" ? r.item.id : null)),
    ) ?? []
  ).includes(14);

  const shouldGetBadge =
    streak >= 365 &&
    user.inventory?.badges?.find((b) => b.id === 14) === undefined &&
    !badgeWaitingInInbox;

  if (shouldGetBadge) {
    const mail = buildMonkeyMail({
      subject: "Badge",
      body: "Congratulations for reaching a 365 day streak! You have been awarded a special badge. Now, go touch some grass.",
      rewards: [
        {
          type: "badge",
          item: {
            id: 14,
          },
        },
      ],
    });
    await UserDAL.addToInbox(uid, [mail], req.ctx.configuration.users.inbox);
  }

  const xpGained = await calculateXp(
    completedEvent,
    req.ctx.configuration.users.xp,
    lastResultTimestamp,
    user.xp ?? 0,
    streak,
  );

  if (isNaN(xpGained.xp)) {
    throw new TypeUZError(
      500,
      "Calculated XP is NaN",
      JSON.stringify({
        xpGained,
        result: completedEvent,
      }),
      uid,
    );
  }

  if (xpGained.xp < 0) {
    throw new TypeUZError(
      500,
      "Calculated XP is negative",
      JSON.stringify({
        xpGained,
        result: completedEvent,
      }),
      uid,
    );
  }

  const weeklyXpLeaderboardConfig = req.ctx.configuration.leaderboards.weeklyXp;
  let weeklyXpLeaderboardRank = -1;

  const weeklyXpLeaderboard = WeeklyXpLeaderboard.get(
    weeklyXpLeaderboardConfig,
  );
  if (userEligibleForLeaderboard && xpGained.xp > 0 && weeklyXpLeaderboard) {
    weeklyXpLeaderboardRank = await weeklyXpLeaderboard.addResult(
      weeklyXpLeaderboardConfig,
      {
        entry: {
          uid,
          name: user.name,
          discordAvatar: user.discordAvatar,
          discordId: user.discordId,
          badgeId: selectedBadgeId,
          lastActivityTimestamp: Date.now(),
          isPremium,
          timeTypedSeconds: totalDurationTypedSeconds,
        },
        xpGained: xpGained.xp,
      },
    );
  }

  const dbresult = buildDbResult(completedEvent, user.name, isPb);
  dbresult.uid = user.uid || uid;
  if (keySpacingStats !== undefined) {
    dbresult.keySpacingStats = keySpacingStats;
  }
  if (keyDurationStats !== undefined) {
    dbresult.keyDurationStats = keyDurationStats;
  }

  let addedResult: { insertedId: string } = { insertedId: "guest_result" };
  addedResult = await ResultDAL.addResult(uid, dbresult);

  await UserDAL.incrementXp(uid, xpGained.xp);
  await UserDAL.incrementTestActivity(user, completedEvent.timestamp);

  void LeaderboardsDAL.update(
    completedEvent.mode,
    completedEvent.mode2,
    completedEvent.language,
    completedEvent.numbers,
  ).catch((err: unknown) => {
    Logger.error(`Failed to update leaderboard: ${String(err)}`);
  });

  if (isPb) {
    void addLog(
      "user_new_pb",
      `${`${completedEvent.mode} ${completedEvent.mode2}`} ${
        completedEvent.wpm
      } ${completedEvent.acc}% ${completedEvent.rawWpm} ${
        completedEvent.consistency
      }% (${addedResult.insertedId})`,
      uid,
    );
  }

  const data: PostResultResponse = {
    isPb,
    tagPbs,
    insertedId: addedResult.insertedId,
    xp: xpGained.xp,
    dailyXpBonus: xpGained.dailyBonus ?? false,
    xpBreakdown: xpGained.breakdown ?? {},
    streak,
  };

  if (dailyLeaderboardRank !== -1) {
    data.dailyLeaderboardRank = dailyLeaderboardRank;
  }

  if (weeklyXpLeaderboardRank !== -1) {
    data.weeklyXpLeaderboardRank = weeklyXpLeaderboardRank;
  }

  incrementResult(completedEvent, dbresult.isPb);

  return new TypeUZResponse("Result saved", data);
}

type XpResult = {
  xp: number;
  dailyBonus?: boolean;
  breakdown?: XpBreakdown;
};

async function calculateXp(
  result: CompletedEvent,
  xpConfiguration: Configuration["users"]["xp"],
  lastResultTimestamp: number | null,
  currentTotalXp: number,
  streak: number,
): Promise<XpResult> {
  const {
    mode,
    acc,
    testDuration,
    incompleteTestSeconds,
    incompleteTests,
    afkDuration,
    charStats,
    punctuation,
    numbers,
    funbox: resultFunboxes,
  } = result;

  const {
    enabled,
    gainMultiplier,
    maxDailyBonus,
    minDailyBonus,
    funboxBonus: funboxBonusConfiguration,
  } = xpConfiguration;

  if (mode === "zen" || !enabled) {
    return {
      xp: 0,
    };
  }

  const breakdown: XpBreakdown = {};

  const baseXp = Math.round((testDuration - afkDuration) * 2);
  breakdown.base = baseXp;

  let modifier = 1;

  const correctedEverything = charStats
    .slice(1)
    .every((charStat: number) => charStat === 0);

  if (acc === 100) {
    modifier += 0.5;
    breakdown.fullAccuracy = Math.round(baseXp * 0.5);
  } else if (correctedEverything) {
    // corrected everything bonus
    modifier += 0.25;
    breakdown.corrected = Math.round(baseXp * 0.25);
  }

  if (mode === "quote") {
    // real sentences bonus
    modifier += 0.5;
    breakdown.quote = Math.round(baseXp * 0.5);
  } else {
    // punctuation bonus
    if (punctuation) {
      modifier += 0.4;
      breakdown.punctuation = Math.round(baseXp * 0.4);
    }
    if (numbers) {
      modifier += 0.1;
      breakdown.numbers = Math.round(baseXp * 0.1);
    }
  }

  if (funboxBonusConfiguration > 0 && resultFunboxes.length !== 0) {
    const funboxModifier = resultFunboxes.reduce((sum, funboxName) => {
      const funbox = getFunbox(funboxName);
      const difficultyLevel = funbox?.difficultyLevel ?? 0;
      return sum + Math.max(difficultyLevel * funboxBonusConfiguration, 0);
    }, 0);

    if (funboxModifier > 0) {
      modifier += funboxModifier;
      breakdown.funbox = Math.round(baseXp * funboxModifier);
    }
  }

  if (xpConfiguration.streak.enabled) {
    const streakModifier = parseFloat(
      mapRange(
        streak,
        0,
        xpConfiguration.streak.maxStreakDays,
        0,
        xpConfiguration.streak.maxStreakMultiplier,
        true,
      ).toFixed(1),
    );

    if (streakModifier > 0) {
      modifier += streakModifier;
      breakdown.streak = Math.round(baseXp * streakModifier);
    }
  }

  let incompleteXp = 0;
  if (incompleteTests !== undefined && incompleteTests.length > 0) {
    incompleteTests.forEach((it: { acc: number; seconds: number }) => {
      let mod = (it.acc - 50) / 50;
      if (mod < 0) mod = 0;
      incompleteXp += Math.round(it.seconds * mod);
    });
    breakdown.incomplete = incompleteXp;
  } else if (incompleteTestSeconds && incompleteTestSeconds > 0) {
    incompleteXp = Math.round(incompleteTestSeconds);
    breakdown.incomplete = incompleteXp;
  }

  const accuracyModifier = (acc - 50) / 50;

  let dailyBonus = 0;
  if (isSafeNumber(lastResultTimestamp)) {
    const lastResultDay = getStartOfDayTimestamp(lastResultTimestamp);
    const today = getCurrentDayTimestamp();
    if (lastResultDay !== today) {
      const proportionalXp = Math.round(currentTotalXp * 0.05);
      dailyBonus = Math.max(
        Math.min(maxDailyBonus, proportionalXp),
        minDailyBonus,
      );
      breakdown.daily = dailyBonus;
    }
  }

  const xpWithModifiers = Math.round(baseXp * modifier);

  const xpAfterAccuracy = Math.round(xpWithModifiers * accuracyModifier);
  breakdown.accPenalty = xpWithModifiers - xpAfterAccuracy;

  const totalXp =
    Math.round((xpAfterAccuracy + incompleteXp) * gainMultiplier) + dailyBonus;

  if (gainMultiplier !== 1) {
    // breakdown.push([
    //   "configMultiplier",
    //   Math.round((xpAfterAccuracy + incompleteXp) * (gainMultiplier - 1)),
    // ]);
    breakdown.configMultiplier = gainMultiplier;
  }

  const isAwardingDailyBonus = dailyBonus > 0;

  return {
    xp: totalXp,
    dailyBonus: isAwardingDailyBonus,
    breakdown,
  };
}
