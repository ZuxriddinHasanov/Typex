import pg, { Pool, types, type PoolClient } from "pg";
import TypeUZError from "../utils/error";
import Logger from "../utils/logger";
import { isDevEnvironment } from "../utils/misc";

let pool: pg.Pool | undefined;

// PostgreSQL returns NUMERIC and BIGINT as strings by default. All values stored
// in those columns (timestamps, WPM, XP, counters) are constrained to safe JS
// number ranges by the API schemas.
types.setTypeParser(20, Number);
types.setTypeParser(1700, Number);

export async function connect(): Promise<void> {
  const databaseUrl = process.env["DATABASE_URL"];
  if (databaseUrl === undefined || databaseUrl === "") {
    if (isDevEnvironment()) {
      Logger.warning("No DATABASE_URL provided. Running without database.");
      return;
    }
    throw new Error("No DATABASE_URL provided");
  }

  const hostname = (() => {
    try {
      return new URL(databaseUrl.replace("postgres://", "postgresql://"))
        .hostname;
    } catch {
      return "";
    }
  })();
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "";

  pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 15000,
    max: 20,
    ssl:
      process.env["DB_SSL"] === "false" || isLocalHost
        ? undefined
        : {
            rejectUnauthorized: false,
          },
  });

  try {
    const client = await pool.connect();
    client.release();
    Logger.success("Connected to PostgreSQL database");
  } catch (error) {
    Logger.error(
      `PostgreSQL Connection Error: ${(error as Error).message ?? "Unknown error"}`,
    );
    if (isDevEnvironment()) {
      Logger.warning(
        "Failed to connect to database. Running without database in dev mode.",
      );
      pool = undefined;
      return;
    }
    pool = undefined;
    throw error;
  }
}

export const getPool = (): pg.Pool | undefined => pool;

export const getDb = (): pg.Pool | undefined => pool;

function createMockClient(): pg.Pool {
  const mockPool = new Pool({
    connectionString: "postgresql://mock:mock@localhost:5432/mock",
    max: 1,
  });
  mockPool.query = async (...args: unknown[]) => {
    const text =
      typeof args[0] === "string"
        ? args[0]
        : (args[0] as { text: string }).text;
    if (text?.toLowerCase().includes("select")) {
      return { rows: [], rowCount: 0 } as unknown as pg.QueryResult;
    }
    return { rows: [], rowCount: 0, command: "" } as unknown as pg.QueryResult;
  };

  mockPool.connect = async () => {
    return {
      query: async () => ({ rows: [], rowCount: 0 }),
      release: (): void => {
        // mock client: nothing to release
      },
    } as unknown as pg.PoolClient;
  };
  return mockPool;
}

let mockPoolInstance: pg.Pool | undefined;

export async function query(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult> {
  const p = pool;
  if (p === undefined) {
    if (isDevEnvironment()) {
      mockPoolInstance ??= createMockClient();
      return await mockPoolInstance.query(text, params);
    }
    throw new TypeUZError(500, "Database is not initialized.");
  }
  return p.query(text, params);
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const result = await query(text, params);
  return (result.rows[0] as T | undefined) ?? null;
}

export async function queryAll<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await query(text, params);
  return result.rows as T[];
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const p = pool;
  if (p === undefined) {
    throw new TypeUZError(500, "Database is not initialized.");
  }

  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function close(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

type MockCollection = {
  findOne: (
    filter?: Record<string, unknown>,
  ) => Promise<Record<string, unknown> | null>;
  replaceOne: (
    filter: Record<string, unknown>,
    replacement: Record<string, unknown>,
    options?: { upsert?: boolean },
  ) => Promise<void>;
  countDocuments: (filter?: Record<string, unknown>) => Promise<number>;
  estimatedDocumentCount: () => Promise<number>;
  updateOne: (
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options?: { upsert?: boolean },
  ) => Promise<void>;
  insertOne: (doc: Record<string, unknown>) => Promise<{ insertedId: string }>;
  deleteMany: (
    filter?: Record<string, unknown>,
  ) => Promise<{ deletedCount: number }>;
  aggregate: (pipeline: Record<string, unknown>[]) => {
    toArray: () => Promise<Record<string, unknown>[]>;
  };
  find: (
    filter?: Record<string, unknown>,
    options?: { projection?: Record<string, number> },
  ) => {
    toArray: () => Promise<Record<string, unknown>[]>;
    project: (fields: Record<string, number>) => {
      toArray: () => Promise<Record<string, unknown>[]>;
    };
    limit: (n: number) => { toArray: () => Promise<Record<string, unknown>[]> };
    skip: (n: number) => {
      limit: (m: number) => {
        toArray: () => Promise<Record<string, unknown>[]>;
      };
      toArray: () => Promise<Record<string, unknown>[]>;
    };
    sort: (sortObj: Record<string, number>) => {
      limit: (n: number) => {
        skip: (n: number) => {
          toArray: () => Promise<Record<string, unknown>[]>;
        };
        toArray: () => Promise<Record<string, unknown>[]>;
      };
      toArray: () => Promise<Record<string, unknown>[]>;
    };
  };
};

function parseJsonData(data: unknown): Record<string, unknown> | null {
  if (data === null || data === undefined) return null;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return data as Record<string, unknown>;
}

const USERS_PROJECTION_COLUMNS: Record<string, string> = {
  uid: "uid",
  name: "name",
  email: "email",
  banned: "banned",
  addedAt: "added_at",
  completedTests: "completed_tests",
  timeTyping: "time_typing",
  pbs: "personal_bests",
  streak: "streak",
  lastLoginAt: "last_login_at",
};

function buildUsersWhere(filter: Record<string, unknown> | undefined): {
  where: string;
  params: unknown[];
} {
  const params: unknown[] = [];
  const conditions: string[] = [];
  const ors = filter?.["$or"];
  if (Array.isArray(ors)) {
    for (const cond of ors as Record<string, unknown>[]) {
      for (const [key, val] of Object.entries(cond)) {
        const col = USERS_PROJECTION_COLUMNS[key] ?? key;
        if (typeof val === "object" && val !== null) {
          const v = val as Record<string, unknown>;
          if (v["$regex"] !== undefined) {
            const pattern = (v["$regex"] as string)
              .replace(/%/g, "\\%")
              .replace(/_/g, "\\_");
            params.push(`%${pattern}%`);
            conditions.push(`${col} ILIKE $${params.length} ESCAPE '\\'`);
          }
        } else {
          params.push(val);
          conditions.push(`${col} = $${params.length}`);
        }
      }
    }
  }
  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" OR ")}` : "",
    params,
  };
}

function buildUsersSelect(
  filter: Record<string, unknown> | undefined,
  options: { projection?: Record<string, number> } | undefined,
  skip: number,
  limit: number,
): { sql: string; params: unknown[] } {
  const projection = options?.projection;
  const columns =
    projection !== undefined && Object.keys(projection).length > 0
      ? Object.keys(projection)
          .map((k) => `${USERS_PROJECTION_COLUMNS[k] ?? k} AS "${k}"`)
          .join(", ")
      : "*";
  const { where, params } = buildUsersWhere(filter);
  const sql = `SELECT ${columns} FROM users ${where} ORDER BY added_at ASC${
    limit > 0 ? ` LIMIT ${limit}` : ""
  }${skip > 0 ? ` OFFSET ${skip}` : ""}`;
  return { sql, params };
}

function findUsersCursor(
  filter: Record<string, unknown> | undefined,
  options: { projection?: Record<string, number> } | undefined,
): {
  toArray: () => Promise<Record<string, unknown>[]>;
  project: (fields: Record<string, number>) => {
    toArray: () => Promise<Record<string, unknown>[]>;
  };
  limit: (n: number) => { toArray: () => Promise<Record<string, unknown>[]> };
  skip: (n: number) => {
    limit: (m: number) => { toArray: () => Promise<Record<string, unknown>[]> };
    toArray: () => Promise<Record<string, unknown>[]>;
  };
  sort: (sortObj: Record<string, number>) => {
    limit: (n: number) => {
      skip: (n: number) => {
        toArray: () => Promise<Record<string, unknown>[]>;
      };
      toArray: () => Promise<Record<string, unknown>[]>;
    };
    toArray: () => Promise<Record<string, unknown>[]>;
  };
} {
  let skip = 0;
  let limit = 0;
  let projectionOptions = options;
  const run = async (): Promise<Record<string, unknown>[]> => {
    const { sql, params } = buildUsersSelect(
      filter,
      projectionOptions,
      skip,
      limit,
    );
    const result = await query(sql, params);
    return result.rows as Record<string, unknown>[];
  };
  return {
    toArray: run,
    project: (fields) => {
      projectionOptions = { projection: fields };
      return { toArray: run };
    },
    limit: (n) => {
      limit = n;
      return { toArray: run };
    },
    skip: (n) => {
      skip = n;
      return {
        limit: (m) => {
          limit = m;
          return { toArray: run };
        },
        toArray: run,
      };
    },
    sort: () => {
      return {
        limit: (n) => {
          limit = n;
          return {
            skip: (m) => {
              skip = m;
              return { toArray: run };
            },
            toArray: run,
          };
        },
        toArray: run,
      };
    },
  };
}

export function collection(name: string): MockCollection {
  return {
    findOne: async (filter) => {
      if (name === "configuration") {
        const id = (filter?.["_id"] as string) ?? "default";
        const row = await queryOne<{ data: string }>(
          "SELECT data FROM configuration WHERE _id = $1",
          [id],
        );
        if (!row) return null;
        return parseJsonData(row.data);
      }
      if (name === "admin-credentials") {
        const username = (filter?.["username"] as string) ?? "";
        const row = await queryOne<{ data: string }>(
          "SELECT data FROM admin_credentials WHERE username = $1",
          [username],
        );
        if (!row) return null;
        return parseJsonData(row.data);
      }
      if (name === "user-passwords") {
        const uid = (filter?.["uid"] as string) ?? "";
        const row = await queryOne<{ data: string }>(
          "SELECT data FROM user_passwords WHERE uid = $1",
          [uid],
        );
        if (!row) return null;
        return parseJsonData(row.data);
      }
      return null;
    },
    replaceOne: async (filter, replacement) => {
      if (name === "configuration") {
        const id = (filter["_id"] as string) ?? "default";
        await query(
          `INSERT INTO configuration (_id, data) VALUES ($1, $2::jsonb)
           ON CONFLICT (_id) DO UPDATE SET data = $2::jsonb`,
          [id, JSON.stringify(replacement)],
        );
      }
    },
    countDocuments: async (filter) => {
      if (name === "users") {
        const parts: string[] = [];
        const vals: unknown[] = [];
        let idx = 1;
        for (const [k, v] of Object.entries(filter ?? {})) {
          if (typeof v === "object" && v !== null) {
            const obj = v as Record<string, unknown>;
            if (obj["$gte"] !== undefined) {
              parts.push(
                `${k.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`)} >= $${idx++}`,
              );
              vals.push(obj["$gte"]);
            }
          }
        }
        const where = parts.length > 0 ? `WHERE ${parts.join(" AND ")}` : "";
        const result = await queryOne<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM users ${where}`,
          vals,
        );
        return result?.count ?? 0;
      }
      return 0;
    },
    estimatedDocumentCount: async () => 0,
    updateOne: async (filter, update, options) => {
      if (name === "configuration") {
        const id = (filter["_id"] as string) ?? "default";
        const existingRow = await queryOne<{ data: string }>(
          "SELECT data FROM configuration WHERE _id = $1",
          [id],
        );
        const existing: Record<string, unknown> =
          parseJsonData(existingRow?.data) ?? {};
        const merged = {
          ...existing,
          ...((update as { $set?: Record<string, unknown> }).$set ?? {}),
        };
        if (options?.upsert) {
          await query(
            `INSERT INTO configuration (_id, data) VALUES ($1, $2::jsonb)
             ON CONFLICT (_id) DO UPDATE SET data = $2::jsonb`,
            [id, JSON.stringify(merged)],
          );
        } else {
          await query(
            "UPDATE configuration SET data = $1::jsonb WHERE _id = $2",
            [JSON.stringify(merged), id],
          );
        }
      }
      if (name === "admin-credentials") {
        const username = (filter["username"] as string) ?? "";
        const doc = (update as { $set?: Record<string, unknown> }).$set ?? {};
        await query(
          `INSERT INTO admin_credentials (username, data) VALUES ($1, $2::jsonb)
           ON CONFLICT (username) DO UPDATE SET data = $2::jsonb`,
          [username, JSON.stringify(doc)],
        );
      }
    },
    insertOne: async (doc) => {
      if (name === "user-passwords") {
        const uid = (doc["uid"] as string) ?? "";
        if (uid !== "") {
          await query(
            `INSERT INTO user_passwords (uid, data) VALUES ($1, $2::jsonb)
             ON CONFLICT (uid) DO UPDATE SET data = $2::jsonb`,
            [uid, JSON.stringify(doc)],
          );
        }
        return { insertedId: uid };
      }
      if (name === "password-resets") {
        const token = (doc["token"] as string) ?? "";
        if (token !== "") {
          await query(
            `INSERT INTO password_resets (token, data) VALUES ($1, $2::jsonb)
             ON CONFLICT (token) DO UPDATE SET data = $2::jsonb`,
            [token, JSON.stringify(doc)],
          );
        }
        return { insertedId: token };
      }
      return { insertedId: "" };
    },
    deleteMany: async () => ({ deletedCount: 1 }),
    aggregate: () => ({ toArray: async () => [] }),
    find: (filter, options) => {
      if (name === "users") {
        return findUsersCursor(filter, options);
      }
      return {
        toArray: async () => [],
        project: () => ({ toArray: async () => [] }),
        limit: () => ({ toArray: async () => [] }),
        skip: () => ({
          limit: () => ({ toArray: async () => [] }),
          toArray: async () => [],
        }),
        sort: () => ({
          limit: () => ({
            skip: () => ({ toArray: async () => [] }),
            toArray: async () => [],
          }),
          toArray: async () => [],
        }),
      };
    },
  };
}
