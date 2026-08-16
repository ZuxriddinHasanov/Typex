import { canFunboxGetPb, checkAndUpdatePb, LbPersonalBests } from "../utils/pb";
import * as db from "../init/db";
import TypeUZError from "../utils/error";
import { devGet as devGetUser, devSet } from "../utils/dev-store";
import { getCachedConfiguration } from "../init/configuration";
import { getDayOfYear } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import {
  AllRewards,
  Badge,
  MonkeyMail,
  Gender,
  UserInventory,
  UserProfileDetails,
  UserQuoteRatings,
  ResultFilters,
  User,
  Friend,
} from "@typeuz/schemas/users";
import { Mode, PersonalBest, PersonalBests } from "@typeuz/schemas/shared";
import { addImportantLog } from "./logs";
import { Result as ResultType } from "@typeuz/schemas/results";
import { Configuration } from "@typeuz/schemas/configuration";
import { isToday, isYesterday } from "@typeuz/util/date-and-time";
import { getFriendsUids } from "./connections";

export type DBUserTag = {
  _id: string;
  name: string;
  personalBests: PersonalBests;
};

export type DBUser = Omit<
  User,
  | "resultFilterPresets"
  | "tags"
  | "customThemes"
  | "isPremium"
  | "allTimeLbs"
  | "testActivity"
> & {
  resultFilterPresets?: ResultFilters[];
  tags?: DBUserTag[];
  lbPersonalBests?: LbPersonalBests;
  customThemes?: { _id: string; name: string; colors: string[] }[];
  autoBanTimestamps?: number[];
  inbox?: MonkeyMail[];
  ips?: string[];
  canReport?: boolean;
  nameHistory?: string[];
  lastNameChange?: number;
  canManageApeKeys?: boolean;
  bananas?: number;
  testActivity?: Record<string, (number | null)[]>;
  aiUses?: { date: string; count: number };
  suspicious?: boolean;
  note?: string;
  lastLoginAt?: number;
};

const SECONDS_PER_HOUR = 3600;

type Result = Omit<ResultType<Mode>, "_id" | "name">;

export type DBFriend = Friend;

function userRowToDBUser(row: Record<string, unknown>): DBUser {
  const parseJson = (val: unknown): unknown => {
    if (typeof val === "string") return JSON.parse(val);
    if (val !== null && typeof val === "object") return val;
    return undefined;
  };

  const tags = parseJson(row["tags"]) as DBUserTag[] | undefined;
  const customThemes = parseJson(row["custom_themes"]) as
    | { _id: string; name: string; colors: string[] }[]
    | undefined;
  const resultFilterPresets = parseJson(row["result_filter_presets"]) as
    | ResultFilters[]
    | undefined;
  const testActivity = parseJson(row["test_activity"]) as
    | Record<string, (number | null)[]>
    | undefined;
  const inbox = parseJson(row["inbox"]) as MonkeyMail[] | undefined;
  const ips = parseJson(row["ips"]) as string[] | undefined;
  const nameHistory = parseJson(row["name_history"]) as string[] | undefined;
  const autoBanTimestamps = parseJson(row["auto_ban_timestamps"]) as
    | number[]
    | undefined;
  const favoriteQuotes = parseJson(row["favorite_quotes"]) as
    | Record<string, string[]>
    | undefined;

  const r = row;
  return {
    uid: r["uid"] as string,
    name: r["name"] as string,
    firstName: r["first_name"] as string | undefined,
    lastName: r["last_name"] as string | undefined,
    email: r["email"] as string,
    addedAt: r["added_at"] as number,
    gender: r["gender"] as Gender | undefined,
    age: r["age"] as number | undefined,
    avatar: r["avatar"] as string | undefined,
    personalBests: (parseJson(r["personal_bests"]) as
      | PersonalBests
      | undefined) ?? {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
      ai: {},
    },
    lbPersonalBests: (parseJson(r["lb_personal_bests"]) as
      | LbPersonalBests
      | undefined) ?? { time: {} },
    lastResultHashes: parseJson(r["last_result_hashes"]) as
      | string[]
      | undefined,
    completedTests: (r["completed_tests"] as number) ?? 0,
    startedTests: (r["started_tests"] as number) ?? 0,
    timeTyping: (r["time_typing"] as number) ?? 0,
    streak: parseJson(r["streak"]) as
      | {
          lastResultTimestamp: number;
          length: number;
          maxLength: number;
          hourOffset?: number;
        }
      | undefined,
    xp: (r["xp"] as number) ?? 0,
    discordId: r["discord_id"] as string | undefined,
    discordAvatar: r["discord_avatar"] as string | undefined,
    tags,
    profileDetails: parseJson(r["profile_details"]) as
      | UserProfileDetails
      | undefined,
    customThemes,
    premium: parseJson(r["premium"]) as
      | { startTimestamp: number; expirationTimestamp: number }
      | undefined,
    quoteRatings: parseJson(r["quote_ratings"]) as UserQuoteRatings | undefined,
    favoriteQuotes,
    lbMemory: parseJson(r["lb_memory"]) as Record<string, unknown> | undefined,
    inventory: parseJson(r["inventory"]) as UserInventory | undefined,
    banned: (r["banned"] as boolean) ?? false,
    lbOptOut: (r["lb_opt_out"] as boolean) ?? false,
    verified: (r["verified"] as boolean) ?? false,
    needsToChangeName: (r["needs_to_change_name"] as boolean) ?? false,
    quoteMod: parseJson(r["quote_mod"]) as User["quoteMod"],
    resultFilterPresets,
    testActivity,
    aiUses: parseJson(r["ai_uses"]) as
      | { date: string; count: number }
      | undefined,
    autoBanTimestamps,
    inbox,
    ips,
    canReport: (r["can_report"] as boolean) ?? true,
    nameHistory,
    lastNameChange: r["last_name_change"] as number | undefined,
    canManageApeKeys: (r["can_manage_ape_keys"] as boolean) ?? false,
    bananas: (r["bananas"] as number) ?? 0,
    suspicious: (r["suspicious"] as boolean) ?? false,
    note: r["note"] as string | undefined,
    lastLoginAt: r["last_login_at"] as number | undefined,
  };
}

export async function addUser(
  name: string,
  email: string,
  uid: string,
  gender?: Gender,
  age?: number,
  avatar?: string,
  firstName?: string,
  lastName?: string,
): Promise<void> {
  const personalBests = {
    time: {},
    words: {},
    quote: {},
    zen: {},
    custom: {},
    ai: {},
  };

  try {
    await db.query(
      `INSERT INTO users (
        uid, name, first_name, last_name, email, added_at,
        gender, age, avatar, personal_bests, test_activity, last_login_at, verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, true)`,
      [
        uid,
        name,
        firstName ?? null,
        lastName ?? null,
        email,
        Date.now(),
        gender ?? null,
        age ?? null,
        avatar ?? null,
        JSON.stringify(personalBests),
        JSON.stringify({}),
        Date.now(),
      ],
    );
  } catch (e) {
    const err = e as { constraint?: string };
    if (err.constraint?.includes("users_pkey")) {
      throw new TypeUZError(409, "User document already exists", "addUser");
    }
    throw e;
  }
}

export async function deleteUser(uid: string): Promise<void> {
  await db.query("DELETE FROM users WHERE uid = $1", [uid]);
}

export async function resetUser(uid: string): Promise<void> {
  await db.query(
    `UPDATE users SET
      personal_bests = $1::jsonb,
      lb_personal_bests = $2::jsonb,
      completed_tests = 0,
      started_tests = 0,
      time_typing = 0,
      lb_memory = '{}'::jsonb,
      bananas = 0,
      profile_details = $3::jsonb,
      favorite_quotes = '{}'::jsonb,
      custom_themes = '[]'::jsonb,
      tags = '[]'::jsonb,
      xp = 0,
      streak = $4::jsonb,
      test_activity = '{}'::jsonb,
      discord_id = NULL,
      discord_avatar = NULL,
      lb_opt_out = NULL,
      inbox = NULL
    WHERE uid = $5`,
    [
      JSON.stringify({
        time: {},
        words: {},
        quote: {},
        zen: {},
        custom: {},
        ai: {},
      }),
      JSON.stringify({ time: {} }),
      JSON.stringify({ bio: "", keyboard: "", socialProfiles: {} }),
      JSON.stringify({ length: 0, lastResultTimestamp: 0, maxLength: 0 }),
      uid,
    ],
  );
}

export async function updateName(
  uid: string,
  name: string,
  previousName: string,
): Promise<void> {
  if (name === previousName) {
    throw new TypeUZError(400, "New name is the same as the old name");
  }

  if (
    name?.toLowerCase() !== previousName?.toLowerCase() &&
    !(await isNameAvailable(name, uid))
  ) {
    throw new TypeUZError(409, "Username already taken", name);
  }

  const user = await db.queryOne<{ name_history: unknown; name: string }>(
    "SELECT name, name_history FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) {
    throw new TypeUZError(404, "User not found", "update name");
  }

  const nameHistory = (user.name_history as string[]) ?? [];
  nameHistory.push(previousName);

  await db.query(
    "UPDATE users SET name = $1, last_name_change = $2, name_history = $3::jsonb, needs_to_change_name = NULL WHERE uid = $4",
    [name, Date.now(), JSON.stringify(nameHistory), uid],
  );
}

export async function flagForNameChange(uid: string): Promise<void> {
  await db.query(
    "UPDATE users SET needs_to_change_name = true WHERE uid = $1",
    [uid],
  );
}

export async function clearPb(uid: string): Promise<void> {
  await db.query(
    "UPDATE users SET personal_bests = $1::jsonb, lb_personal_bests = $2::jsonb WHERE uid = $3",
    [
      JSON.stringify({
        time: {},
        words: {},
        quote: {},
        zen: {},
        custom: {},
        ai: {},
      }),
      JSON.stringify({ time: {} }),
      uid,
    ],
  );
}

export async function optOutOfLeaderboards(uid: string): Promise<void> {
  await db.query(
    "UPDATE users SET lb_opt_out = true, lb_personal_bests = $1::jsonb WHERE uid = $2",
    [JSON.stringify({ time: {} }), uid],
  );
}

export async function updateQuoteRatings(
  uid: string,
  quoteRatings: UserQuoteRatings,
): Promise<boolean> {
  await db.query("UPDATE users SET quote_ratings = $1::jsonb WHERE uid = $2", [
    JSON.stringify(quoteRatings),
    uid,
  ]);
  return true;
}

export async function updateEmail(
  uid: string,
  email: string,
): Promise<boolean> {
  await db.query("UPDATE users SET email = $1 WHERE uid = $2", [email, uid]);
  return true;
}

export async function getUser(uid: string, stack: string): Promise<DBUser> {
  if (db.getPool() === undefined) {
    // Try users_by_uid first (fast path)
    const byUid =
      devGetUser<Record<string, { uid: string; email: string; name: string }>>(
        "users_by_uid",
      ) ?? {};
    let userMeta = byUid[uid];
    // Fallback: scan users_by_email
    if (userMeta === undefined) {
      const allUsers =
        devGetUser<
          Record<string, { uid: string; email: string; name: string }>
        >("users_by_email") ?? {};
      userMeta = Object.values(allUsers).find((u) => u.uid === uid);
    }
    if (userMeta !== undefined) {
      const profile =
        devGetUser<Record<string, unknown>>(`user_profile_${uid}`) ?? {};
      return {
        name: userMeta.name,
        email: userMeta.email ?? "",
        uid: userMeta.uid,
        addedAt: (profile["addedAt"] as number) ?? Date.now(),
        personalBests: (profile["personalBests"] as PersonalBests) ?? {
          time: {},
          words: {},
          quote: {},
          zen: {},
          custom: {},
          ai: {},
        },
        testActivity:
          (profile["testActivity"] as Record<string, (number | null)[]>) ?? {},
        lastLoginAt: (profile["lastLoginAt"] as number) ?? Date.now(),
        firstName: profile["firstName"] as string | undefined,
        lastName: profile["lastName"] as string | undefined,
        gender: profile["gender"] as Gender | undefined,
        age: profile["age"] as number | undefined,
        avatar: profile["avatar"] as string | undefined,
        profileDetails: profile["profileDetails"] as
          | UserProfileDetails
          | undefined,
        completedTests: (profile["completedTests"] as number) ?? 0,
        startedTests: (profile["startedTests"] as number) ?? 0,
        timeTyping: (profile["timeTyping"] as number) ?? 0,
        xp: (profile["xp"] as number) ?? 0,
        banned: false,
        lbOptOut: false,
        verified: true,
        needsToChangeName: false,
        canReport: true,
        canManageApeKeys: false,
        bananas: 0,
        suspicious: false,
        inventory: { badges: [] },
      };
    }
    throw new TypeUZError(404, "User not found", stack);
  }

  const row = await db.queryOne("SELECT * FROM users WHERE uid = $1", [uid]);
  if (!row) throw new TypeUZError(404, "User not found", stack);
  return migrateUser(userRowToDBUser(row));
}

export async function getPartialUser<K extends keyof DBUser>(
  uid: string,
  stack: string,
  fields: K[],
): Promise<Pick<DBUser, K>> {
  if (db.getPool() === undefined) {
    const full = await getUser(uid, stack);
    const partial: Record<string, unknown> = {};
    fields.forEach((f) => {
      partial[f] = (full as Record<string, unknown>)[f];
    });
    return partial as Pick<DBUser, K>;
  }

  const colMap: Record<string, string> = {
    uid: "uid",
    name: "name",
    firstName: "first_name",
    lastName: "last_name",
    email: "email",
    addedAt: "added_at",
    gender: "gender",
    age: "age",
    avatar: "avatar",
    personalBests: "personal_bests",
    lbPersonalBests: "lb_personal_bests",
    lastResultHashes: "last_result_hashes",
    completedTests: "completed_tests",
    startedTests: "started_tests",
    timeTyping: "time_typing",
    streak: "streak",
    xp: "xp",
    discordId: "discord_id",
    discordAvatar: "discord_avatar",
    tags: "tags",
    profileDetails: "profile_details",
    customThemes: "custom_themes",
    premium: "premium",
    quoteRatings: "quote_ratings",
    favoriteQuotes: "favorite_quotes",
    lbMemory: "lb_memory",
    inventory: "inventory",
    banned: "banned",
    lbOptOut: "lb_opt_out",
    verified: "verified",
    needsToChangeName: "needs_to_change_name",
    quoteMod: "quote_mod",
    resultFilterPresets: "result_filter_presets",
    testActivity: "test_activity",
    aiUses: "ai_uses",
    autoBanTimestamps: "auto_ban_timestamps",
    inbox: "inbox",
    ips: "ips",
    canReport: "can_report",
    nameHistory: "name_history",
    lastNameChange: "last_name_change",
    canManageApeKeys: "can_manage_ape_keys",
    bananas: "bananas",
    suspicious: "suspicious",
    note: "note",
    lastLoginAt: "last_login_at",
  };

  const cols = fields.map((f) => colMap[f] ?? f).filter(Boolean);
  const row = await db.queryOne(
    `SELECT ${cols.join(", ")} FROM users WHERE uid = $1`,
    [uid],
  );
  if (!row) throw new TypeUZError(404, "User not found", stack);

  const result: Record<string, unknown> = {};
  fields.forEach((f) => {
    const col = colMap[f] ?? f;
    const val = row[col];
    if (
      typeof val === "string" &&
      [
        "personal_bests",
        "tags",
        "custom_themes",
        "streak",
        "premium",
        "profile_details",
        "lb_memory",
        "inventory",
        "inbox",
        "ips",
        "name_history",
        "favorite_quotes",
        "lb_personal_bests",
        "result_filter_presets",
        "test_activity",
        "auto_ban_timestamps",
        "quote_ratings",
        "quote_mod",
        "last_result_hashes",
        "ai_uses",
      ].includes(col)
    ) {
      try {
        result[f] = val ? JSON.parse(val) : undefined;
      } catch {
        result[f] = val;
      }
    } else {
      result[f] = val;
    }
  });

  const partial = result as DBUser;
  if (fields.includes("personalBests" as K)) {
    return migrateUser(partial);
  }
  return partial;
}

export async function findByName(name: string): Promise<DBUser | undefined> {
  if (db.getPool() === undefined) {
    const usersByName =
      devGetUser<Record<string, { uid: string; email: string; name: string }>>(
        "users_by_name",
      ) ?? {};
    const meta = usersByName[name.toLowerCase()];
    if (meta !== undefined) {
      return {
        name: meta.name,
        email: meta.email ?? "",
        uid: meta.uid,
        addedAt: Date.now(),
        personalBests: {
          time: {},
          words: {},
          quote: {},
          zen: {},
          custom: {},
          ai: {},
        },
        testActivity: {},
        lastLoginAt: Date.now(),
      };
    }
    return undefined;
  }

  const row = await db.queryOne(
    "SELECT * FROM users WHERE LOWER(name) = LOWER($1)",
    [name],
  );
  return row ? userRowToDBUser(row) : undefined;
}

export async function findByEmail(email: string): Promise<DBUser | undefined> {
  if (db.getPool() === undefined) {
    const usersByEmail =
      devGetUser<Record<string, { uid: string; email: string; name: string }>>(
        "users_by_email",
      ) ?? {};
    const meta = usersByEmail[email.toLowerCase()];
    if (meta !== undefined) {
      return {
        name: meta.name,
        email: meta.email ?? "",
        uid: meta.uid,
        addedAt: Date.now(),
        personalBests: {
          time: {},
          words: {},
          quote: {},
          zen: {},
          custom: {},
          ai: {},
        },
        testActivity: {},
        lastLoginAt: Date.now(),
      };
    }
    return undefined;
  }

  const row = await db.queryOne(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
    [email],
  );
  return row ? userRowToDBUser(row) : undefined;
}

export async function updateLastLoginAt(uid: string): Promise<void> {
  await db.query("UPDATE users SET last_login_at = $1 WHERE uid = $2", [
    Date.now(),
    uid,
  ]);
}

export async function getTokenVersion(uid: string): Promise<number | null> {
  const row = await db.queryOne<{ token_version: number }>(
    "SELECT token_version FROM users WHERE uid = $1",
    [uid],
  );
  return row?.token_version ?? null;
}

export async function incrementTokenVersion(uid: string): Promise<void> {
  const result = await db.query(
    "UPDATE users SET token_version = token_version + 1 WHERE uid = $1",
    [uid],
  );
  if (result.rowCount === 0) {
    throw new TypeUZError(404, "User not found", "increment token version");
  }
}

export async function isNameAvailable(
  name: string,
  uid: string,
): Promise<boolean> {
  const user = await findByName(name);
  return user === undefined || user.uid === uid;
}

export async function getUserByName(
  name: string,
  stack: string,
): Promise<DBUser> {
  const user = await findByName(name);
  if (!user) throw new TypeUZError(404, "User not found", stack);
  return migrateUser(user);
}

export async function isDiscordIdAvailable(
  discordId: string,
): Promise<boolean> {
  const row = await db.queryOne<{ uid: string }>(
    "SELECT uid FROM users WHERE discord_id = $1",
    [discordId],
  );
  return row === null;
}

export async function addResultFilterPreset(
  uid: string,
  resultFilter: ResultFilters,
  maxFiltersPerUser: number,
): Promise<string> {
  if (maxFiltersPerUser === 0) {
    throw new TypeUZError(
      409,
      "Maximum number of custom filters reached",
      "add result filter preset",
    );
  }

  const user = await db.queryOne<{ result_filter_presets: unknown }>(
    "SELECT result_filter_presets FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) {
    throw new TypeUZError(404, "User not found", "add result filter preset");
  }

  const presets = (user.result_filter_presets as ResultFilters[]) ?? [];
  if (presets.length >= maxFiltersPerUser) {
    throw new TypeUZError(
      409,
      "Maximum number of custom filters reached",
      "add result filter preset",
    );
  }

  const _id = crypto.randomUUID();
  presets.push({ ...resultFilter, _id });

  await db.query(
    "UPDATE users SET result_filter_presets = $1::jsonb WHERE uid = $2",
    [JSON.stringify(presets), uid],
  );
  return _id;
}

export async function removeResultFilterPreset(
  uid: string,
  _id: string,
): Promise<void> {
  const user = await db.queryOne<{ result_filter_presets: unknown }>(
    "SELECT result_filter_presets FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) {
    throw new TypeUZError(404, "User not found", "remove result filter");
  }

  const presets = (user.result_filter_presets as ResultFilters[]) ?? [];
  const filtered = presets.filter((p) => p._id !== _id);
  if (filtered.length === presets.length) {
    throw new TypeUZError(
      404,
      "Custom filter not found",
      "remove result filter preset",
    );
  }

  await db.query(
    "UPDATE users SET result_filter_presets = $1::jsonb WHERE uid = $2",
    [JSON.stringify(filtered), uid],
  );
}

export async function setVerified(
  uid: string,
  verified: boolean,
): Promise<void> {
  if (db.getPool() === undefined) {
    return;
  }
  await db.query("UPDATE users SET verified = $1 WHERE uid = $2", [
    verified,
    uid,
  ]);
}

export async function addTag(uid: string, name: string): Promise<DBUserTag> {
  const user = await db.queryOne<{ tags: unknown }>(
    "SELECT tags FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) throw new TypeUZError(404, "User not found", "add tag");

  const tags = (user.tags as DBUserTag[]) ?? [];
  if (tags.length >= 15) {
    throw new TypeUZError(400, "Maximum number of tags reached", "add tag");
  }

  const newTag: DBUserTag = {
    _id: crypto.randomUUID(),
    name,
    personalBests: {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
      ai: {},
    },
  };
  tags.push(newTag);

  await db.query("UPDATE users SET tags = $1::jsonb WHERE uid = $2", [
    JSON.stringify(tags),
    uid,
  ]);
  return newTag;
}

export async function getTags(uid: string): Promise<DBUserTag[]> {
  const user = await getPartialUser(uid, "get tags", ["tags"]);
  return user.tags ?? [];
}

export async function editTag(
  uid: string,
  _id: string,
  name: string,
): Promise<void> {
  const user = await db.queryOne<{ tags: unknown }>(
    "SELECT tags FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) throw new TypeUZError(404, "User not found", "edit tag");

  const tags = (user.tags as DBUserTag[]) ?? [];
  const tag = tags.find((t) => t._id === _id);
  if (!tag) throw new TypeUZError(404, "Tag not found", "edit tag");

  tag.name = name;
  await db.query("UPDATE users SET tags = $1::jsonb WHERE uid = $2", [
    JSON.stringify(tags),
    uid,
  ]);
}

export async function removeTag(uid: string, _id: string): Promise<void> {
  const user = await db.queryOne<{ tags: unknown }>(
    "SELECT tags FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) throw new TypeUZError(404, "User not found", "remove tag");

  const tags = (user.tags as DBUserTag[]) ?? [];
  const filtered = tags.filter((t) => t._id !== _id);
  if (filtered.length === tags.length) {
    throw new TypeUZError(404, "Tag not found", "remove tag");
  }

  await db.query("UPDATE users SET tags = $1::jsonb WHERE uid = $2", [
    JSON.stringify(filtered),
    uid,
  ]);
}

export async function removeTagPb(uid: string, _id: string): Promise<void> {
  const user = await db.queryOne<{ tags: unknown }>(
    "SELECT tags FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) throw new TypeUZError(404, "User not found", "remove tag pb");

  const tags = (user.tags as DBUserTag[]) ?? [];
  const tag = tags.find((t) => t._id === _id);
  if (!tag) throw new TypeUZError(404, "Tag not found", "remove tag pb");

  tag.personalBests = {
    time: {},
    words: {},
    quote: {},
    zen: {},
    custom: {},
    ai: {},
  };
  await db.query("UPDATE users SET tags = $1::jsonb WHERE uid = $2", [
    JSON.stringify(tags),
    uid,
  ]);
}

export async function updateLbMemory(
  uid: string,
  mode: Mode,
  mode2: string,
  language: string,
  rank: number,
): Promise<void> {
  const user = await db.queryOne<{ lb_memory: unknown }>(
    "SELECT lb_memory FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) throw new TypeUZError(404, "User not found", "update lb memory");

  const lbMemory: Record<
    string,
    Record<string, Record<string, number>>
  > = typeof user.lb_memory === "object" && user.lb_memory !== null
    ? (user.lb_memory as Record<string, Record<string, Record<string, number>>>)
    : {};
  lbMemory[mode] ??= {};
  lbMemory[mode][mode2] ??= {};
  lbMemory[mode][mode2][language] = rank;

  await db.query("UPDATE users SET lb_memory = $1::jsonb WHERE uid = $2", [
    JSON.stringify(lbMemory),
    uid,
  ]);
}

export async function checkIfPb(
  uid: string,
  user: Pick<DBUser, "personalBests" | "lbPersonalBests">,
  result: Result,
): Promise<boolean> {
  const { mode } = result;
  if (!canFunboxGetPb(result)) return false;
  if (
    "stopOnLetter" in result &&
    result.stopOnLetter === true &&
    result.acc < 100
  ) {
    return false;
  }
  if (mode === "quote") return false;

  user.personalBests ??= {
    time: {},
    custom: {},
    ai: {},
    quote: {},
    words: {},
    zen: {},
  };
  user.lbPersonalBests ??= { time: {} };

  const pb = checkAndUpdatePb(user.personalBests, user.lbPersonalBests, result);
  if (!pb.isPb) return false;

  const personalBestsJson = JSON.stringify(pb.personalBests);
  const lbPersonalBestsJson = pb.lbPersonalBests
    ? JSON.stringify(pb.lbPersonalBests)
    : null;

  if (lbPersonalBestsJson !== null) {
    await db.query(
      "UPDATE users SET personal_bests = $1::jsonb, lb_personal_bests = $2::jsonb WHERE uid = $3",
      [personalBestsJson, lbPersonalBestsJson, uid],
    );
  } else {
    await db.query(
      "UPDATE users SET personal_bests = $1::jsonb WHERE uid = $2",
      [personalBestsJson, uid],
    );
  }
  return true;
}

export async function checkIfTagPb(
  uid: string,
  user: Pick<DBUser, "tags">,
  result: Result,
): Promise<string[]> {
  if (!user.tags || user.tags.length === 0) return [];
  const { mode, tags: resultTags } = result;
  if (!canFunboxGetPb(result)) return [];
  if (
    "stopOnLetter" in result &&
    result.stopOnLetter === true &&
    result.acc < 100
  ) {
    return [];
  }
  if (mode === "quote") return [];

  const tagsToCheck = user.tags.filter((userTag) =>
    resultTags?.some((rt) => rt === userTag._id),
  );
  const ret: string[] = [];

  for (const tag of tagsToCheck) {
    tag.personalBests ??= {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
      ai: {},
    };
    const tagpb = checkAndUpdatePb(tag.personalBests, undefined, result);
    if (tagpb.isPb) {
      ret.push(tag._id);
      await db.query("UPDATE users SET tags = $1::jsonb WHERE uid = $2", [
        JSON.stringify(user.tags),
        uid,
      ]);
    }
  }
  return ret;
}

export async function resetPb(uid: string): Promise<void> {
  await db.query("UPDATE users SET personal_bests = $1::jsonb WHERE uid = $2", [
    JSON.stringify({
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
      ai: {},
    }),
    uid,
  ]);
}

export async function updateLastHashes(
  uid: string,
  lastHashes: string[],
): Promise<void> {
  await db.query(
    "UPDATE users SET last_result_hashes = $1::jsonb WHERE uid = $2",
    [JSON.stringify(lastHashes), uid],
  );
}

export async function updateTypingStats(
  uid: string,
  restartCount: number,
  timeTyping: number,
): Promise<void> {
  await db.query(
    `UPDATE users SET
      started_tests = started_tests + $1,
      completed_tests = completed_tests + 1,
      time_typing = time_typing + $2
    WHERE uid = $3`,
    [restartCount + 1, timeTyping, uid],
  );
}

export async function linkDiscord(
  uid: string,
  discordId: string,
  discordAvatar?: string,
): Promise<void> {
  if (discordAvatar !== undefined) {
    await db.query(
      "UPDATE users SET discord_id = $1, discord_avatar = $2 WHERE uid = $3",
      [discordId, discordAvatar, uid],
    );
  } else {
    await db.query("UPDATE users SET discord_id = $1 WHERE uid = $2", [
      discordId,
      uid,
    ]);
  }
}

export async function unlinkDiscord(uid: string): Promise<void> {
  await db.query(
    "UPDATE users SET discord_id = NULL, discord_avatar = NULL WHERE uid = $1",
    [uid],
  );
}

export async function incrementBananas(
  uid: string,
  wpm: number,
): Promise<void> {
  const user = await db.queryOne<{ personal_bests: unknown }>(
    "SELECT personal_bests FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) return;

  const pbs = structuredClone(user.personal_bests) as PersonalBests;
  const time60 = pbs?.time?.["60"];
  if (time60 === undefined || time60.length === 0) return;

  const maxWpm = Math.max(...time60.map((pb) => pb.wpm));
  if (wpm >= maxWpm * 0.75) {
    await db.query("UPDATE users SET bananas = bananas + 1 WHERE uid = $1", [
      uid,
    ]);
  }
}

export async function incrementXp(uid: string, xp: number): Promise<void> {
  if (isNaN(xp)) xp = 0;
  await db.query("UPDATE users SET xp = xp + $1 WHERE uid = $2", [xp, uid]);
}

export async function incrementTestActivity(
  user: DBUser,
  timestamp: number,
): Promise<void> {
  if (user.testActivity === undefined) return;

  const date = new UTCDate(timestamp);
  const dayOfYear = getDayOfYear(date);
  const year = date.getFullYear();

  const activity = { ...user.testActivity };
  activity[year] ??= [];
  const arr = [...(activity[year] ?? [])];
  arr[dayOfYear - 1] = (arr[dayOfYear - 1] ?? 0) + 1;
  activity[year] = arr;

  await db.query("UPDATE users SET test_activity = $1::jsonb WHERE uid = $2", [
    JSON.stringify(activity),
    user.uid,
  ]);
}

export async function addTheme(
  uid: string,
  {
    name,
    colors,
  }: Omit<{ _id: string; name: string; colors: string[] }, "_id">,
): Promise<{ _id: string; name: string }> {
  const user = await db.queryOne<{ custom_themes: unknown }>(
    "SELECT custom_themes FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) throw new TypeUZError(404, "User not found", "add theme");

  const themes =
    (user.custom_themes as { _id: string; name: string; colors: string[] }[]) ??
    [];
  if (themes.length >= 20) {
    throw new TypeUZError(
      409,
      "Maximum number of custom themes reached",
      "add theme",
    );
  }

  const _id = crypto.randomUUID();
  themes.push({ _id, name, colors });

  await db.query("UPDATE users SET custom_themes = $1::jsonb WHERE uid = $2", [
    JSON.stringify(themes),
    uid,
  ]);
  return { _id, name };
}

export async function removeTheme(uid: string, id: string): Promise<void> {
  const user = await db.queryOne<{ custom_themes: unknown }>(
    "SELECT custom_themes FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) throw new TypeUZError(404, "User not found", "remove theme");

  const themes =
    (user.custom_themes as { _id: string; name: string; colors: string[] }[]) ??
    [];
  const filtered = themes.filter((t) => t._id !== id);
  if (filtered.length === themes.length) {
    throw new TypeUZError(404, "Custom theme not found", "remove theme");
  }

  await db.query("UPDATE users SET custom_themes = $1::jsonb WHERE uid = $2", [
    JSON.stringify(filtered),
    uid,
  ]);
}

export async function editTheme(
  uid: string,
  id: string,
  {
    name,
    colors,
  }: Omit<{ _id: string; name: string; colors: string[] }, "_id">,
): Promise<void> {
  const user = await db.queryOne<{ custom_themes: unknown }>(
    "SELECT custom_themes FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) throw new TypeUZError(404, "User not found", "edit theme");

  const themes =
    (user.custom_themes as { _id: string; name: string; colors: string[] }[]) ??
    [];
  const theme = themes.find((t) => t._id === id);
  if (!theme) {
    throw new TypeUZError(404, "Custom theme not found", "edit theme");
  }

  theme.name = name;
  theme.colors = colors;

  await db.query("UPDATE users SET custom_themes = $1::jsonb WHERE uid = $2", [
    JSON.stringify(themes),
    uid,
  ]);
}

export type DBCustomTheme = { _id: string; name: string; colors: string[] };

export async function getThemes(uid: string): Promise<DBCustomTheme[]> {
  const user = await getPartialUser(uid, "get themes", ["customThemes"]);
  return user.customThemes ?? [];
}

export async function getPersonalBests(
  uid: string,
  mode: string,
  mode2?: string,
): Promise<unknown> {
  const user = await getPartialUser(uid, "get personal bests", [
    "personalBests",
  ]);
  if (mode2 !== undefined) {
    return user.personalBests?.[mode as keyof PersonalBests]?.[mode2];
  }
  return user.personalBests?.[mode as keyof PersonalBests];
}

export async function getStats(
  uid: string,
): Promise<Pick<DBUser, "startedTests" | "completedTests" | "timeTyping">> {
  return await getPartialUser(uid, "get stats", [
    "startedTests",
    "completedTests",
    "timeTyping",
  ]);
}

export async function getFavoriteQuotes(
  uid: string,
): Promise<Record<string, string[]>> {
  const user = await getPartialUser(uid, "get favorite quotes", [
    "favoriteQuotes",
  ]);
  return user.favoriteQuotes ?? {};
}

export async function addFavoriteQuote(
  uid: string,
  language: string,
  quoteId: string,
  maxQuotes: number,
): Promise<void> {
  const user = await db.queryOne<{ favorite_quotes: unknown }>(
    "SELECT favorite_quotes FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) throw new TypeUZError(404, "User not found", "add favorite quote");

  const fq = (user.favorite_quotes as Record<string, string[]>) ?? {};
  const totalQuotes = Object.values(fq).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );
  if (totalQuotes >= maxQuotes) {
    throw new TypeUZError(
      409,
      "Maximum number of favorite quotes reached",
      "add favorite quote",
    );
  }

  fq[language] ??= [];
  if (!fq[language].includes(quoteId)) {
    fq[language].push(quoteId);
  }

  await db.query(
    "UPDATE users SET favorite_quotes = $1::jsonb WHERE uid = $2",
    [JSON.stringify(fq), uid],
  );
}

export async function removeFavoriteQuote(
  uid: string,
  language: string,
  quoteId: string,
): Promise<void> {
  const user = await db.queryOne<{ favorite_quotes: unknown }>(
    "SELECT favorite_quotes FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) {
    throw new TypeUZError(404, "User not found", "remove favorite quote");
  }

  const fq = (user.favorite_quotes as Record<string, string[]>) ?? {};
  if (fq[language]) {
    fq[language] = fq[language].filter((q) => q !== quoteId);
  }

  await db.query(
    "UPDATE users SET favorite_quotes = $1::jsonb WHERE uid = $2",
    [JSON.stringify(fq), uid],
  );
}

export async function recordAutoBanEvent(
  uid: string,
  maxCount: number,
  maxHours: number,
): Promise<boolean> {
  const user = await getPartialUser(uid, "record auto ban event", [
    "banned",
    "autoBanTimestamps",
    "discordId",
  ]);

  let ret = false;
  if (user.banned) return ret;

  const autoBanTimestamps = user.autoBanTimestamps ?? [];
  const now = Date.now();
  const recentAutoBanTimestamps = autoBanTimestamps.filter(
    (t: number) => t >= now - maxHours * SECONDS_PER_HOUR * 1000,
  );
  recentAutoBanTimestamps.push(now);

  let banningUser = false;
  if (recentAutoBanTimestamps.length > maxCount) {
    banningUser = true;
    ret = true;
  }

  const updateData: Record<string, unknown> = {
    autoBanTimestamps: recentAutoBanTimestamps,
  };
  if (banningUser) updateData["banned"] = true;

  await db.query(
    "UPDATE users SET auto_ban_timestamps = $1::jsonb, banned = $2 WHERE uid = $3",
    [JSON.stringify(recentAutoBanTimestamps), banningUser, uid],
  );

  void addImportantLog(
    "user_auto_banned",
    { autoBanTimestamps, banningUser },
    uid,
  );
  return ret;
}

export async function updateProfile(
  uid: string,
  profileDetailUpdates: Partial<UserProfileDetails>,
  inventory?: UserInventory,
): Promise<void> {
  if (db.getPool() === undefined) {
    const profile =
      devGetUser<Record<string, unknown>>(`user_profile_${uid}`) ?? {};
    Object.assign(profile, { profileDetails: profileDetailUpdates });
    if (inventory !== undefined) Object.assign(profile, { inventory });
    devSet(`user_profile_${uid}`, profile);
    return;
  }

  const profileDetails = profileDetailUpdates as Record<string, unknown>;

  if (inventory !== undefined) {
    await db.query(
      "UPDATE users SET profile_details = $1::jsonb, inventory = $2::jsonb WHERE uid = $3",
      [JSON.stringify(profileDetails), JSON.stringify(inventory), uid],
    );
  } else {
    await db.query(
      "UPDATE users SET profile_details = $1::jsonb WHERE uid = $2",
      [JSON.stringify(profileDetails), uid],
    );
  }
}

export async function updateProfileDetails(
  uid: string,
  updates: Record<string, unknown>,
): Promise<void> {
  if (db.getPool() === undefined) {
    const profile =
      devGetUser<Record<string, unknown>>(`user_profile_${uid}`) ?? {};
    Object.assign(profile, updates);
    devSet(`user_profile_${uid}`, profile);
    return;
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates["firstName"] !== undefined) {
    setClauses.push(`first_name = $${paramIndex++}`);
    values.push(updates["firstName"]);
  }
  if (updates["lastName"] !== undefined) {
    setClauses.push(`last_name = $${paramIndex++}`);
    values.push(updates["lastName"]);
  }
  if (updates["gender"] !== undefined) {
    setClauses.push(`gender = $${paramIndex++}`);
    values.push(updates["gender"]);
  }
  if (updates["age"] !== undefined) {
    setClauses.push(`age = $${paramIndex++}`);
    values.push(updates["age"]);
  }
  if (updates["avatar"] !== undefined) {
    setClauses.push(`avatar = $${paramIndex++}`);
    values.push(updates["avatar"]);
  }

  if (setClauses.length === 0) return;

  values.push(uid);
  
  await db.query(
    `UPDATE users SET ${setClauses.join(", ")} WHERE uid = $${paramIndex}`,
    values,
  );
}

export async function getInbox(uid: string): Promise<MonkeyMail[]> {
  const user = await getPartialUser(uid, "get inbox", ["inbox"]);
  return user.inbox ?? [];
}

type AddToInboxBulkEntry = {
  uid: string;
  mail: MonkeyMail[];
};

export async function addToInboxBulk(
  entries: AddToInboxBulkEntry[],
  inboxConfig: Configuration["users"]["inbox"],
): Promise<void> {
  const { enabled, maxMail } = inboxConfig;
  if (!enabled) return;

  for (const entry of entries) {
    const user = await db.queryOne<{ inbox: unknown }>(
      "SELECT inbox FROM users WHERE uid = $1",
      [entry.uid],
    );
    if (!user) continue;

    const inbox = (user.inbox as MonkeyMail[]) ?? [];
    const updated = [...entry.mail, ...inbox].slice(0, maxMail);

    await db.query("UPDATE users SET inbox = $1::jsonb WHERE uid = $2", [
      JSON.stringify(updated),
      entry.uid,
    ]);
  }
}

export async function addToInbox(
  uid: string,
  mail: MonkeyMail[],
  inboxConfig: Configuration["users"]["inbox"],
): Promise<void> {
  const { enabled, maxMail } = inboxConfig;
  if (!enabled) return;

  const user = await db.queryOne<{ inbox: unknown }>(
    "SELECT inbox FROM users WHERE uid = $1",
    [uid],
  );
  if (!user) throw new TypeUZError(404, "User not found", "add to inbox");

  const inbox = (user.inbox as MonkeyMail[]) ?? [];
  const updated = [...mail, ...inbox].slice(0, maxMail);

  await db.query("UPDATE users SET inbox = $1::jsonb WHERE uid = $2", [
    JSON.stringify(updated),
    uid,
  ]);
}

export async function updateInbox(
  uid: string,
  mailToRead: string[],
  mailToDelete: string[],
): Promise<void> {
  const user = await db.queryOne<{
    inbox: unknown;
    xp: number;
    inventory: unknown;
  }>("SELECT inbox, xp, inventory FROM users WHERE uid = $1", [uid]);
  if (!user) throw new TypeUZError(404, "User not found", "update inbox");

  const inbox = (user.inbox as MonkeyMail[]) ?? [];
  const xp = user.xp ?? 0;
  let inventory = (user.inventory as UserInventory) ?? { badges: [] };

  const deleteSet = [...new Set(mailToDelete)];
  const readSet = [...new Set(mailToRead)].filter(
    (id) => !deleteSet.includes(id),
  );

  const toBeDeleted = inbox.filter((m) => deleteSet.includes(m.id));
  const toBeRead = inbox.filter((m) => readSet.includes(m.id) && !m.read);

  const rewards: AllRewards[] = [...toBeRead, ...toBeDeleted]
    .filter((m) => !m.read)
    .reduce(
      (arr: AllRewards[], current) => arr.concat(current.rewards ?? []),
      [],
    );

  const xpGain = rewards
    .filter((r) => r.type === "xp")
    .reduce((sum, r) => sum + r.item, 0);

  const badgesToClaim = rewards
    .filter((r) => r.type === "badge")
    .map((r) => r.item);

  inventory.badges ??= [];
  const uniqueBadgeIds = new Set<number>();
  const newBadges: Badge[] = [];
  for (const badge of [...inventory.badges, ...badgesToClaim]) {
    if (uniqueBadgeIds.has(badge.id)) continue;
    uniqueBadgeIds.add(badge.id);
    newBadges.push(badge);
  }
  inventory.badges = newBadges;

  const inboxUpdate = inbox
    .filter((m) => !deleteSet.includes(m.id))
    .sort((a, b) => b.timestamp - a.timestamp);

  toBeRead.forEach((m) => {
    m.read = true;
    m.rewards = [];
  });

  await db.query(
    "UPDATE users SET xp = $1, inbox = $2::jsonb, inventory = $3::jsonb WHERE uid = $4",
    [xp + xpGain, JSON.stringify(inboxUpdate), JSON.stringify(inventory), uid],
  );
}

export async function updateStreak(
  uid: string,
  timestamp: number,
): Promise<number> {
  const user = await getPartialUser(uid, "calculate streak", ["streak"]);

  const streak: {
    lastResultTimestamp: number;
    length: number;
    maxLength: number;
    hourOffset?: number;
  } = {
    lastResultTimestamp: user.streak?.lastResultTimestamp ?? 0,
    length: user.streak?.length ?? 0,
    maxLength: user.streak?.maxLength ?? 0,
    hourOffset: user.streak?.hourOffset,
  };

  if (isYesterday(streak.lastResultTimestamp, streak.hourOffset ?? 0)) {
    streak.length += 1;
  } else if (!isToday(streak.lastResultTimestamp, streak.hourOffset ?? 0)) {
    void addImportantLog("streak_lost", streak, uid);
    streak.length = 1;
  }

  if (streak.length > streak.maxLength) {
    streak.maxLength = streak.length;
  }
  streak.lastResultTimestamp = timestamp;

  if (user.streak?.hourOffset === 0) {
    delete streak.hourOffset;
  }

  await db.query("UPDATE users SET streak = $1::jsonb WHERE uid = $2", [
    JSON.stringify(streak),
    uid,
  ]);
  return streak.length;
}

export async function setStreakHourOffset(
  uid: string,
  hourOffset: number,
): Promise<void> {
  await db.query(
    "UPDATE users SET streak = jsonb_set(COALESCE(streak, '{}'::jsonb), '{hourOffset}', $1::jsonb) WHERE uid = $2",
    [JSON.stringify(hourOffset), uid],
  );
  await db.query(
    "UPDATE users SET streak = jsonb_set(COALESCE(streak, '{}'::jsonb), '{lastResultTimestamp}', $1::jsonb) WHERE uid = $2",
    [JSON.stringify(Date.now()), uid],
  );
}

export async function setBanned(uid: string, banned: boolean): Promise<void> {
  if (banned) {
    await db.query("UPDATE users SET banned = true WHERE uid = $1", [uid]);
  } else {
    await db.query("UPDATE users SET banned = NULL WHERE uid = $1", [uid]);
  }
}

export async function clearStreakHourOffset(uid: string): Promise<void> {
  await db.query(
    "UPDATE users SET streak = (streak #- '{hourOffset}') WHERE uid = $1",
    [uid],
  );
}

export async function checkIfUserIsPremium(
  uid: string,
  userInfoOverride?: Pick<DBUser, "premium">,
): Promise<boolean> {
  const premiumFeaturesEnabled = (await getCachedConfiguration(true)).users
    .premium.enabled;
  if (!premiumFeaturesEnabled) return false;

  const user =
    userInfoOverride ??
    (await getPartialUser(uid, "checkIfUserIsPremium", ["premium"]));
  const expirationDate = user.premium?.expirationTimestamp;
  if (expirationDate === undefined) return false;
  if (expirationDate === -1) return true;
  return expirationDate > Date.now();
}

export async function logIpAddress(
  uid: string,
  ip: string,
  userInfoOverride?: Pick<DBUser, "ips">,
): Promise<void> {
  const user =
    userInfoOverride ?? (await getPartialUser(uid, "logIpAddress", ["ips"]));
  const currentIps = user.ips ?? [];
  const ipIndex = currentIps.indexOf(ip);
  if (ipIndex !== -1) currentIps.splice(ipIndex, 1);
  currentIps.unshift(ip);
  if (currentIps.length > 10) currentIps.pop();

  await db.query("UPDATE users SET ips = $1::jsonb WHERE uid = $2", [
    JSON.stringify(currentIps),
    uid,
  ]);
}

export async function getFriends(uid: string): Promise<Friend[]> {
  const friendUids = await getFriendsUids(uid);
  if (friendUids.length === 0) return [];

  const rows = await db.queryAll(
    `SELECT uid, name, discord_id, discord_avatar,
            started_tests, completed_tests, time_typing, xp,
            streak, personal_bests, inventory, premium, banned, lb_opt_out
     FROM users WHERE uid = ANY($1::text[])`,
    [friendUids],
  );

  return rows.map((r) => {
    const parseJson = <T>(val: unknown): T | undefined => {
      if (typeof val === "string") return JSON.parse(val) as T;
      if (val !== null && typeof val === "object") return val as T;
      return undefined;
    };
    const pbs = parseJson<PersonalBests>(r["personal_bests"]);
    const inv = parseJson<UserInventory>(r["inventory"]);
    const premium = parseJson<{ expirationTimestamp: number }>(r["premium"]);
    const streak = parseJson<{ length: number; maxLength: number }>(
      r["streak"],
    );

    const time15 = pbs?.time?.["15"];
    const time60 = pbs?.time?.["60"];
    const top15 = time15?.reduce<PersonalBest | undefined>(
      (best, pb) => (pb.wpm > (best?.wpm ?? 0) ? pb : best),
      undefined,
    );
    const top60 = time60?.reduce<PersonalBest | undefined>(
      (best, pb) => (pb.wpm > (best?.wpm ?? 0) ? pb : best),
      undefined,
    );

    const selectedBadge = inv?.badges?.find((b) => b.selected);
    const now = Date.now();
    const isPrem =
      premium?.expirationTimestamp === -1 ||
      (premium?.expirationTimestamp ?? 0) > now;

    const friend: Friend = {
      uid: r["uid"] as string,
      name: r["name"] as string,
      discordId: r["discord_id"] as string | undefined,
      discordAvatar: r["discord_avatar"] as string | undefined,
      startedTests: r["started_tests"] as number | undefined,
      completedTests: r["completed_tests"] as number | undefined,
      timeTyping: r["time_typing"] as number | undefined,
      xp: r["xp"] as number | undefined,
      banned: (r["banned"] as boolean) ?? false,
      lbOptOut: (r["lb_opt_out"] as boolean) ?? false,
      top15,
      top60,
      badgeId: selectedBadge?.id,
      isPremium: isPrem,
      streak: streak
        ? { length: streak.length, maxLength: streak.maxLength }
        : undefined,
    };
    return friend;
  });
}

function migrateUser<T extends { personalBests: PersonalBests }>(user: T): T {
  user.personalBests ??= {
    time: {},
    words: {},
    quote: {},
    zen: {},
    custom: {},
    ai: {},
  };
  return user;
}

export async function updateAiUses(
  uid: string,
  aiUses: { date: string; count: number },
): Promise<void> {
  if (db.getPool() === undefined) {
    const profile =
      devGetUser<Record<string, unknown>>(`user_profile_${uid}`) ?? {};
    profile["aiUses"] = aiUses;
    devSet(`user_profile_${uid}`, profile);
    return;
  }

  await db.query(`UPDATE users SET ai_uses = $1::jsonb WHERE uid = $2`, [
    JSON.stringify(aiUses),
    uid,
  ]);
}
