import * as db from "../init/db";
import { ConnectionStatus } from "@typeuz/schemas/connections";
import TypeUZError from "../utils/error";

export type DBConnection = {
  _id: string;
  key: string;
  initiator_uid: string;
  initiator_name: string;
  receiver_uid: string;
  receiver_name: string;
  last_modified: number;
  status: ConnectionStatus;
};

export async function getConnections(options: {
  initiatorUid?: string;
  receiverUid?: string;
  status?: ConnectionStatus[];
}): Promise<DBConnection[]> {
  const { initiatorUid, receiverUid, status } = options;

  if (initiatorUid === undefined && receiverUid === undefined) {
    throw new Error("Missing filter");
  }

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const orClauses: string[] = [];
  if (initiatorUid !== undefined) {
    orClauses.push(`initiator_uid = $${idx++}`);
    params.push(initiatorUid);
  }
  if (receiverUid !== undefined) {
    orClauses.push(`receiver_uid = $${idx++}`);
    params.push(receiverUid);
  }

  conditions.push(`(${orClauses.join(" OR ")})`);

  if (status !== undefined && status.length > 0) {
    const statusParams = status.map((s) => {
      const p = `$${idx++}`;
      params.push(s);
      return p;
    });
    conditions.push(`status IN (${statusParams.join(",")})`);
  }

  return await db.queryAll<DBConnection>(
    `SELECT * FROM connections WHERE ${conditions.join(" AND ")}`,
    params,
  );
}

export async function create(
  initiator: { uid: string; name: string },
  receiver: { uid: string; name: string },
  maxPerUser: number,
): Promise<DBConnection> {
  const countResult = await db.queryOne<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM connections WHERE initiator_uid = $1",
    [initiator.uid],
  );
  const count = countResult?.count ?? 0;

  if (count >= maxPerUser) {
    throw new TypeUZError(
      409,
      "Maximum number of connections reached",
      "create connection request",
    );
  }
  const key = getKey(initiator.uid, receiver.uid);

  const existing = await db.queryOne<DBConnection>(
    "SELECT * FROM connections WHERE key = $1",
    [key],
  );
  if (existing) {
    let message = "";
    if (existing.status === "accepted") {
      message = "Connection already exists";
    } else if (existing.status === "pending") {
      message = "Connection request already sent";
    } else if (existing.status === "blocked") {
      if (existing.initiator_uid === initiator.uid) {
        message = "Connection blocked by initiator";
      } else {
        message = "Connection blocked by receiver";
      }
    } else {
      message = "Duplicate connection";
    }
    throw new TypeUZError(409, message);
  }

  const created = await db.queryOne<DBConnection>(
    `INSERT INTO connections (key, initiator_uid, initiator_name, receiver_uid, receiver_name, last_modified, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [key, initiator.uid, initiator.name, receiver.uid, receiver.name, Date.now()],
  );

  if (created === null) {
    throw new TypeUZError(500, "Failed to create connection", "create connection");
  }
  return created;
}

export async function updateStatus(
  receiverUid: string,
  id: string,
  status: ConnectionStatus,
): Promise<void> {
  const result = await db.query(
    `UPDATE connections SET status = $1, last_modified = $2
     WHERE _id = $3::uuid AND receiver_uid = $4`,
    [status, Date.now(), id, receiverUid],
  );
  if (result.rowCount === 0) {
    throw new TypeUZError(404, "No permission or connection not found");
  }
}

export async function deleteById(uid: string, id: string): Promise<void> {
  const result = await db.query(
    `DELETE FROM connections WHERE _id = $1::uuid AND (
      receiver_uid = $2 OR (status IN ('accepted', 'pending') AND initiator_uid = $2)
    )`,
    [id, uid],
  );
  if (result.rowCount === 0) {
    throw new TypeUZError(404, "No permission or connection not found");
  }
}

export async function updateName(uid: string, newName: string): Promise<void> {
  await db.query(
    "UPDATE connections SET initiator_name = $1 WHERE initiator_uid = $2",
    [newName, uid],
  );
  await db.query(
    "UPDATE connections SET receiver_name = $1 WHERE receiver_uid = $2",
    [newName, uid],
  );
}

export async function deleteByUid(uid: string): Promise<void> {
  await db.query(
    "DELETE FROM connections WHERE initiator_uid = $1 OR receiver_uid = $1",
    [uid],
  );
}

export async function getFriendsUids(uid: string): Promise<string[]> {
  const rows = await db.queryAll<{ initiator_uid: string; receiver_uid: string }>(
    `SELECT initiator_uid, receiver_uid FROM connections
     WHERE status = 'accepted' AND (initiator_uid = $1 OR receiver_uid = $1)`,
    [uid],
  );
  const uids = new Set<string>();
  rows.forEach((r) => {
    uids.add(r.initiator_uid);
    uids.add(r.receiver_uid);
  });
  return Array.from(uids);
}

export async function aggregateWithAcceptedConnections<T>(
  options: {
    uid: string;
    collectionName: string;
    uidField?: string;
    includeMetaData?: boolean;
    targetSql?: string;
  },
  pipeline?: unknown[],
): Promise<T[]> {
  const friendUids = await getFriendsUids(options.uid);
  const allUids = [...friendUids, options.uid];
  const uidField = options.uidField ?? "uid";

  if (pipeline && pipeline.length > 0) {
    return await db.queryAll<T>(
      `SELECT * FROM ${options.collectionName}
       WHERE ${uidField} = ANY($1::text[])`,
      [allUids],
    );
  }

  return await db.queryAll<T>(
    `SELECT * FROM ${options.collectionName}
     WHERE ${uidField} = ANY($1::text[])`,
    [allUids],
  );
}

function getKey(initiatorUid: string, receiverUid: string): string {
  const ids = [initiatorUid, receiverUid];
  ids.sort();
  return ids.join("/");
}

export async function createIndicies(): Promise<void> {
  await db.query(
    "CREATE INDEX IF NOT EXISTS idx_connections_initiator ON connections(initiator_uid, status)",
  );
  await db.query(
    "CREATE INDEX IF NOT EXISTS idx_connections_receiver ON connections(receiver_uid, status)",
  );
  await db.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_key ON connections(key)",
  );
}
