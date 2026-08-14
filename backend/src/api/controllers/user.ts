import * as UserDAL from "../../dal/user";
import TypeUZError, {
  getErrorMessage,
  isFirebaseError,
} from "../../utils/error";
import { TypeUZResponse } from "../../utils/typeuz-response";
import * as DiscordUtils from "../../utils/discord";
import {
  buildAgentLog,
  getFrontendUrl,
  isDevEnvironment,
  omit,
  replaceObjectId,
  replaceObjectIds,
  sanitizeString,
} from "../../utils/misc";
import GeorgeQueue from "../../queues/george-queue";
import { deleteAllApeKeys } from "../../dal/ape-keys";
import { deleteAllPresets } from "../../dal/preset";
import { deleteAll as deleteAllResults, getResults } from "../../dal/result";
import { deleteConfig } from "../../dal/config";
import { verify } from "../../utils/captcha";
import * as LeaderboardsDAL from "../../dal/leaderboards";
import { purgeUserFromDailyLeaderboards } from "../../utils/daily-leaderboards";
import { purgeUserFromXpLeaderboards } from "../../services/weekly-xp-leaderboard";
import { v4 as uuidv4 } from "uuid";
import * as ReportDAL from "../../dal/report";
import emailQueue from "../../queues/email-queue";
import FirebaseAdmin from "../../init/firebase-admin";
import * as AuthUtil from "../../utils/auth";
import * as Dates from "date-fns";
import { UTCDateMini } from "@date-fns/utc";
import * as BlocklistDal from "../../dal/blocklist";
import {
  AllTimeLbs,
  ResultFilters,
  User,
  UserProfile,
  CountByYearAndDay,
  TestActivity,
  UserProfileDetails,
} from "@typeuz/schemas/users";
import { addImportantLog, addLog, deleteUserLogs } from "../../dal/logs";
import { sendForgotPasswordEmail as authSendForgotPasswordEmail } from "../../utils/auth";
import {
  AddCustomThemeRequest,
  AddCustomThemeResponse,
  AddFavoriteQuoteRequest,
  AddResultFilterPresetRequest,
  AddResultFilterPresetResponse,
  AddTagRequest,
  AddTagResponse,
  CheckNamePathParameters,
  CheckNameResponse,
  CreateUserRequest,
  DeleteCustomThemeRequest,
  EditCustomThemeRequst,
  EditTagRequest,
  ForgotPasswordEmailRequest,
  GetCurrentTestActivityResponse,
  GetCustomThemesResponse,
  GetDiscordOauthLinkResponse,
  GetFavoriteQuotesResponse,
  GetFriendsResponse,
  GetPersonalBestsQuery,
  GetPersonalBestsResponse,
  GetProfilePathParams,
  GetProfileQuery,
  GetProfileResponse,
  GetStatsResponse,
  GetStreakResponse,
  GetTagsResponse,
  GetTestActivityResponse,
  GetUserInboxResponse,
  GetUserResponse,
  WeeklyAnalysisResponse,
  LinkDiscordRequest,
  LinkDiscordResponse,
  RemoveFavoriteQuoteRequest,
  RemoveResultFilterPresetPathParams,
  ReportUserRequest,
  SetStreakHourOffsetRequest,
  TagIdPathParams,
  UpdateEmailRequest,
  UpdateLeaderboardMemoryRequest,
  UpdatePasswordRequest,
  UpdateUserInboxRequest,
  UpdateUserNameRequest,
  UpdateProfileDetailsRequest,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  WeeklyAnalysisDailyBreakdown,
} from "@typeuz/contracts/users";
import { MILLISECONDS_IN_DAY } from "@typeuz/util/date-and-time";
import { TypeUZRequest } from "../types";
import { tryCatch } from "@typeuz/util/trycatch";
import * as ConnectionsDal from "../../dal/connections";
import { PersonalBest } from "@typeuz/schemas/shared";
import bcrypt from "bcrypt";
import {
  getPasswordDocument,
  savePasswordDocument,
} from "../../utils/custom-auth-store";

async function verifyCaptcha(captcha: string): Promise<void> {
  const { data: verified, error } = await tryCatch(verify(captcha));
  if (error) {
    throw new TypeUZError(
      422,
      "Request to the Captcha API failed, please try again later",
    );
  }
  if (!verified) {
    throw new TypeUZError(422, "Captcha challenge failed");
  }
}

export async function createNewUser(
  req: TypeUZRequest<undefined, CreateUserRequest>,
): Promise<TypeUZResponse> {
  const { name, firstName, lastName, captcha, gender, age, avatar } = req.body;
  const { email, uid } = req.ctx.decodedToken;

  try {
    await verifyCaptcha(captcha);

    if (email.endsWith("@tidal.lol") || email.endsWith("@selfbot.cc")) {
      throw new TypeUZError(400, "Invalid domain");
    }

    const available = await UserDAL.isNameAvailable(name, uid);
    if (!available) {
      throw new TypeUZError(409, "Username unavailable");
    }

    const blocklisted = await BlocklistDal.contains({ name, email });
    if (blocklisted) {
      throw new TypeUZError(409, "Username or email blocked");
    }

    await UserDAL.addUser(
      name,
      email,
      uid,
      gender,
      age,
      avatar,
      firstName,
      lastName,
    );
    void addImportantLog("user_created", `${name} ${email}`, uid);

    return new TypeUZResponse("User created", null);
  } catch (e) {
    //user was created in firebase from the frontend, remove it
    await firebaseDeleteUserIgnoreError(uid);
    throw e;
  }
}

export async function sendVerificationEmail(
  req: TypeUZRequest,
): Promise<TypeUZResponse> {
  const { email, uid } = req.ctx.decodedToken;
  const isVerified = (
    await FirebaseAdmin()
      .auth()
      .getUser(uid)
      .catch((e: unknown) => {
        throw new TypeUZError(
          500, // this should never happen, but it does. it mightve been caused by auth token cache, will see if disabling cache fixes it
          "Auth user not found, even though the token got decoded",
          JSON.stringify({
            uid,
            email,
            stack: e instanceof Error ? e.stack : JSON.stringify(e),
          }),
          uid,
        );
      })
  ).emailVerified;
  if (isVerified) {
    throw new TypeUZError(400, "Email already verified");
  }

  const userInfo = await UserDAL.getPartialUser(
    uid,
    "request verification email",
    ["uid", "name", "email"],
  );

  if (userInfo.email !== email) {
    throw new TypeUZError(
      400,
      "Authenticated email does not match the email found in the database. This might happen if you recently changed your email. Please refresh and try again.",
    );
  }

  const { data: link, error } = await tryCatch(
    FirebaseAdmin()
      .auth()
      .generateEmailVerificationLink(email, { url: getFrontendUrl() }),
  );

  if (error) {
    if (isFirebaseError(error)) {
      if (error.errorInfo.code === "auth/user-not-found") {
        throw new TypeUZError(
          500,
          "Auth user not found when the user was found in the database. Contact support with this error message and your email",
          JSON.stringify({
            decodedTokenEmail: email,
            userInfoEmail: userInfo.email,
          }),
          userInfo.uid,
        );
      } else if (error.errorInfo.code === "auth/too-many-requests") {
        throw new TypeUZError(429, "Too many requests. Please try again later");
      } else if (
        error.errorInfo.code === "auth/internal-error" &&
        error.errorInfo.message.toLowerCase().includes("too_many_attempts")
      ) {
        throw new TypeUZError(
          429,
          "Too many Firebase requests. Please try again later",
        );
      } else {
        throw new TypeUZError(
          500,
          `Firebase failed to generate an email verification link: ${
            error.errorInfo.message
          }`,
          JSON.stringify(error),
        );
      }
    } else {
      const message = getErrorMessage(error);
      if (message === undefined) {
        throw new TypeUZError(
          500,
          "Failed to generate an email verification link. Unknown error occured",
        );
      } else {
        if (message.toLowerCase().includes("too_many_attempts")) {
          throw new TypeUZError(
            429,
            "Too many requests. Please try again later",
          );
        } else {
          throw new TypeUZError(
            500,
            `Failed to generate an email verification link: ${message}`,
            error.stack,
          );
        }
      }
    }
  }

  await emailQueue.sendVerificationEmail(email, userInfo.name, link);

  return new TypeUZResponse("Email sent", null);
}

export async function sendForgotPasswordEmail(
  req: TypeUZRequest<undefined, ForgotPasswordEmailRequest>,
): Promise<TypeUZResponse> {
  const { email, captcha } = req.body;
  await verifyCaptcha(captcha);
  await authSendForgotPasswordEmail(email);
  return new TypeUZResponse(
    "Password reset request received. If the email is valid, you will receive an email shortly.",
    null,
  );
}

export async function deleteUser(req: TypeUZRequest): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;

  const { data: userInfo, error } = await tryCatch(
    UserDAL.getPartialUser(uid, "delete user", [
      "banned",
      "name",
      "email",
      "discordId",
    ]),
  );

  if (error) {
    if (error instanceof TypeUZError && error.status === 404) {
      //userinfo was already deleted. We ignore this and still try to remove the  other data
    } else {
      throw error;
    }
  }

  if (userInfo?.banned === true) {
    await BlocklistDal.add(userInfo);
  }

  //cleanup database
  const tasks = [
    UserDAL.deleteUser(uid),
    deleteUserLogs(uid),
    deleteAllApeKeys(uid),
    deleteAllPresets(uid),
    deleteConfig(uid),
    deleteAllResults(uid),
    LeaderboardsDAL.purgeUser(uid),
    purgeUserFromDailyLeaderboards(
      uid,
      req.ctx.configuration.dailyLeaderboards,
    ),
    purgeUserFromXpLeaderboards(
      uid,
      req.ctx.configuration.leaderboards.weeklyXp,
    ),
    ConnectionsDal.deleteByUid(uid),
  ];

  if (userInfo?.discordId !== undefined) {
    tasks.push(GeorgeQueue.unlinkDiscord(userInfo.discordId, uid));
  }

  await Promise.all(tasks);

  if (req.ctx.decodedToken.customAuth !== true) {
    try {
      await AuthUtil.deleteUser(uid);
    } catch (e) {
      if (isFirebaseError(e) && e.errorInfo.code === "auth/user-not-found") {
        //user was already deleted, ok to ignore
      } else {
        throw e;
      }
    }
  }

  void addImportantLog(
    "user_deleted",
    `${userInfo?.email} ${userInfo?.name}`,
    uid,
  );

  return new TypeUZResponse("User deleted", null);
}

export async function resetUser(req: TypeUZRequest): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;

  const userInfo = await UserDAL.getPartialUser(uid, "reset user", [
    "banned",
    "discordId",
    "email",
    "name",
  ]);
  if (userInfo.banned) {
    throw new TypeUZError(403, "Banned users cannot reset their account");
  }

  const promises = [
    UserDAL.resetUser(uid),
    deleteAllApeKeys(uid),
    deleteAllPresets(uid),
    deleteAllResults(uid),
    deleteConfig(uid),
    LeaderboardsDAL.purgeUser(uid),
    purgeUserFromDailyLeaderboards(
      uid,
      req.ctx.configuration.dailyLeaderboards,
    ),
    purgeUserFromXpLeaderboards(
      uid,
      req.ctx.configuration.leaderboards.weeklyXp,
    ),
  ];

  if (userInfo.discordId !== undefined && userInfo.discordId !== "") {
    promises.push(GeorgeQueue.unlinkDiscord(userInfo.discordId, uid));
  }
  await Promise.all(promises);
  void addImportantLog("user_reset", `${userInfo.email} ${userInfo.name}`, uid);

  return new TypeUZResponse("User reset", null);
}

export async function updateName(
  req: TypeUZRequest<undefined, UpdateUserNameRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { name } = req.body;

  const blocklisted = await BlocklistDal.contains({ name });
  if (blocklisted) {
    throw new TypeUZError(409, "Username blocked");
  }

  const user = await UserDAL.getPartialUser(uid, "update name", [
    "name",
    "banned",
    "needsToChangeName",
    "lastNameChange",
  ]);

  if (user.banned) {
    throw new TypeUZError(403, "Banned users cannot change their name");
  }

  if (
    !user?.needsToChangeName &&
    Date.now() - (user.lastNameChange ?? 0) < MILLISECONDS_IN_DAY * 30
  ) {
    throw new TypeUZError(409, "You can change your name once every 30 days");
  }

  await UserDAL.updateName(uid, name, user.name);

  await ConnectionsDal.updateName(uid, name);
  void addImportantLog(
    "user_name_updated",
    `changed name from ${user.name} to ${name}`,
    uid,
  );

  return new TypeUZResponse("User's name updated", null);
}

export async function clearPb(req: TypeUZRequest): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;

  await UserDAL.clearPb(uid);
  await LeaderboardsDAL.purgeUser(uid);
  await purgeUserFromDailyLeaderboards(
    uid,
    req.ctx.configuration.dailyLeaderboards,
  );
  void addImportantLog("user_cleared_pbs", "", uid);

  return new TypeUZResponse("User's PB cleared", null);
}

export async function optOutOfLeaderboards(
  req: TypeUZRequest,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;

  await UserDAL.optOutOfLeaderboards(uid);
  await LeaderboardsDAL.purgeUser(uid);
  await purgeUserFromDailyLeaderboards(
    uid,
    req.ctx.configuration.dailyLeaderboards,
  );
  await purgeUserFromXpLeaderboards(
    uid,
    req.ctx.configuration.leaderboards.weeklyXp,
  );
  void addImportantLog("user_opted_out_of_leaderboards", "", uid);

  return new TypeUZResponse("User opted out of leaderboards", null);
}

export async function checkName(
  req: TypeUZRequest<undefined, undefined, CheckNamePathParameters>,
): Promise<CheckNameResponse> {
  const { name } = req.params;
  const uid = req.ctx.decodedToken?.uid;

  const available = await UserDAL.isNameAvailable(name, uid);

  return new TypeUZResponse("Check username", {
    available,
  });
}

export async function updateEmail(
  req: TypeUZRequest<undefined, UpdateEmailRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  let { newEmail, previousEmail } = req.body;

  newEmail = newEmail.toLowerCase();
  previousEmail = previousEmail.toLowerCase();

  if (req.ctx.decodedToken.customAuth === true) {
    const existing = await UserDAL.findByEmail(newEmail);
    if (existing !== undefined && existing.uid !== uid) {
      throw new TypeUZError(
        409,
        "The email address is already in use by another account",
      );
    }
    await UserDAL.updateEmail(uid, newEmail);
    if (!isDevEnvironment()) {
      await UserDAL.incrementTokenVersion(uid);
    }
    void addImportantLog(
      "user_email_updated",
      `changed email from ${previousEmail} to ${newEmail}`,
      uid,
    );
    return new TypeUZResponse("Email updated", null);
  }

  try {
    await AuthUtil.updateUserEmail(uid, newEmail);
    await UserDAL.updateEmail(uid, newEmail);
  } catch (e) {
    if (isFirebaseError(e)) {
      if (e.code === "auth/email-already-exists") {
        throw new TypeUZError(
          409,
          "The email address is already in use by another account",
        );
      } else if (e.code === "auth/invalid-email") {
        throw new TypeUZError(400, "Invalid email address");
      } else if (e.code === "auth/too-many-requests") {
        throw new TypeUZError(429, "Too many requests. Please try again later");
      } else if (e.code === "auth/user-not-found") {
        throw new TypeUZError(
          404,
          "User not found in the auth system",
          "update email",
          uid,
        );
      } else if (e.code === "auth/invalid-user-token") {
        throw new TypeUZError(401, "Invalid user token", "update email", uid);
      }
    } else {
      throw e;
    }
  }

  void addImportantLog(
    "user_email_updated",
    `changed email from ${previousEmail} to ${newEmail}`,
    uid,
  );

  return new TypeUZResponse("Email updated", null);
}

export async function updatePassword(
  req: TypeUZRequest<undefined, UpdatePasswordRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { newPassword } = req.body;

  if (req.ctx.decodedToken.customAuth === true) {
    const existing = await getPasswordDocument(uid);
    if (existing === null) {
      throw new TypeUZError(404, "Password authentication not found");
    }
    await savePasswordDocument({
      ...existing,
      passwordHash: await bcrypt.hash(newPassword, 10),
    });
    if (!isDevEnvironment()) {
      await UserDAL.incrementTokenVersion(uid);
    }
    return new TypeUZResponse("Password updated", null);
  }

  await AuthUtil.updateUserPassword(uid, newPassword);

  return new TypeUZResponse("Password updated", null);
}

type RelevantUserInfo = Omit<
  UserDAL.DBUser,
  | "bananas"
  | "lbPersonalBests"
  | "inbox"
  | "nameHistory"
  | "lastNameChange"
  | "_id"
  | "lastResultHashes"
  | "note"
  | "ips"
  | "testActivity"
  | "suspicious"
>;

function getRelevantUserInfo(user: UserDAL.DBUser): RelevantUserInfo {
  return omit(user, [
    "bananas",
    "lbPersonalBests",
    "inbox",
    "nameHistory",
    "lastNameChange",
    "lastResultHashes",
    "note",
    "ips",
    "testActivity",
    "suspicious",
  ]);
}

export async function getUser(req: TypeUZRequest): Promise<GetUserResponse> {
  const { uid } = req.ctx.decodedToken;

  const { data: userInfo, error } = await tryCatch(
    UserDAL.getUser(uid, "get user"),
  );

  if (error) {
    if (error instanceof TypeUZError && error.status === 404) {
      if (req.ctx.decodedToken.customAuth === true) {
        throw new TypeUZError(
          404,
          "User not found in the database. Please sign up again.",
          "get user",
          uid,
        );
      }
      //if the user is in the auth system but not in the db, its possible that the user was created by bypassing captcha
      //since there is no data in the database anyway, we can just delete the user from the auth system
      //and ask them to sign up again
      try {
        await AuthUtil.deleteUser(uid);
        throw new TypeUZError(
          404,
          "User not found in the database, but found in the auth system. We have deleted the ghost user from the auth system. Please sign up again.",
          "get user",
          uid,
        );
      } catch (e) {
        // oxlint-disable-next-line no-unsafe-member-access
        if (
          (e as Record<string, unknown>)?.["code"] === "auth/user-not-found"
        ) {
          throw new TypeUZError(
            404,
            "User not found in the database or the auth system. Please sign up again.",
            "get user",
            uid,
          );
        } else {
          throw e;
        }
      }
    } else {
      throw error;
    }
  }

  userInfo.personalBests ??= {
    time: {},
    words: {},
    quote: {},
    zen: {},
    custom: {},
    ai: {},
  };

  const agentLog = buildAgentLog(req);
  void addLog("user_data_requested", agentLog, uid);
  void UserDAL.logIpAddress(uid, agentLog.ip, userInfo);

  let inboxUnreadSize = 0;
  if (req.ctx.configuration.users.inbox.enabled) {
    inboxUnreadSize = userInfo.inbox?.filter((mail) => !mail.read).length ?? 0;
  }

  if (!userInfo.name) {
    userInfo.needsToChangeName = true;
    await UserDAL.flagForNameChange(uid);
  }

  const isPremium = await UserDAL.checkIfUserIsPremium(uid, userInfo);

  const allTimeLbs = await getAllTimeLbs(uid);
  const testActivity = generateCurrentTestActivity(userInfo.testActivity);
  const relevantUserInfo = getRelevantUserInfo(userInfo);

  const resultFilterPresets: ResultFilters[] = (
    relevantUserInfo.resultFilterPresets ?? []
  ).map((it) => replaceObjectId(it));
  delete relevantUserInfo.resultFilterPresets;

  const tags = (relevantUserInfo.tags ?? []).map((it) => replaceObjectId(it));
  delete relevantUserInfo.tags;

  const customThemes = (relevantUserInfo.customThemes ?? []).map((it) =>
    replaceObjectId(it),
  );
  delete relevantUserInfo.customThemes;

  const userData: User = {
    ...relevantUserInfo,
    resultFilterPresets,
    tags,
    customThemes: customThemes?.map((t) => ({
      _id: t._id,
      name: t.name,
      colors: t.colors as [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ],
    })),
    isPremium,
    allTimeLbs,
    testActivity,
  };

  return new TypeUZResponse("User data retrieved", {
    ...userData,
    inboxUnreadSize: inboxUnreadSize,
  });
}

export async function getOauthLink(
  req: TypeUZRequest,
): Promise<GetDiscordOauthLinkResponse> {
  const { uid } = req.ctx.decodedToken;

  //build the url
  const url = await DiscordUtils.getOauthLink(uid);

  //return
  return new TypeUZResponse("Discord oauth link generated", {
    url: url,
  });
}

export async function linkDiscord(
  req: TypeUZRequest<undefined, LinkDiscordRequest>,
): Promise<LinkDiscordResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tokenType, accessToken, state } = req.body;

  if (!(await DiscordUtils.iStateValidForUser(state, uid))) {
    throw new TypeUZError(403, "Invalid user token");
  }

  const userInfo = await UserDAL.getPartialUser(uid, "link discord", [
    "banned",
    "discordId",
    "lbOptOut",
  ]);
  if (userInfo.banned) {
    throw new TypeUZError(403, "Banned accounts cannot link with Discord");
  }

  const { id: discordId, avatar: discordAvatar } =
    await DiscordUtils.getDiscordUser(tokenType, accessToken);

  if (userInfo.discordId !== undefined && userInfo.discordId !== "") {
    await UserDAL.linkDiscord(uid, userInfo.discordId, discordAvatar);
    return new TypeUZResponse("Discord avatar updated", {
      discordId,
      discordAvatar,
    });
  }

  if (!discordId) {
    throw new TypeUZError(
      500,
      "Could not get Discord account info",
      "discord id is undefined",
    );
  }

  const discordIdAvailable = await UserDAL.isDiscordIdAvailable(discordId);
  if (!discordIdAvailable) {
    throw new TypeUZError(
      409,
      "This Discord account is linked to a different account",
    );
  }

  if (await BlocklistDal.contains({ discordId })) {
    throw new TypeUZError(409, "The Discord account is blocked");
  }

  await UserDAL.linkDiscord(uid, discordId, discordAvatar);

  await GeorgeQueue.linkDiscord(discordId, uid, userInfo.lbOptOut ?? false);
  void addImportantLog("user_discord_link", `linked to ${discordId}`, uid);

  return new TypeUZResponse("Discord account linked", {
    discordId,
    discordAvatar,
  });
}

export async function unlinkDiscord(
  req: TypeUZRequest,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;

  const userInfo = await UserDAL.getPartialUser(uid, "unlink discord", [
    "banned",
    "discordId",
  ]);

  if (userInfo.banned) {
    throw new TypeUZError(403, "Banned accounts cannot unlink Discord");
  }

  const discordId = userInfo.discordId;
  if (discordId === undefined || discordId === "") {
    throw new TypeUZError(404, "User does not have a linked Discord account");
  }

  await GeorgeQueue.unlinkDiscord(discordId, uid);
  await UserDAL.unlinkDiscord(uid);
  void addImportantLog("user_discord_unlinked", discordId, uid);

  return new TypeUZResponse("Discord account unlinked", null);
}

export async function addResultFilterPreset(
  req: TypeUZRequest<undefined, AddResultFilterPresetRequest>,
): Promise<AddResultFilterPresetResponse> {
  const { uid } = req.ctx.decodedToken;
  const filter = req.body;
  const { maxPresetsPerUser } = req.ctx.configuration.results.filterPresets;

  const createdId = await UserDAL.addResultFilterPreset(
    uid,
    filter,
    maxPresetsPerUser,
  );
  return new TypeUZResponse("Result filter preset created", createdId);
}

export async function removeResultFilterPreset(
  req: TypeUZRequest<undefined, undefined, RemoveResultFilterPresetPathParams>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { presetId } = req.params;

  await UserDAL.removeResultFilterPreset(uid, presetId);
  return new TypeUZResponse("Result filter preset deleted", null);
}

export async function addTag(
  req: TypeUZRequest<undefined, AddTagRequest>,
): Promise<AddTagResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagName } = req.body;

  const tag = await UserDAL.addTag(uid, tagName);
  return new TypeUZResponse("Tag updated", replaceObjectId(tag));
}

export async function clearTagPb(
  req: TypeUZRequest<undefined, undefined, TagIdPathParams>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagId } = req.params;

  await UserDAL.removeTagPb(uid, tagId);
  return new TypeUZResponse("Tag PB cleared", null);
}

export async function editTag(
  req: TypeUZRequest<undefined, EditTagRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagId, newName } = req.body;

  await UserDAL.editTag(uid, tagId, newName);
  return new TypeUZResponse("Tag updated", null);
}

export async function removeTag(
  req: TypeUZRequest<undefined, undefined, TagIdPathParams>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagId } = req.params;

  await UserDAL.removeTag(uid, tagId);
  return new TypeUZResponse("Tag deleted", null);
}

export async function getTags(req: TypeUZRequest): Promise<GetTagsResponse> {
  const { uid } = req.ctx.decodedToken;

  const tags = await UserDAL.getTags(uid);
  return new TypeUZResponse("Tags retrieved", replaceObjectIds(tags));
}

export async function updateLbMemory(
  req: TypeUZRequest<undefined, UpdateLeaderboardMemoryRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { mode, language, rank } = req.body;
  const mode2 = req.body.mode2;

  await UserDAL.updateLbMemory(uid, mode, mode2, language, rank);
  return new TypeUZResponse("Leaderboard memory updated", null);
}

export async function getCustomThemes(
  req: TypeUZRequest,
): Promise<GetCustomThemesResponse> {
  const { uid } = req.ctx.decodedToken;
  const customThemes = await UserDAL.getThemes(uid);
  const mapped = customThemes.map((t) => ({
    _id: t._id,
    name: t.name,
    colors: t.colors as [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ],
  }));
  return new TypeUZResponse("Custom themes retrieved", mapped);
}

export async function addCustomTheme(
  req: TypeUZRequest<undefined, AddCustomThemeRequest>,
): Promise<AddCustomThemeResponse> {
  const { uid } = req.ctx.decodedToken;
  const { name, colors } = req.body;

  const addedTheme = await UserDAL.addTheme(uid, { name, colors });
  return new TypeUZResponse("Custom theme added", replaceObjectId(addedTheme));
}

export async function removeCustomTheme(
  req: TypeUZRequest<undefined, DeleteCustomThemeRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { themeId } = req.body;
  await UserDAL.removeTheme(uid, themeId);
  return new TypeUZResponse("Custom theme removed", null);
}

export async function editCustomTheme(
  req: TypeUZRequest<undefined, EditCustomThemeRequst>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { themeId, theme } = req.body;

  await UserDAL.editTheme(uid, themeId, theme);
  return new TypeUZResponse("Custom theme updated", null);
}

export async function getPersonalBests(
  req: TypeUZRequest<GetPersonalBestsQuery>,
): Promise<GetPersonalBestsResponse> {
  const { uid } = req.ctx.decodedToken;
  const { mode, mode2 } = req.query;

  const data = (await UserDAL.getPersonalBests(uid, mode, mode2)) ?? null;
  return new TypeUZResponse("Personal bests retrieved", data as never);
}

export async function getStats(req: TypeUZRequest): Promise<GetStatsResponse> {
  const { uid } = req.ctx.decodedToken;

  const data = (await UserDAL.getStats(uid)) ?? null;
  return new TypeUZResponse("Personal stats retrieved", data);
}

export async function getFavoriteQuotes(
  req: TypeUZRequest,
): Promise<GetFavoriteQuotesResponse> {
  const { uid } = req.ctx.decodedToken;

  const quotes = await UserDAL.getFavoriteQuotes(uid);

  return new TypeUZResponse("Favorite quotes retrieved", quotes);
}

export async function addFavoriteQuote(
  req: TypeUZRequest<undefined, AddFavoriteQuoteRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;

  const { language, quoteId } = req.body;

  await UserDAL.addFavoriteQuote(
    uid,
    language,
    quoteId,
    req.ctx.configuration.quotes.maxFavorites,
  );

  return new TypeUZResponse("Quote added to favorites", null);
}

export async function removeFavoriteQuote(
  req: TypeUZRequest<undefined, RemoveFavoriteQuoteRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;

  const { quoteId, language } = req.body;
  await UserDAL.removeFavoriteQuote(uid, language, quoteId);

  return new TypeUZResponse("Quote removed from favorites", null);
}

export async function getProfile(
  req: TypeUZRequest<GetProfileQuery, undefined, GetProfilePathParams>,
): Promise<GetProfileResponse> {
  const { uidOrName } = req.params;

  const user = req.query.isUid
    ? await UserDAL.getUser(uidOrName, "get user profile")
    : await UserDAL.getUserByName(uidOrName, "get user profile");

  const {
    name,
    banned,
    inventory,
    profileDetails,
    personalBests,
    completedTests,
    startedTests,
    timeTyping,
    addedAt,
    discordId,
    discordAvatar,
    xp,
    streak,
    lbOptOut,
    gender,
    age,
    avatar,
  } = user;

  const extractValid = (
    src: Record<string, PersonalBest[]>,
    validKeys: string[],
  ): Record<string, PersonalBest[]> => {
    return validKeys.reduce((obj, key) => {
      if (src?.[key] !== undefined) {
        obj[key] = src[key];
      }
      return obj;
    }, {});
  };

  const validTimePbs = extractValid(personalBests.time, [
    "15",
    "30",
    "60",
    "120",
  ]);
  const validWordsPbs = extractValid(personalBests.words, [
    "10",
    "25",
    "50",
    "100",
  ]);

  const typingStats = {
    completedTests,
    startedTests,
    timeTyping,
  };

  const relevantPersonalBests = {
    time: validTimePbs,
    words: validWordsPbs,
  };

  const baseProfile = {
    name,
    banned,
    addedAt,
    typingStats,
    personalBests: relevantPersonalBests,
    discordId,
    discordAvatar,
    xp,
    streak: streak?.length ?? 0,
    maxStreak: streak?.maxLength ?? 0,
    lbOptOut,
    isPremium: await UserDAL.checkIfUserIsPremium(user.uid, user),
    gender,
    age,
    avatar,
  };

  if (banned) {
    return new TypeUZResponse("Profile retrived: banned user", baseProfile);
  }

  const allTimeLbs = await getAllTimeLbs(user.uid);

  const profileData = {
    ...baseProfile,
    inventory,
    details: profileDetails,
    allTimeLbs,
    uid: user.uid,
  } as UserProfile;

  if (user.profileDetails?.showActivityOnPublicProfile) {
    profileData.testActivity = generateCurrentTestActivity(user.testActivity);
  } else {
    delete profileData.testActivity;
  }
  return new TypeUZResponse("Profile retrieved", profileData);
}

export async function updateProfile(
  req: TypeUZRequest<undefined, UpdateUserProfileRequest>,
): Promise<UpdateUserProfileResponse> {
  const { uid } = req.ctx.decodedToken;
  const {
    bio,
    keyboard,
    socialProfiles,
    selectedBadgeId,
    showActivityOnPublicProfile,
  } = req.body;

  const user = await UserDAL.getPartialUser(uid, "update user profile", [
    "banned",
    "inventory",
  ]);

  if (user.banned) {
    throw new TypeUZError(403, "Banned users cannot update their profile");
  }

  user.inventory?.badges.forEach((badge) => {
    if (badge.id === selectedBadgeId) {
      badge.selected = true;
    } else {
      delete badge.selected;
    }
  });

  const profileDetailsUpdates: Partial<UserProfileDetails> = {
    bio: sanitizeString(bio),
    keyboard: sanitizeString(keyboard),
    socialProfiles: Object.fromEntries(
      Object.entries(socialProfiles ?? {}).map(([key, value]) => [
        key,
        sanitizeString(value),
      ]),
    ),
    showActivityOnPublicProfile,
  };

  await UserDAL.updateProfile(uid, profileDetailsUpdates, user.inventory);

  return new TypeUZResponse("Profile updated", profileDetailsUpdates);
}

export async function updateProfileDetails(
  req: TypeUZRequest<undefined, UpdateProfileDetailsRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const body = req.body as Record<string, unknown>;

  const updates: Record<string, unknown> = {};
  if (body["firstName"] !== undefined) updates["firstName"] = body["firstName"];
  if (body["lastName"] !== undefined) updates["lastName"] = body["lastName"];
  if (body["gender"] !== undefined) updates["gender"] = body["gender"];
  if (body["age"] !== undefined) updates["age"] = body["age"];
  if (body["avatar"] !== undefined) updates["avatar"] = body["avatar"];

  if (Object.keys(updates).length === 0) {
    return new TypeUZResponse("Hech qanday o'zgarish kiritilmadi", null);
  }

  await UserDAL.updateProfileDetails(uid, updates);

  return new TypeUZResponse("Profil yangilandi", null);
}

export async function getInbox(
  req: TypeUZRequest,
): Promise<GetUserInboxResponse> {
  const { uid } = req.ctx.decodedToken;

  const inbox = await UserDAL.getInbox(uid);

  return new TypeUZResponse("Inbox retrieved", {
    inbox,
    maxMail: req.ctx.configuration.users.inbox.maxMail,
  });
}

export async function updateInbox(
  req: TypeUZRequest<undefined, UpdateUserInboxRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { mailIdsToMarkRead, mailIdsToDelete } = req.body;

  await UserDAL.updateInbox(
    uid,
    mailIdsToMarkRead ?? [],
    mailIdsToDelete ?? [],
  );

  return new TypeUZResponse("Inbox updated", null);
}

export async function reportUser(
  req: TypeUZRequest<undefined, ReportUserRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const {
    reporting: { maxReports, contentReportLimit },
  } = req.ctx.configuration.quotes;

  const { uid: uidToReport, reason, comment, captcha } = req.body;

  await verifyCaptcha(captcha);

  const newReport: ReportDAL.DBReport = {
    id: uuidv4(),
    type: "user",
    timestamp: new Date().getTime(),
    uid,
    content_id: `${uidToReport}`,
    reason,
    comment: comment ?? "",
  };

  await ReportDAL.createReport(newReport, maxReports, contentReportLimit);

  return new TypeUZResponse("User reported", null);
}

export async function setStreakHourOffset(
  req: TypeUZRequest<undefined, SetStreakHourOffsetRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { hourOffset } = req.body;

  const user = await UserDAL.getPartialUser(uid, "update user profile", [
    "streak",
  ]);

  if (
    user.streak?.hourOffset !== undefined &&
    user.streak?.hourOffset !== null
  ) {
    throw new TypeUZError(403, "Streak hour offset already set");
  }

  await UserDAL.setStreakHourOffset(uid, hourOffset);

  void addImportantLog("user_streak_hour_offset_set", { hourOffset }, uid);

  return new TypeUZResponse("Streak hour offset set", null);
}

export async function revokeAllTokens(
  req: TypeUZRequest,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  if (req.ctx.decodedToken.customAuth === true) {
    if (!isDevEnvironment()) {
      await UserDAL.incrementTokenVersion(uid);
    }
  } else {
    await AuthUtil.revokeTokensByUid(uid);
  }
  void addImportantLog("user_tokens_revoked", "", uid);
  return new TypeUZResponse("All tokens revoked", null);
}

async function getAllTimeLbs(uid: string): Promise<AllTimeLbs> {
  const allTime15English = await LeaderboardsDAL.getRank(
    "time",
    "15",
    "english",
    uid,
  );

  const allTime15EnglishCount = await LeaderboardsDAL.getCount(
    "time",
    "15",
    "english",
  );

  const allTime60English = await LeaderboardsDAL.getRank(
    "time",
    "60",
    "english",
    uid,
  );

  const allTime60EnglishCount = await LeaderboardsDAL.getCount(
    "time",
    "60",
    "english",
  );

  const english15 =
    allTime15English === false || allTime15English === null
      ? undefined
      : {
          rank: allTime15English.rank,
          count: allTime15EnglishCount,
        };

  const english60 =
    allTime60English === false || allTime60English === null
      ? undefined
      : {
          rank: allTime60English.rank,
          count: allTime60EnglishCount,
        };

  return {
    time: {
      "15": {
        english: english15,
      },
      "60": {
        english: english60,
      },
    },
  };
}

export function generateCurrentTestActivity(
  testActivity: CountByYearAndDay | undefined,
): TestActivity | undefined {
  const thisYear = Dates.startOfYear(new UTCDateMini());
  const lastYear = Dates.startOfYear(Dates.subYears(thisYear, 1));

  let thisYearData = testActivity?.[thisYear.getFullYear().toString()];
  let lastYearData = testActivity?.[lastYear.getFullYear().toString()];

  if (lastYearData === undefined && thisYearData === undefined) {
    return undefined;
  }

  lastYearData = lastYearData ?? [];
  thisYearData = thisYearData ?? [];

  //make sure lastYearData covers the full year
  if (lastYearData.length < Dates.getDaysInYear(lastYear)) {
    lastYearData.push(
      ...(new Array(Dates.getDaysInYear(lastYear) - lastYearData.length).fill(
        undefined,
      ) as (number | null)[]),
    );
  }
  //use enough days of the last year to have 372 days in total to always fill the first week of the graph
  lastYearData = lastYearData.slice(-372 + thisYearData.length);

  const lastDay = Dates.startOfDay(
    Dates.addDays(thisYear, thisYearData.length - 1),
  );

  return {
    testsByDays: [...lastYearData, ...thisYearData],
    lastDay: lastDay.valueOf(),
  };
}

export async function getTestActivity(
  req: TypeUZRequest,
): Promise<GetTestActivityResponse> {
  const { uid } = req.ctx.decodedToken;
  const premiumFeaturesEnabled = req.ctx.configuration.users.premium.enabled;
  const user = await UserDAL.getPartialUser(uid, "testActivity", [
    "testActivity",
    "premium",
  ]);
  const userHasPremium = await UserDAL.checkIfUserIsPremium(uid, user);

  if (!premiumFeaturesEnabled) {
    throw new TypeUZError(503, "Premium features are disabled");
  }

  if (!userHasPremium) {
    throw new TypeUZError(503, "User does not have premium");
  }

  return new TypeUZResponse(
    "Test activity data retrieved",
    user.testActivity ?? null,
  );
}

async function firebaseDeleteUserIgnoreError(uid: string): Promise<void> {
  try {
    await AuthUtil.deleteUser(uid);
  } catch (e) {
    //ignore
  }
}

export async function getCurrentTestActivity(
  req: TypeUZRequest,
): Promise<GetCurrentTestActivityResponse> {
  const { uid } = req.ctx.decodedToken;

  const user = await UserDAL.getPartialUser(uid, "current test activity", [
    "testActivity",
  ]);
  const data = generateCurrentTestActivity(user.testActivity);
  return new TypeUZResponse(
    "Current test activity data retrieved",
    data ?? null,
  );
}

export async function getStreak(
  req: TypeUZRequest,
): Promise<GetStreakResponse> {
  const { uid } = req.ctx.decodedToken;

  const user = await UserDAL.getPartialUser(uid, "streak", ["streak"]);

  return new TypeUZResponse("Streak data retrieved", user.streak ?? null);
}

export async function getWeeklyAnalysis(
  req: TypeUZRequest,
): Promise<WeeklyAnalysisResponse> {
  const { uid } = req.ctx.decodedToken;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const results = await getResults(uid, {
    onOrAfterTimestamp: sevenDaysAgo,
  });

  if (results.length === 0) {
    return new TypeUZResponse("Haftalik tahlil", {
      avgWpm: 0,
      avgAccuracy: 0,
      totalTests: 0,
      totalTimeSeconds: 0,
      bestWpm: 0,
      bestWpmDate: "",
      trend: "stable",
      bestDay: "",
      dailyBreakdown: [],
      recommendation:
        "Tahlil uchun yetarlicha ma'lumot yo'q. Ko'proq test topshiring!",
    });
  }

  const dayNamesUz = [
    "Yakshanba",
    "Dushanba",
    "Seshanba",
    "Chorshanba",
    "Payshanba",
    "Juma",
    "Shanba",
  ];

  const dailyMap = new Map<
    string,
    { wpm: number[]; accuracy: number[]; tests: number; time: number }
  >();

  let bestWpm = 0;
  let bestWpmTimestamp = 0;
  let totalTimeSeconds = 0;

  for (const r of results) {
    const d = new Date(r.timestamp);
    const dateKey = d.toISOString().slice(0, 10);

    let day = dailyMap.get(dateKey);
    if (day === undefined) {
      day = { wpm: [], accuracy: [], tests: 0, time: 0 };
      dailyMap.set(dateKey, day);
    }
    day.wpm.push(r.wpm);
    day.accuracy.push(r.acc);
    day.tests++;
    day.time += r.testDuration;

    totalTimeSeconds += r.testDuration;

    if (r.wpm > bestWpm) {
      bestWpm = r.wpm;
      bestWpmTimestamp = r.timestamp;
    }
  }

  const sortedDates = Array.from(dailyMap.keys()).sort();
  const dailyBreakdown: WeeklyAnalysisDailyBreakdown[] = sortedDates.map(
    (date) => {
      const day = dailyMap.get(date);
      if (day === undefined) {
        return { date, wpm: 0, accuracy: 0, tests: 0 };
      }
      const avgW = day.wpm.reduce((a, b) => a + b, 0) / day.wpm.length;
      const avgA =
        day.accuracy.reduce((a, b) => a + b, 0) / day.accuracy.length;
      return {
        date,
        wpm: Math.round(avgW * 10) / 10,
        accuracy: Math.round(avgA * 10) / 10,
        tests: day.tests,
      };
    },
  );

  const totalWpm = results.reduce((a, r) => a + r.wpm, 0);
  const totalAcc = results.reduce((a, r) => a + r.acc, 0);
  const avgWpm = Math.round((totalWpm / results.length) * 10) / 10;
  const avgAccuracy = Math.round((totalAcc / results.length) * 10) / 10;

  let trend: "improving" | "declining" | "stable" = "stable";
  if (sortedDates.length >= 2) {
    const firstHalf = sortedDates.slice(0, Math.floor(sortedDates.length / 2));
    const secondHalf = sortedDates.slice(Math.floor(sortedDates.length / 2));
    const calcDayAvg = (d: string): number => {
      const day = dailyMap.get(d);
      if (day === undefined) return 0;
      return day.wpm.reduce((x, y) => x + y, 0) / day.wpm.length;
    };
    const firstAvg =
      firstHalf.reduce((a, d) => a + calcDayAvg(d), 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((a, d) => a + calcDayAvg(d), 0) / secondHalf.length;
    if (secondAvg - firstAvg > 2) trend = "improving";
    else if (firstAvg - secondAvg > 2) trend = "declining";
  }

  let bestDay = "";
  let bestDayAvg = 0;
  for (const [date, day] of dailyMap) {
    const avg = day.wpm.reduce((a, b) => a + b, 0) / day.wpm.length;
    if (avg > bestDayAvg) {
      bestDayAvg = avg;
      const dayIndex = new Date(date).getDay();
      bestDay = dayNamesUz[dayIndex] ?? "";
    }
  }

  let recommendation = "";
  const user = await UserDAL.getUser(uid, "getWeeklyAnalysis");
  let aiUses = user?.aiUses ?? { date: "", count: 0 };
  const today = new Date().toISOString().slice(0, 10);
  if (aiUses.date !== today) {
    aiUses = { date: today, count: 0 };
  }

  const aiConfig = req.ctx.configuration.users.ai;
  if (
    aiConfig?.enabled &&
    aiConfig.apiKey &&
    aiUses.count < aiConfig.maxDailyUses
  ) {
    try {
      const prompt = `Men "TypeUZ (typeuz.uz)" foydalanuvchisiman. Mening haftalik yozish o'rtacha tezligim ${avgWpm} WPM, aniqligim ${avgAccuracy}%. Men 7 kun ichida jami ${results.length} ta test topshirdim va ${Math.round(totalTimeSeconds)} soniya sarfladim. Trendim: ${trend}. Eng zo'r tezligim: ${bestWpm} WPM bo'ldi. Menga shu natijalarim asosida o'zbek tilida motivatsion va foydali maslahat ber. Matn ichida natija raqamlarim ham ishtirok etsin va u juda ham qisqa bo'lsin.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiConfig.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      if (
        data?.candidates?.[0]?.content?.parts?.[0]?.text !== undefined &&
        data?.candidates?.[0]?.content?.parts?.[0]?.text !== ""
      ) {
        recommendation = data.candidates[0].content.parts[0].text.trim();
        aiUses.count++;
        await UserDAL.updateAiUses(uid, aiUses);
      } else {
        throw new Error("Invalid AI response");
      }
    } catch (e) {
      recommendation =
        "AI tahlil vaqtinchalik ishlamayapti. O'z ustingizda ishlashda davom eting!";
    }
  } else if (aiConfig?.enabled && aiUses.count >= aiConfig.maxDailyUses) {
    recommendation = `Siz bugungi AI tahlil limitiga (${aiConfig.maxDailyUses} marta) yetib keldingiz. Yaxshi natijalar! Erta yana ko'rishguncha.`;
  } else {
    if (avgWpm < 30) {
      recommendation =
        "Tezlikni oshirish uchun har kuni 5-10 daqiqa mashq qiling. Klaviaturada barmoqlarning to'g'ri joylashishiga e'tibor bering.";
    } else if (avgAccuracy < 90) {
      recommendation =
        "Aniqlikni oshirishga e'tibor qarating. Sekinroq yozing, lekin xatolarni kamaytiring. To'g'ri barmoq joylashuvi muhim.";
    } else if (dailyBreakdown.length < 3) {
      recommendation =
        "Haftada kamida 3-4 kun test topshirishni maqsad qiling. Muntazamlik tezlikni oshirishning kalitidir.";
    } else if (trend === "improving") {
      recommendation =
        "Yaxshi natija! Tezligingiz oshib bormoqda. Shu tartibda davom eting va yangi maqsadlar qo'ying.";
    } else if (trend === "declining") {
      recommendation =
        "Oxirgi kunlarda tezlik pasaygan. Dam olish va diqqatni jamlash uchun tanaffus qiling.";
    } else {
      recommendation =
        "Barqaror natijalar ko'rsatyapsiz. Tezlikni oshirish uchun turli xil matnlar bilan mashq qilib ko'ring.";
    }
  }

  return new TypeUZResponse("Haftalik tahlil", {
    avgWpm,
    avgAccuracy,
    totalTests: results.length,
    totalTimeSeconds,
    bestWpm,
    bestWpmDate:
      bestWpmTimestamp > 0 ? new Date(bestWpmTimestamp).toISOString() : "",
    trend,
    bestDay,
    dailyBreakdown,
    recommendation,
  });
}

export async function getFriends(
  req: TypeUZRequest,
): Promise<GetFriendsResponse> {
  const { uid } = req.ctx.decodedToken;
  const premiumEnabled = req.ctx.configuration.users.premium.enabled;
  const data = await UserDAL.getFriends(uid);

  if (!premiumEnabled) {
    for (const friend of data) {
      delete friend.isPremium;
    }
  }

  return new TypeUZResponse("Friends retrieved", data);
}
