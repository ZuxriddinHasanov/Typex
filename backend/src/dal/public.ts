import { roundTo2 } from "@typeuz/util/numbers";
import * as db from "../init/db";
import TypeUZError from "../utils/error";
import { SpeedHistogram } from "@typeuz/schemas/public";

export async function updateStats(
  restartCount: number,
  time: number,
): Promise<boolean> {
  const existing = await db.queryOne<{ data: Record<string, unknown> }>(
    "SELECT data FROM public_stats WHERE _id = 'stats'",
  );
  const data = existing?.data ?? {};
  data["testsCompleted"] = ((data["testsCompleted"] as number) ?? 0) + 1;
  data["testsStarted"] = ((data["testsStarted"] as number) ?? 0) + restartCount + 1;
  data["timeTyping"] = roundTo2(((data["timeTyping"] as number) ?? 0) + time);

  await db.query(
    `INSERT INTO public_stats (_id, data) VALUES ('stats', $1::jsonb)
     ON CONFLICT (_id) DO UPDATE SET data = $1::jsonb`,
    [JSON.stringify(data)],
  );
  return true;
}

export async function getSpeedHistogram(
  language: string,
  mode: string,
  mode2: string,
): Promise<SpeedHistogram> {
  const key = `${language}_${mode}_${mode2}`;

  const doc = await db.queryOne<{ data: Record<string, unknown> }>(
    "SELECT data FROM public_stats WHERE _id = 'speedStatsHistogram'",
  );

  return (doc?.data?.[key] as SpeedHistogram) ?? {};
}

export async function getTypingStats(): Promise<Record<string, unknown>> {
  const stats = await db.queryOne<{ data: Record<string, unknown> }>(
    "SELECT data FROM public_stats WHERE _id = 'stats'",
  );
  if (!stats) {
    throw new TypeUZError(404, "Public typing stats not found", "get typing stats");
  }
  return stats.data;
}
