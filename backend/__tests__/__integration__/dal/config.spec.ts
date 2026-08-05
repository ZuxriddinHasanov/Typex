import { describe, expect, it } from "vitest";
import crypto from "crypto";
import * as ConfigDal from "../../../src/dal/config";

import * as db from "../../../src/init/db";

describe("ConfigDal", () => {
  describe("saveConfig", () => {
    it("should save and update user configuration correctly", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      await db.query(
        "INSERT INTO configs (uid, config) VALUES ($1, $2::jsonb)",
        [uid, JSON.stringify({ ads: "on", time: 60, quickTab: true })]
      );

      //WHEN
      await ConfigDal.saveConfig(uid, {
        ads: "on",
        difficulty: "normal",
      } as any);

      const r = await db.queryOne<{ config: any }>(
        "SELECT config FROM configs WHERE uid = $1",
        [uid]
      );
      expect(r?.config).toEqual({
        ads: "on",
        time: 60,
        quickTab: true,
        difficulty: "normal",
      });

      //WHEN
      await ConfigDal.saveConfig(uid, { ads: "off" });

      //THEN
      const savedConfig = (await ConfigDal.getConfig(
        uid,
      )) as ConfigDal.DBConfig;

      expect(savedConfig.config.ads).toBe("off");
      expect(savedConfig.config.time).toBe(60);

      //should remove legacy values
      expect((savedConfig.config as any)["quickTab"]).toBeUndefined();
    });
  });
});
