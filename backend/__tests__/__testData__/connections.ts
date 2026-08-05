import crypto from "crypto";
import * as ConnectionsDal from "../../src/dal/connections";
import * as db from "../../src/init/db";

export async function createConnection(
  data: Partial<ConnectionsDal.DBConnection>,
  maxPerUser = 25,
): Promise<ConnectionsDal.DBConnection> {
  const defaultName = `user${crypto.randomUUID()}`;
  const result = await ConnectionsDal.create(
    {
      uid: data.initiator_uid ?? crypto.randomUUID(),
      name: data.initiator_name ?? defaultName,
    },
    {
      uid: data.receiver_uid ?? crypto.randomUUID(),
      name: data.receiver_name ?? defaultName,
    },
    maxPerUser,
  );

  const updates: string[] = [];
  const values: any[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(data)) {
    updates.push(`${key} = $${i++}`);
    values.push(value);
  }
  if (updates.length > 0) {
    values.push(result._id);
    await db.query(
      `UPDATE connections SET ${updates.join(", ")} WHERE _id = $${i}`,
      values,
    );
  }
  return { ...result, ...data };
}
