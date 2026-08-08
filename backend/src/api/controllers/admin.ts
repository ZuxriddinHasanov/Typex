import crypto from "crypto";
import { TypeUZResponse } from "../../utils/typeuz-response";
import { buildMonkeyMail } from "../../utils/monkey-mail";
import * as UserDAL from "../../dal/user";
import * as ReportDAL from "../../dal/report";
import Logger from "../../utils/logger";
import emailQueue from "../../queues/email-queue";
import { isInitialized as isEmailClientInitialized } from "../../init/email-client";
import {
  AcceptReportsRequest,
  AddCreativeRequest,
  AdminAnalyticsResponse,
  AdminActivityResponse,
  AdminSearchUsersQuery,
  AdminSearchUsersResponse,
  ClearStreakHourOffsetRequest,
  DeleteCreativeParams,
  RejectReportsRequest,
  SendForgotPasswordEmailRequest,
  SendNotificationRequest,
  ToggleBanRequest,
  ToggleBanResponse,
  UpdateAdConfigRequest,
  DeleteUserRequest,
} from "@typeuz/contracts/admin";
import TypeUZError, { getErrorMessage } from "../../utils/error";
import { Configuration } from "@typeuz/schemas/configuration";
import { addImportantLog } from "../../dal/logs";
import * as db from "../../init/db";
import { TypeUZRequest } from "../types";
import { isDevEnvironment, getFrontendUrl } from "../../utils/misc";
import { devGet, devSet } from "../../utils/dev-store";

// --- Analytics Helpers ---
function getUsersArray(): Array<Record<string, unknown>> {
  return devGet<Array<Record<string, unknown>>>("users") ?? [];
}

export async function getDau(
  _req: TypeUZRequest,
): Promise<TypeUZResponse<Array<{ date: string; count: number }>>> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const log = (
    devGet<Array<{ uid: string; timestamp: number }>>("login_log") ?? []
  ).filter((e) => e.timestamp >= thirtyDaysAgo);
  const dayMap = new Map<string, number>();
  for (const e of log) {
    const d = new Date(e.timestamp).toISOString().slice(0, 10);
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
  }
  const data = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return new TypeUZResponse("DAU data", data);
}

export async function getRetention(
  _req: TypeUZRequest,
): Promise<TypeUZResponse<{ day1: number; day7: number; day30: number }>> {
  const users = getUsersArray();
  const now = Date.now();
  let returned1 = 0;
  let returned7 = 0;
  let returned30 = 0;
  let totalOld1 = 0;
  let totalOld7 = 0;
  let totalOld30 = 0;
  for (const u of users) {
    const addedAt = u["addedAt"] as number | undefined;
    if (addedAt === undefined) continue;
    const daysSinceJoin = (now - addedAt) / (24 * 60 * 60 * 1000);
    const lastLogin = (u["lastLoginAt"] as number) ?? addedAt;
    if (daysSinceJoin >= 1) {
      totalOld1++;
      if (lastLogin > addedAt + 86400000) returned1++;
    }
    if (daysSinceJoin >= 7) {
      totalOld7++;
      if (lastLogin > addedAt + 7 * 86400000) returned7++;
    }
    if (daysSinceJoin >= 30) {
      totalOld30++;
      if (lastLogin > addedAt + 30 * 86400000) returned30++;
    }
  }
  return new TypeUZResponse("Retention data", {
    day1: totalOld1 > 0 ? Math.round((returned1 / totalOld1) * 100) : 0,
    day7: totalOld7 > 0 ? Math.round((returned7 / totalOld7) * 100) : 0,
    day30: totalOld30 > 0 ? Math.round((returned30 / totalOld30) * 100) : 0,
  });
}

export async function getWpmDistribution(
  _req: TypeUZRequest,
): Promise<TypeUZResponse<Array<{ range: string; count: number }>>> {
  const users = getUsersArray();
  const buckets = new Map<string, number>();
  const ranges = ["0-20", "21-40", "41-60", "61-80", "81-100", "100+"];
  for (const r of ranges) buckets.set(r, 0);
  for (const u of users) {
    const pbs = u["pbs"] as Record<string, unknown> | undefined;
    if (pbs === undefined) continue;
    for (const val of Object.values(pbs)) {
      const wpm = (val as { wpm?: number })?.wpm ?? 0;
      if (wpm <= 20) {
        buckets.set("0-20", (buckets.get("0-20") ?? 0) + 1);
      } else if (wpm <= 40) {
        buckets.set("21-40", (buckets.get("21-40") ?? 0) + 1);
      } else if (wpm <= 60) {
        buckets.set("41-60", (buckets.get("41-60") ?? 0) + 1);
      } else if (wpm <= 80) {
        buckets.set("61-80", (buckets.get("61-80") ?? 0) + 1);
      } else if (wpm <= 100) {
        buckets.set("81-100", (buckets.get("81-100") ?? 0) + 1);
      } else {
        buckets.set("100+", (buckets.get("100+") ?? 0) + 1);
      }
      break;
    }
  }
  const data = Array.from(buckets.entries()).map(([range, count]) => ({
    range,
    count,
  }));
  return new TypeUZResponse("WPM distribution", data);
}

export async function getTopUsers(_req: TypeUZRequest): Promise<
  TypeUZResponse<
    Array<{
      uid: string;
      name: string;
      wpm: number;
      accuracy?: number;
      tests: number;
    }>
  >
> {
  const users = getUsersArray();
  const scored = users
    .map((u) => {
      const pbs = u["pbs"] as
        | Record<string, { wpm?: number; accuracy?: number }>
        | undefined;
      let bestWpm = 0;
      let bestAcc = 0;
      if (pbs) {
        for (const val of Object.values(pbs)) {
          if ((val.wpm ?? 0) > bestWpm) {
            bestWpm = val.wpm ?? 0;
            bestAcc = val.accuracy ?? 0;
          }
        }
      }
      return {
        uid: (u["uid"] as string) ?? "",
        name: (u["name"] as string) ?? "",
        wpm: bestWpm,
        accuracy: bestAcc || undefined,
        tests: (u["completedTests"] as number) ?? 0,
      };
    })
    .filter((u) => u.wpm > 0)
    .sort((a, b) => b.wpm - a.wpm)
    .slice(0, 20);
  return new TypeUZResponse("Top users", scored);
}

export async function getUserGrowth(
  _req: TypeUZRequest,
): Promise<
  TypeUZResponse<Array<{ date: string; total: number; newUsers: number }>>
> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const users = getUsersArray().filter(
    (u) => ((u["addedAt"] as number) ?? 0) >= thirtyDaysAgo,
  );
  const dayMap = new Map<string, { total: number; newUsers: number }>();
  let runningTotal = users.length;
  for (const u of users.reverse()) {
    const d = new Date((u["addedAt"] as number) ?? 0)
      .toISOString()
      .slice(0, 10);
    const prev = dayMap.get(d) ?? { total: 0, newUsers: 0 };
    dayMap.set(d, { total: runningTotal--, newUsers: prev.newUsers + 1 });
  }
  const data = Array.from(dayMap.entries())
    .map(([date, val]) => ({ date, total: val.total, newUsers: val.newUsers }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return new TypeUZResponse("User growth", data);
}

function safeImportantLog(
  event: string,
  msg: Record<string, unknown>,
  uid: string,
): void {
  try {
    void addImportantLog(event, msg, uid);
  } catch (_e: unknown) {
    void _e;
  }
}

async function safeUserDAL<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (_e: unknown) {
    void _e;
    return fallback;
  }
}

export async function test(_req: TypeUZRequest): Promise<TypeUZResponse> {
  return new TypeUZResponse("OK", null);
}

export async function toggleBan(
  req: TypeUZRequest<undefined, ToggleBanRequest>,
): Promise<ToggleBanResponse> {
  const { uid } = req.body;

  try {
    if (isDevEnvironment()) {
      const users = devGet<Array<Record<string, unknown>>>("users") ?? [];
      const idx = users.findIndex((u) => u["uid"] === uid);
      if (idx === -1) throw new TypeUZError(404, "Foydalanuvchi topilmadi");
      const banned = !(users[idx]?.["banned"] as boolean);
      users[idx] = { ...(users[idx] ?? {}), banned };
      devSet("users", users);
      safeImportantLog("user_ban_toggled", { banned }, uid);
      return new TypeUZResponse(`Ban toggled`, { banned });
    }

    const user = await safeUserDAL(
      async () =>
        UserDAL.getPartialUser(uid, "toggle ban", ["banned", "discordId"]),
      { banned: false, discordId: "" },
    );

    await UserDAL.setBanned(uid, !user.banned).catch((_e: unknown) => {
      void _e;
    });
    safeImportantLog("user_ban_toggled", { banned: !user.banned }, uid);

    return new TypeUZResponse(`Ban toggled`, {
      banned: !user.banned,
    });
  } catch (e) {
    if (e instanceof TypeUZError) throw e;
    throw new TypeUZError(500, "Failed to toggle ban");
  }
}

export async function deleteUser(
  req: TypeUZRequest<undefined, DeleteUserRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.body;

  try {
    if (isDevEnvironment()) {
      let users = devGet<Array<Record<string, unknown>>>("users") ?? [];
      const userExists = users.some((u) => u["uid"] === uid);
      if (!userExists) throw new TypeUZError(404, "Foydalanuvchi topilmadi");

      users = users.filter((u) => u["uid"] !== uid);
      devSet("users", users);
      safeImportantLog("admin_user_deleted", {}, uid);
      return new TypeUZResponse(`User deleted`, null);
    }

    await UserDAL.deleteUser(uid);
    safeImportantLog("admin_user_deleted", {}, uid);
    return new TypeUZResponse(`User deleted`, null);
  } catch (e) {
    if (e instanceof TypeUZError) throw e;
    throw new TypeUZError(500, "Failed to delete user");
  }
}

export async function clearStreakHourOffset(
  req: TypeUZRequest<undefined, ClearStreakHourOffsetRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.body;

  try {
    if (isDevEnvironment()) {
      const users = devGet<Array<Record<string, unknown>>>("users") ?? [];
      const idx = users.findIndex((u) => u["uid"] === uid);
      if (idx !== -1 && users[idx] !== undefined) {
        users[idx] = { ...(users[idx] ?? {}), streakHourOffset: undefined };
        devSet("users", users);
      }
      safeImportantLog("admin_streak_hour_offset_cleared_by", {}, uid);
      return new TypeUZResponse("Streak hour offset cleared", null);
    }

    await UserDAL.clearStreakHourOffset(uid).catch((_e: unknown) => {
      void _e;
    });
    safeImportantLog("admin_streak_hour_offset_cleared_by", {}, uid);
    return new TypeUZResponse("Streak hour offset cleared", null);
  } catch (e) {
    throw new TypeUZError(
      500,
      `Failed to clear streak hour offset: ${getErrorMessage(e)}`,
    );
  }
}

export async function acceptReports(
  req: TypeUZRequest<undefined, AcceptReportsRequest>,
): Promise<TypeUZResponse> {
  await handleReports(
    req.body.reports.map((it) => ({ ...it })),
    true,
    req.ctx.configuration.users.inbox,
  );
  return new TypeUZResponse("Reports removed and users notified.", null);
}

export async function rejectReports(
  req: TypeUZRequest<undefined, RejectReportsRequest>,
): Promise<TypeUZResponse> {
  await handleReports(
    req.body.reports.map((it) => ({ ...it })),
    false,
    req.ctx.configuration.users.inbox,
  );
  return new TypeUZResponse("Reports removed and users notified.", null);
}

export async function handleReports(
  reports: { reportId: string; reason?: string }[],
  accept: boolean,
  inboxConfig: Configuration["users"]["inbox"],
): Promise<void> {
  const reportIds = reports.map(({ reportId }) => reportId);

  const reportsFromDb = await ReportDAL.getReports(reportIds);
  const reportById = new Map(reportsFromDb.map((it) => [it.id, it]));

  const existingReportIds = new Set(reportsFromDb.map((report) => report.id));
  const missingReportIds = reportIds.filter(
    (reportId) => !existingReportIds.has(reportId),
  );

  if (missingReportIds.length > 0) {
    throw new TypeUZError(
      404,
      `Reports not found for some IDs ${missingReportIds.join(",")}`,
    );
  }

  await ReportDAL.deleteReports(reportIds);

  for (const { reportId, reason } of reports) {
    try {
      const report = reportById.get(reportId);
      if (!report) {
        throw new TypeUZError(404, `Report not found for ID: ${reportId}`);
      }

      let mailBody = "";
      if (accept) {
        mailBody = `Your report regarding ${report.type} ${
          (report as Record<string, unknown>)["content_id"]
        } (${report.reason.toLowerCase()}) has been approved. Thank you.`;
      } else {
        mailBody = `Sorry, but your report regarding ${report.type} ${
          (report as Record<string, unknown>)["content_id"]
        } (${report.reason.toLowerCase()}) has been denied. ${
          reason !== undefined ? `\nReason: ${reason}` : ""
        }`;
      }

      const mailSubject = accept ? "Report approved" : "Report denied";
      const mail = buildMonkeyMail({
        subject: mailSubject,
        body: mailBody,
      });
      await UserDAL.addToInbox(report.uid, [mail], inboxConfig);
    } catch (e) {
      if (e instanceof TypeUZError) {
        throw new TypeUZError(e.status, e.message);
      } else {
        throw new TypeUZError(
          500,
          `Error handling reports: ${getErrorMessage(e)}`,
        );
      }
    }
  }
}

export async function getAnalytics(
  _req: TypeUZRequest,
): Promise<AdminAnalyticsResponse> {
  let totalUsers = 0;
  let totalTestsStarted = 0;
  let totalTestsCompleted = 0;
  let totalTimeTyping = 0;
  let activeUsersLast24h = 0;

  if (isDevEnvironment()) {
    const cached = devGet<AdminAnalyticsResponse["data"]>("admin_analytics");
    const byEmail =
      devGet<Record<string, { uid: string; email: string; name: string }>>(
        "users_by_email",
      );
    const userCount = byEmail !== null ? Object.keys(byEmail).length : 0;
    if (cached !== null) {
      return new TypeUZResponse("Analytics retrieved", {
        ...cached,
        totalUsers: cached.totalUsers || userCount,
      });
    }
    return new TypeUZResponse("Analytics retrieved", {
      totalUsers: userCount,
      totalTestsStarted: 0,
      totalTestsCompleted: 0,
      totalTimeTyping: 0,
      activeUsersLast24h: 0,
    });
  }

  try {
    const [userCountResult, publicStatsResult, activeUsersResult] =
      await Promise.all([
        db.queryOne<{ count: number }>(
          "SELECT COUNT(*)::int AS count FROM users",
        ),
        db.queryOne<{ data: unknown }>(
          "SELECT data FROM public_stats WHERE _id = 'stats'",
        ),
        db.queryOne<{ count: number }>(
          "SELECT COUNT(*)::int AS count FROM users WHERE last_login_at > $1",
          [Date.now() - 24 * 60 * 60 * 1000],
        ),
      ]);

    totalUsers = userCountResult?.count ?? 0;
    const statsData = publicStatsResult?.data as
      | Record<string, unknown>
      | undefined;
    totalTestsStarted = (statsData?.["testsStarted"] as number) ?? 0;
    totalTestsCompleted = (statsData?.["testsCompleted"] as number) ?? 0;
    totalTimeTyping = (statsData?.["timeTyping"] as number) ?? 0;
    activeUsersLast24h = activeUsersResult?.count ?? 0;
  } catch {
    // Return zeros if DB unavailable
  }

  return new TypeUZResponse("Analytics retrieved", {
    totalUsers,
    totalTestsStarted,
    totalTestsCompleted,
    totalTimeTyping,
    activeUsersLast24h,
  });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function maskEmail(email: string): string {
  const parts = email.split("@");
  const local = parts[0];
  const domain = parts[1];
  if (domain === undefined || local === undefined || local === "") return email;
  if (local.length <= 3) {
    return `${local.charAt(0)}***@${domain}`;
  }
  return `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
}

export async function searchUsers(
  req: TypeUZRequest<AdminSearchUsersQuery>,
): Promise<AdminSearchUsersResponse> {
  const { q } = req.query;
  const results: AdminSearchUsersResponse["data"] = [];

  if (isDevEnvironment()) {
    const byEmail =
      devGet<Record<string, { uid: string; email: string; name: string }>>(
        "users_by_email",
      );
    if (byEmail !== null) {
      const lower = q.toLowerCase();
      const filtered = Object.values(byEmail).filter(
        (u) =>
          u.uid.toLowerCase().includes(lower) ||
          u.name.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower),
      );
      return new TypeUZResponse(
        "Users retrieved",
        filtered.map((u) => ({ ...u, email: maskEmail(u.email) })),
      );
    }
    return new TypeUZResponse("Users retrieved", []);
  }

  try {
    const safeQ = escapeRegex(q);
    const users = await db
      .collection("users")
      .find(
        {
          $or: [
            { uid: { $regex: safeQ, $options: "i" } },
            { name: { $regex: safeQ, $options: "i" } },
            { email: { $regex: safeQ, $options: "i" } },
          ],
        },
        {
          projection: {
            uid: 1,
            name: 1,
            email: 1,
            banned: 1,
            addedAt: 1,
            completedTests: 1,
            timeTyping: 1,
          },
        },
      )
      .limit(50)
      .toArray();

    const mappedUsers = users.map((u) => {
      const r = u;
      return {
        uid: r["uid"] as string,
        name: r["name"] as string,
        email: maskEmail(r["email"] as string),
        banned: r["banned"] as boolean | undefined,
        addedAt: r["addedAt"] as number | undefined,
        completedTests: r["completedTests"] as number | undefined,
        timeTyping: r["timeTyping"] as number | undefined,
      };
    });
    results.push(...mappedUsers);
  } catch (e) {
    Logger.error(`searchUsers error: ${getErrorMessage(e)}`);
  }

  return new TypeUZResponse("Users retrieved", results);
}

export async function getActivity(
  _req: TypeUZRequest,
): Promise<AdminActivityResponse> {
  if (isDevEnvironment()) {
    const cached = devGet<AdminActivityResponse["data"]>("admin_activity");
    if (cached !== null) {
      return new TypeUZResponse("Activity retrieved", cached);
    }
    return new TypeUZResponse("Activity retrieved", { data: [] });
  }

  try {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const rawResults = await db.queryAll<{
      login_date: string;
      tests: number;
      users: number;
    }>(
      `SELECT
        to_timestamp(last_login_at / 1000)::date::text AS login_date,
        SUM(COALESCE(completed_tests, 0))::int AS tests,
        COUNT(*)::int AS users
      FROM users
      WHERE last_login_at >= $1
      GROUP BY login_date
      ORDER BY login_date ASC
      LIMIT 30`,
      [sevenDaysAgo],
    );

    const data = rawResults.map((r) => ({
      date: r.login_date,
      tests: r.tests,
      users: r.users,
    }));

    return new TypeUZResponse("Activity retrieved", { data });
  } catch {
    return new TypeUZResponse("Activity retrieved", { data: [] });
  }
}

export async function sendNotification(
  req: TypeUZRequest<undefined, SendNotificationRequest>,
): Promise<TypeUZResponse> {
  const { uid, subject, body } = req.body;
  const sendToAll = uid === "*";

  try {
    if (isDevEnvironment()) {
      const allUsers =
        devGet<Record<string, { uid: string; email: string; name: string }>>(
          "users_by_email",
        ) ?? {};
      const uids = sendToAll
        ? Object.values(allUsers).map((u) => u.uid)
        : [uid];

      const inbox =
        devGet<
          Array<{
            id: string;
            uid: string;
            subject: string;
            body: string;
            timestamp: number;
            read: boolean;
          }>
        >("admin_notifications") ?? [];

      for (const targetUid of uids) {
        inbox.push({
          id: crypto.randomUUID(),
          uid: targetUid,
          subject,
          body,
          timestamp: Date.now(),
          read: false,
        });
      }
      devSet("admin_notifications", inbox);
      safeImportantLog(
        "admin_notification_sent",
        { uid: sendToAll ? "*" : uid, subject, count: uids.length },
        uid,
      );
      return new TypeUZResponse(
        `Xabar ${sendToAll ? `barcha ${uids.length} foydalanuvchiga` : "yuborildi"}`,
        null,
      );
    }

    if (!sendToAll) {
      const mail = buildMonkeyMail({ subject, body });
      const config = { enabled: true, maxMail: 100 };
      await UserDAL.addToInbox(uid, [mail], config).catch((_e: unknown) => {
        void _e;
      });
    }
    safeImportantLog(
      "admin_notification_sent",
      { uid: sendToAll ? "*" : uid, subject },
      uid,
    );

    return new TypeUZResponse("Xabar yuborildi", null);
  } catch (e) {
    throw new TypeUZError(
      500,
      `Failed to send notification: ${getErrorMessage(e)}`,
    );
  }
}

export async function getAdConfig(_req: TypeUZRequest): Promise<
  TypeUZResponse<{
    enabled: boolean;
    masterToggle: boolean;
    slots: Array<{
      slotId: string;
      creativeId?: string;
      imageUrl?: string;
      targetUrl?: string;
      enabled: boolean;
    }>;
    creatives: Array<{
      id: string;
      imageUrl: string;
      targetUrl: string;
      enabled?: boolean;
    }>;
  }>
> {
  if (isDevEnvironment()) {
    const ads = devGet<{
      enabled: boolean;
      masterToggle: boolean;
      slots: Array<{
        slotId: string;
        creativeId?: string;
        imageUrl?: string;
        targetUrl?: string;
        enabled: boolean;
      }>;
      creatives: Array<{
        id: string;
        imageUrl: string;
        targetUrl: string;
        enabled?: boolean;
      }>;
    }>("ad_config");
    if (ads !== null) {
      return new TypeUZResponse("Ad config retrieved", ads);
    }
    const defaultConfig = {
      enabled: false,
      masterToggle: false,
      slots: [] as Array<{
        slotId: string;
        creativeId?: string;
        imageUrl?: string;
        targetUrl?: string;
        enabled: boolean;
      }>,
      creatives: [] as Array<{
        id: string;
        imageUrl: string;
        targetUrl: string;
        enabled?: boolean;
      }>,
    };
    return new TypeUZResponse("Ad config retrieved", defaultConfig);
  }

  try {
    const row = await db.queryOne<{ data: unknown }>(
      "SELECT data FROM configuration WHERE _id = 'ads'",
    );
    if (row?.data === undefined || row.data === null) {
      return new TypeUZResponse("Ad config retrieved", {
        enabled: false,
        masterToggle: false,
        slots: [],
        creatives: [],
      });
    }
    const ads = row.data as {
      enabled: boolean;
      masterToggle: boolean;
      slots: Array<{
        slotId: string;
        creativeId?: string;
        imageUrl?: string;
        targetUrl?: string;
        enabled: boolean;
      }>;
      creatives: Array<{
        id: string;
        imageUrl: string;
        targetUrl: string;
        enabled?: boolean;
      }>;
    };
    return new TypeUZResponse("Ad config retrieved", ads);
  } catch {
    return new TypeUZResponse("Ad config retrieved", {
      enabled: false,
      masterToggle: false,
      slots: [],
      creatives: [],
    });
  }
}

export async function updateAdConfig(
  req: TypeUZRequest<undefined, UpdateAdConfigRequest>,
): Promise<
  TypeUZResponse<{
    enabled: boolean;
    masterToggle: boolean;
    slots: Array<{
      slotId: string;
      creativeId?: string;
      imageUrl?: string;
      targetUrl?: string;
      enabled: boolean;
    }>;
    creatives: Array<{
      id: string;
      imageUrl: string;
      targetUrl: string;
      enabled?: boolean;
    }>;
  }>
> {
  const config = req.body;

  if (isDevEnvironment()) {
    devSet("ad_config", config);
    safeImportantLog(
      "admin_ad_config_updated",
      {},
      req.ctx.decodedToken?.uid ?? "",
    );
    return new TypeUZResponse("Ad config updated", config);
  }

  try {
    await db
      .collection("configuration")
      .replaceOne({ _id: "ads" }, { _id: "ads", ...config }, { upsert: true });
    safeImportantLog(
      "admin_ad_config_updated",
      {},
      req.ctx.decodedToken?.uid ?? "",
    );
    return new TypeUZResponse("Ad config updated", config);
  } catch {
    throw new TypeUZError(500, "Failed to update ad config");
  }
}

export async function addCreative(
  req: TypeUZRequest<undefined, AddCreativeRequest>,
): Promise<
  TypeUZResponse<{
    id: string;
    imageUrl: string;
    targetUrl: string;
    enabled?: boolean;
  }>
> {
  const { imageUrl, targetUrl } = req.body;
  const newCreative = {
    id: crypto.randomUUID(),
    imageUrl,
    targetUrl,
    enabled: true,
  };

  if (isDevEnvironment()) {
    const ads = devGet<{
      enabled: boolean;
      masterToggle: boolean;
      slots: Array<{
        slotId: string;
        creativeId?: string;
        imageUrl?: string;
        targetUrl?: string;
        enabled: boolean;
      }>;
      creatives: Array<{
        id: string;
        imageUrl: string;
        targetUrl: string;
        enabled?: boolean;
      }>;
    }>("ad_config") ?? {
      enabled: false,
      masterToggle: false,
      slots: [],
      creatives: [],
    };
    ads.creatives.push(newCreative);
    devSet("ad_config", ads);
    safeImportantLog(
      "admin_creative_added",
      { id: newCreative.id },
      req.ctx.decodedToken?.uid ?? "",
    );
    return new TypeUZResponse("Creative added", newCreative);
  }

  try {
    await db.collection("configuration").updateOne(
      { _id: "ads" },
      {
        $push: { creatives: newCreative },
      },
      { upsert: true },
    );
    safeImportantLog(
      "admin_creative_added",
      { id: newCreative.id },
      req.ctx.decodedToken?.uid ?? "",
    );
    return new TypeUZResponse("Creative added", newCreative);
  } catch {
    throw new TypeUZError(500, "Failed to add creative");
  }
}

export async function deleteCreative(
  req: TypeUZRequest<undefined, undefined, DeleteCreativeParams>,
): Promise<TypeUZResponse> {
  const { id } = req.params;

  if (isDevEnvironment()) {
    const ads = devGet<{
      enabled: boolean;
      masterToggle: boolean;
      slots: Array<{
        slotId: string;
        creativeId?: string;
        imageUrl?: string;
        targetUrl?: string;
        enabled: boolean;
      }>;
      creatives: Array<{
        id: string;
        imageUrl: string;
        targetUrl: string;
        enabled?: boolean;
      }>;
    }>("ad_config");
    if (ads !== null) {
      ads.creatives = ads.creatives.filter((c) => c.id !== id);
      devSet("ad_config", ads);
    }
    safeImportantLog(
      "admin_creative_deleted",
      { id },
      req.ctx.decodedToken?.uid ?? "",
    );
    return new TypeUZResponse("Creative deleted", null);
  }

  try {
    await db
      .collection("configuration")
      .updateOne({ _id: "ads" }, { $pull: { creatives: { id } } });
    safeImportantLog(
      "admin_creative_deleted",
      { id },
      req.ctx.decodedToken?.uid ?? "",
    );
    return new TypeUZResponse("Creative deleted", null);
  } catch {
    throw new TypeUZError(500, "Failed to delete creative");
  }
}

export async function sendForgotPasswordEmail(
  req: TypeUZRequest<undefined, SendForgotPasswordEmailRequest>,
): Promise<TypeUZResponse> {
  const { email } = req.body;

  try {
    const user = isDevEnvironment()
      ? ((devGet<Record<string, { uid: string; name: string; email: string }>>(
          "users_by_email",
        ) ?? {})[email.toLowerCase()] ?? null)
      : await UserDAL.findByEmail(email);
    if (!user) {
      return new TypeUZResponse("Parolni tiklash so'rovi qabul qilindi", null);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    if (isDevEnvironment()) {
      const resets =
        devGet<
          Record<string, { uid: string; token: string; expiresAt: number }>
        >("password_resets") ?? {};
      resets[resetToken] = { uid: user.uid, token: resetToken, expiresAt };
      devSet("password_resets", resets);
      Logger.info(
        `[DEV] Password reset for ${email}: ${getFrontendUrl()}/reset-password?token=${resetToken}`,
      );
    } else {
      const resetCollection = db.collection("password-resets") as unknown as {
        insertOne: (doc: Record<string, unknown>) => Promise<unknown>;
      };
      await resetCollection.insertOne({
        uid: user.uid,
        token: resetToken,
        expiresAt,
      });

      if (isEmailClientInitialized()) {
        await emailQueue.sendForgotPasswordEmail(
          email,
          user.name,
          `${getFrontendUrl()}/reset-password?token=${resetToken}`,
        );
      }
    }

    safeImportantLog(
      "admin_forgot_password_email",
      { email, uid: user.uid },
      req.ctx.decodedToken?.uid ?? "",
    );

    return new TypeUZResponse("Parolni tiklash so'rovi qabul qilindi", null);
  } catch (e) {
    Logger.error(`sendForgotPasswordEmail error: ${getErrorMessage(e)}`);
    return new TypeUZResponse("Parolni tiklash so'rovi qabul qilindi", null);
  }
}

// --- Site Content ---
type SiteContentData = {
  hero: { title: string; subtitle: string; description: string };
  features: Array<{ icon: string; title: string; description: string }>;
  aboutCards: Array<{ icon: string; title: string; description: string }>;
  footer: { brandName: string; tagline: string; telegram: string };
};

const SITE_CONTENT_KEY = "site_content";
const THEME_SETTINGS_KEY = "theme_settings";

const defaultSiteContent: SiteContentData = {
  hero: {
    title: "TypeUZ",
    subtitle: "Tez yozishni o'rganing",
    description:
      "O'zbekistonning birinchi yozuv tezligini o'lchash platformasi. Klaviaturada tez va aniq yozishni o'rganing.",
  },
  features: [
    {
      icon: "fa-tachometer-alt",
      title: "Tezlik",
      description: "Yozuv tezligingizni WPM da o'lchang",
    },
    {
      icon: "fa-chart-line",
      title: "Statistika",
      description: "Batafsil statistika va tahlillar",
    },
    {
      icon: "fa-trophy",
      title: "Reyting",
      description: "Boshqa foydalanuvchilar bilan raqobatlashing",
    },
  ],
  aboutCards: [
    {
      icon: "fa-language",
      title: "Ko'p tilli",
      description: "O'zbek, Rus va Ingliz tillarida yozing",
    },
    {
      icon: "fa-bolt",
      title: "Real vaqt",
      description: "Real vaqt rejimida natijalarni kuzating",
    },
    {
      icon: "fa-mobile-alt",
      title: "Moslashuvchan",
      description: "Barcha qurilmalarda ishlaydi",
    },
  ],
  footer: {
    brandName: "TypeUZ",
    tagline: "O'zbekistonning yozuv tezligi platformasi",
    telegram: "https://t.me/typeuz",
  },
};

function loadSiteContent(dev: boolean): SiteContentData {
  if (dev) {
    return devGet<SiteContentData>(SITE_CONTENT_KEY) ?? defaultSiteContent;
  }
  const doc = devGet<SiteContentData>(SITE_CONTENT_KEY) ?? null;
  return doc ?? defaultSiteContent;
}

function saveSiteContent(dev: boolean, data: SiteContentData): void {
  if (dev) {
    devSet(SITE_CONTENT_KEY, data);
  }
}

export async function getSiteContent(
  _req: TypeUZRequest,
): Promise<TypeUZResponse<SiteContentData>> {
  const content = loadSiteContent(isDevEnvironment());
  return new TypeUZResponse("Site content retrieved", content);
}

export async function updateSiteContent(
  req: TypeUZRequest<undefined, SiteContentData>,
): Promise<TypeUZResponse<SiteContentData>> {
  const data = req.body;
  saveSiteContent(isDevEnvironment(), data);
  return new TypeUZResponse("Site content updated", data);
}

// --- Theme Settings ---
type ThemeSettingsData = {
  accentColor: string;
  isDark?: boolean;
};

const defaultThemeSettings: ThemeSettingsData = {
  accentColor: "#ff5a1f",
  isDark: true,
};

export async function getThemeSettings(
  _req: TypeUZRequest,
): Promise<TypeUZResponse<ThemeSettingsData>> {
  if (isDevEnvironment()) {
    const saved = devGet<ThemeSettingsData>(THEME_SETTINGS_KEY);
    return new TypeUZResponse(
      "Theme settings retrieved",
      saved ?? defaultThemeSettings,
    );
  }
  return new TypeUZResponse("Theme settings retrieved", defaultThemeSettings);
}

export async function updateThemeSettings(
  req: TypeUZRequest<undefined, ThemeSettingsData>,
): Promise<TypeUZResponse<ThemeSettingsData>> {
  const data = req.body;
  if (isDevEnvironment()) {
    devSet(THEME_SETTINGS_KEY, data);
  }
  return new TypeUZResponse("Theme settings updated", data);
}

// --- Login Analytics ---
const LOGIN_LOG_KEY_CTRL = "login_log";

function getLoginLogCtrl(): Array<{ uid: string; timestamp: number }> {
  return (
    devGet<Array<{ uid: string; timestamp: number }>>(LOGIN_LOG_KEY_CTRL) ?? []
  );
}

export async function getSignupsByDay(
  _req: TypeUZRequest,
): Promise<TypeUZResponse<Array<{ date: string; count: number }>>> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const raw = devGet<Array<{ uid: string; addedAt: number }>>("users") ?? [];
  const dayMap = new Map<string, number>();
  for (const u of raw) {
    if (u.addedAt !== undefined && u.addedAt >= thirtyDaysAgo) {
      const d = new Date(u.addedAt).toISOString().slice(0, 10);
      dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
    }
  }
  const data = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return new TypeUZResponse("Signups data", data);
}

export async function getLoginsByDay(
  _req: TypeUZRequest,
): Promise<TypeUZResponse<Array<{ date: string; count: number }>>> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const log = getLoginLogCtrl().filter((e) => e.timestamp >= thirtyDaysAgo);
  const dayMap = new Map<string, number>();
  for (const e of log) {
    const d = new Date(e.timestamp).toISOString().slice(0, 10);
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
  }
  const data = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return new TypeUZResponse("Logins per day", data);
}

export async function getLoginsByWeek(
  _req: TypeUZRequest,
): Promise<TypeUZResponse<Array<{ week: string; count: number }>>> {
  const twelveWeeksAgo = Date.now() - 84 * 24 * 60 * 60 * 1000;
  const log = getLoginLogCtrl().filter((e) => e.timestamp >= twelveWeeksAgo);
  const weekMap = new Map<string, number>();
  for (const e of log) {
    const d = new Date(e.timestamp);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + 1);
  }
  const data = Array.from(weekMap.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));
  return new TypeUZResponse("Logins per week", data);
}

// --- Notification History ---
const NOTIFICATIONS_KEY = "admin_notifications";

export async function getNotifications(_req: TypeUZRequest): Promise<
  TypeUZResponse<
    Array<{
      id: string;
      uid: string;
      subject: string;
      body: string;
      timestamp: number;
      read: boolean;
    }>
  >
> {
  if (isDevEnvironment()) {
    const list =
      devGet<
        Array<{
          id: string;
          uid: string;
          subject: string;
          body: string;
          timestamp: number;
          read: boolean;
        }>
      >(NOTIFICATIONS_KEY) ?? [];
    return new TypeUZResponse("Notifications retrieved", list.reverse());
  }
  return new TypeUZResponse("Notifications retrieved", []);
}

// --- Legal Content ---
const LEGAL_CONTENT_KEY = "legal_content";

const defaultLegalContent = {
  privacy: {
    title: "Maxfiylik siyosati",
    content:
      "Ushbu Maxfiylik siyosati TypeUZ.uz platformasi foydalanuvchilarning shaxsiy ma'lumotlarini qanday to'plashi, saqlashi va himoya qilishini belgilaydi.",
  },
  terms: {
    title: "Foydalanish shartlari",
    content:
      "Ushbu Foydalanish shartlari TypeUZ.uz platformasidan foydalanish qoidalarini belgilaydi. Platformadan foydalanish orqali siz ushbu shartlarga rozilik bildirasiz.",
  },
  security: {
    title: "Xavfsizlik siyosati",
    content:
      "TypeUZ.uz platformasi foydalanuvchilar ma'lumotlarining xavfsizligini ta'minlash uchun barcha zarur choralarni ko'radi.",
  },
};

export async function getLegalContent(
  _req: TypeUZRequest,
): Promise<TypeUZResponse<typeof defaultLegalContent>> {
  if (isDevEnvironment()) {
    const saved = devGet<typeof defaultLegalContent>(LEGAL_CONTENT_KEY);
    return new TypeUZResponse(
      "Legal content retrieved",
      saved ?? defaultLegalContent,
    );
  }
  return new TypeUZResponse("Legal content retrieved", defaultLegalContent);
}

export async function updateLegalContent(
  req: TypeUZRequest<undefined, typeof defaultLegalContent>,
): Promise<TypeUZResponse> {
  if (isDevEnvironment()) {
    devSet(LEGAL_CONTENT_KEY, req.body);
  }
  return new TypeUZResponse("Legal content updated", null);
}

// --- List Users (paginated) ---
type ListUserRecord = {
  uid: string;
  name: string;
  email: string;
  banned: boolean;
  addedAt?: number;
  pbs?: Record<string, number>;
  completedTests?: number;
  timeTyping?: number;
  streak?: number;
  lastLoginAt?: number;
};

export async function listUsers(
  req: TypeUZRequest<{ skip: number; limit: number }>,
): Promise<TypeUZResponse<{ total: number; users: ListUserRecord[] }>> {
  if (isDevEnvironment()) {
    const allUsers = devGet<Array<Record<string, unknown>>>("users") ?? [];
    const total = allUsers.length;
    const page = allUsers.slice(
      req.query.skip,
      req.query.skip + req.query.limit,
    );
    return new TypeUZResponse("Users listed", {
      total,
      users: page.map((u: Record<string, unknown>) => ({
        uid: (u["uid"] as string) ?? "",
        name: (u["name"] as string) ?? "",
        email: (u["email"] as string) ?? "",
        banned: (u["banned"] as boolean) ?? false,
        addedAt: u["addedAt"] as number | undefined,
        completedTests: u["completedTests"] as number | undefined,
      })),
    });
  }
  try {
    const total = await db.collection("users").countDocuments();
    const projection = {
      uid: 1,
      name: 1,
      email: 1,
      banned: 1,
      addedAt: 1,
      pbs: 1,
      completedTests: 1,
      timeTyping: 1,
      streak: 1,
      lastLoginAt: 1,
    };
    const rawUsers = await db
      .collection("users")
      .find({}, { projection })
      .skip(req.query.skip)
      .limit(req.query.limit)
      .toArray();
    return new TypeUZResponse("Users listed", {
      total,
      users: rawUsers.map((u: Record<string, unknown>) => ({
        uid: (u["uid"] as string) ?? "",
        name: (u["name"] as string) ?? "",
        email: (u["email"] as string) ?? "",
        banned: (u["banned"] as boolean) ?? false,
        addedAt: u["addedAt"] as number | undefined,
        completedTests: u["completedTests"] as number | undefined,
        timeTyping: u["timeTyping"] as number | undefined,
      })),
    });
  } catch {
    return new TypeUZResponse("Users listed", { total: 0, users: [] });
  }
}
