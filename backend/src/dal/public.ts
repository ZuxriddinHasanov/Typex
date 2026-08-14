import { roundTo2 } from "@typeuz/util/numbers";
import * as db from "../init/db";
import TypeUZError from "../utils/error";
import { SpeedHistogram } from "@typeuz/schemas/public";

export async function updateStats(
  restartCount: number,
  time: number,
): Promise<boolean> {
  await db.query(
    `INSERT INTO public_stats (_id, data)
     VALUES (
       'stats',
       jsonb_build_object(
         'testsCompleted', 1,
         'testsStarted', $1::numeric + 1,
         'timeTyping', $2::numeric
       )
     )
     ON CONFLICT (_id) DO UPDATE SET data = jsonb_set(
       jsonb_set(
         jsonb_set(
           COALESCE(public_stats.data, '{}'::jsonb),
           '{testsCompleted}',
           to_jsonb(COALESCE((public_stats.data->>'testsCompleted')::numeric, 0) + 1)
         ),
         '{testsStarted}',
         to_jsonb(COALESCE((public_stats.data->>'testsStarted')::numeric, 0) + $1::numeric + 1)
       ),
       '{timeTyping}',
       to_jsonb(ROUND(COALESCE((public_stats.data->>'timeTyping')::numeric, 0) + $2::numeric, 2))
     )`,
    [restartCount, roundTo2(time)],
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
    throw new TypeUZError(
      404,
      "Public typing stats not found",
      "get typing stats",
    );
  }
  return stats.data;
}
