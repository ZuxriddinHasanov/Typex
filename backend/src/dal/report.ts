import TypeUZError from "../utils/error";
import * as db from "../init/db";

type ReportTypes = "quote" | "user";

export type DBReport = {
  id: string;
  type: ReportTypes;
  timestamp: number;
  uid: string;
  content_id: string;
  reason: string;
  comment: string;
};

export async function getReports(reportIds: string[]): Promise<DBReport[]> {
  return await db.queryAll<DBReport>(
    "SELECT * FROM reports WHERE id = ANY($1::text[])",
    [reportIds],
  );
}

export async function deleteReports(reportIds: string[]): Promise<void> {
  await db.query("DELETE FROM reports WHERE id = ANY($1::text[])", [reportIds]);
}

export async function createReport(
  report: DBReport,
  maxReports: number,
  contentReportLimit: number,
): Promise<void> {
  if (report.type === "user" && report.content_id === report.uid) {
    throw new TypeUZError(400, "You cannot report yourself.");
  }

  const countResult = await db.queryOne<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM reports",
  );
  const reportsCount = countResult?.count ?? 0;

  if (reportsCount >= maxReports) {
    throw new TypeUZError(
      503,
      "Reports are not being accepted at this time due to a large backlog of reports. Please try again later.",
    );
  }

  const sameReports = await db.queryAll<DBReport>(
    "SELECT * FROM reports WHERE content_id = $1",
    [report.content_id],
  );

  if (sameReports.length >= contentReportLimit) {
    throw new TypeUZError(
      409,
      "A report limit for this content has been reached.",
    );
  }

  const countFromUserMakingReport = sameReports.filter((r) => {
    return r.uid === report.uid;
  }).length;

  if (countFromUserMakingReport > 0) {
    throw new TypeUZError(409, "You have already reported this content.");
  }

  await db.query(
    `INSERT INTO reports (id, type, timestamp, uid, content_id, reason, comment)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [report.id, report.type, report.timestamp, report.uid, report.content_id, report.reason, report.comment],
  );
}
