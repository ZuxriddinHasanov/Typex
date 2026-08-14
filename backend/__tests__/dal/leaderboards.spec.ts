import { afterEach, describe, expect, it, vi } from "vitest";
import * as DB from "../../src/init/db";
import * as Leaderboards from "../../src/dal/leaderboards";

describe("PostgreSQL leaderboards", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps database columns to the public API shape", async () => {
    vi.spyOn(DB, "queryAll").mockResolvedValue([
      {
        uid: "user-1",
        wpm: "100.5",
        acc: "98.2",
        raw: "105.1",
        consistency: null,
        timestamp: "1700000000000",
        rank: 1,
        name: "tester",
        first_name: "Test",
        last_name: null,
        discord_id: null,
        discord_avatar: null,
        badge_id: 7,
        is_premium: true,
      },
    ] as never);

    const result = await Leaderboards.get("time", "15", "uzbek", 0, 50, true);

    expect(result).toEqual([
      {
        uid: "user-1",
        wpm: 100.5,
        acc: 98.2,
        raw: 105.1,
        timestamp: 1700000000000,
        rank: 1,
        name: "tester",
        firstName: "Test",
        badgeId: 7,
        isPremium: true,
      },
    ]);
  });

  it("rebuilds a leaderboard inside one transaction", async () => {
    const client = {
      query: vi.fn(async (sql: string) => ({
        rows: sql.includes("GROUP BY boundary")
          ? [{ boundary: 100, count: 2 }]
          : [],
        rowCount: 0,
      })),
    };
    vi.spyOn(DB, "transaction").mockImplementation(async (callback) =>
      callback(client as never),
    );

    await Leaderboards.update("time", "15", "uzbek", false);

    const statements = client.query.mock.calls.map(([sql]) => sql).join("\n");
    expect(statements).toContain("pg_advisory_xact_lock");
    expect(statements).toContain("DELETE FROM leaderboard_entries");
    expect(statements).toContain("INSERT INTO leaderboard_entries");
    expect(statements).not.toContain("CREATE INDEX");
  });
});
