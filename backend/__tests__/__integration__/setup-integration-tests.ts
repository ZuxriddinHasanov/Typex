import { afterAll, beforeAll, afterEach, vi } from "vitest";
import pg, { Pool, type PoolClient } from "pg";
import { setupCommonMocks } from "../setup-common-mocks";
import { getConnection } from "../../src/init/redis";

process.env["MODE"] = "dev";
process.env["DATABASE_URL"] = process.env["TEST_DATABASE_URL"] ?? "";

let pool: pg.Pool | undefined;

beforeAll(async () => {
  pool = new Pool({
    connectionString: process.env["TEST_DATABASE_URL"],
  });
  await pool.query("SELECT 1");

  vi.mock("../../src/init/db", async () => {
    const actual =
      await vi.importActual<typeof import("../../src/init/db")>(
        "../../src/init/db",
      );
    const mockPool: Pool = pool as unknown as Pool;
    return {
      ...actual,
      getPool: () => mockPool,
      query: async (text: string, params?: unknown[]) =>
        mockPool.query(text, params),
      queryOne: async <T>(text: string, params?: unknown[]) => {
        const result = await mockPool.query(text, params);
        return (result.rows[0] ?? null) as T;
      },
      queryAll: async <T>(text: string, params?: unknown[]) => {
        const result = await mockPool.query(text, params);
        return result.rows as T[];
      },
      transaction: async <T>(callback: (client: PoolClient) => Promise<T>) => {
        const client = await mockPool.connect();
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
      },
    };
  });

  setupCommonMocks();

  //we compare the time in database to calculate premium status, so we have to use real time here
  vi.useRealTimers();
});

afterEach(async () => {
  // Clean all tables between tests
  if (pool) {
    const tables = [
      "results",
      "users",
      "presets",
      "ape_keys",
      "connections",
      "configs",
      "leaderboard_entries",
      "new_quotes",
      "quote_ratings",
      "logs",
      "reports",
      "blocklist",
      "psa",
      "admin_uids",
      "user_passwords",
      "password_resets",
      "admin_credentials",
    ];
    for (const table of tables) {
      await pool.query(`DELETE FROM ${table}`).catch(() => undefined);
    }
  }
});

afterAll(async () => {
  await pool?.end();
  pool = undefined;

  await getConnection()?.quit();

  vi.resetAllMocks();
});
