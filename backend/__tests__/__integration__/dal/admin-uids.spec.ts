import { describe, it, expect } from "vitest";
import crypto from "crypto";
import * as AdminUidsDal from "../../../src/dal/admin-uids";
import * as db from "../../../src/init/db";

describe("AdminUidsDal", () => {
  describe("isAdmin", () => {
    it("should return true for existing admin user", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      await db.query("INSERT INTO admin_uids (uid) VALUES ($1)", [uid]);

      //WHEN / THEN
      expect(await AdminUidsDal.isAdmin(uid)).toBe(true);
    });

    it("should return false for non-existing admin user", async () => {
      await db.query("INSERT INTO admin_uids (uid) VALUES ($1)", ["admin"]);

      //WHEN / THEN
      expect(await AdminUidsDal.isAdmin("regularUser")).toBe(false);
    });
  });
});
