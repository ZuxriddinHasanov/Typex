import crypto from "crypto";
import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import * as BlacklistDal from "../../../src/dal/blocklist";
import * as db from "../../../src/init/db";

describe("BlocklistDal", () => {
  beforeAll(async () => {
    await BlacklistDal.createIndicies();
  });
  describe("add", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });
    it("adds user", async () => {
      //GIVEN
      const now = 1715082588;
      vi.setSystemTime(now);

      const name = `user${crypto.randomUUID()}`;
      const email = `${name}@example.com`;

      //WHEN
      await BlacklistDal.add({ name, email });

      //THEN
      await expect(
        db.queryOne(
          "SELECT email_hash, timestamp FROM blocklist WHERE email_hash = email",
          [BlacklistDal.hash(email)],
        )
      ).resolves.toMatchObject({
        email_hash: BlacklistDal.hash(email),
        timestamp: now.toString(),
      });

      await expect(
        db.queryOne(
          "SELECT username_hash, timestamp FROM blocklist WHERE username_hash = name",
          [BlacklistDal.hash(name)],
        )
      ).resolves.toMatchObject({
        username_hash: BlacklistDal.hash(name),
        timestamp: now.toString(),
      });
    });
    it("adds user with discordId", async () => {
      //GIVEN
      const now = 1715082588;
      vi.setSystemTime(now);

      const name = `user${crypto.randomUUID()}`;
      const email = `${name}@example.com`;
      const discordId = `${name}DiscordId`;

      //WHEN
      await BlacklistDal.add({ name, email, discordId });

      //THEN
      await expect(
        db.queryOne(
          "SELECT discord_id_hash, timestamp FROM blocklist WHERE discord_id_hash = discordId",
          [BlacklistDal.hash(discordId)],
        )
      ).resolves.toMatchObject({
        discord_id_hash: BlacklistDal.hash(discordId),
        timestamp: now.toString(),
      });
    });
    it("adds user should not create duplicate name", async () => {
      //GIVEN
      const now = 1715082588;
      vi.setSystemTime(now);

      const name = `user${crypto.randomUUID()}`;
      const email = `${name}@example.com`;
      const email2 = `${name}@otherdomain.com`;
      await BlacklistDal.add({ name, email });

      //WHEN
      await BlacklistDal.add({ name, email: email2 });

      //THEN
      await expect(
        db.queryAll(
          "SELECT * FROM blocklist WHERE username_hash = name",
          [BlacklistDal.hash(name)]
        )
      ).resolves.toHaveLength(1);
      await expect(
        db.queryAll(
          "SELECT * FROM blocklist WHERE email_hash = email",
          [BlacklistDal.hash(email)]
        )
      ).resolves.toHaveLength(1);
      await expect(
        db.queryAll(
          "SELECT * FROM blocklist WHERE email_hash = email2",
          [BlacklistDal.hash(email2)]
        )
      ).resolves.toHaveLength(1);
    });
    it("adds user should not create duplicate email", async () => {
      //GIVEN
      const now = 1715082588;
      vi.setSystemTime(now);

      const name = `user${crypto.randomUUID()}`;
      const email = `${name}@example.com`;
      const name2 = `user${crypto.randomUUID()}`;
      await BlacklistDal.add({ name, email });

      //WHEN
      await BlacklistDal.add({ name: name2, email });

      //THEN
      await expect(
        db.queryAll(
          "SELECT * FROM blocklist WHERE email_hash = email",
          [BlacklistDal.hash(email)]
        )
      ).resolves.toHaveLength(1);
    });
    it("adds user should not create duplicate discordId", async () => {
      //GIVEN
      const now = 1715082588;
      vi.setSystemTime(now);

      const name = `user${crypto.randomUUID()}`;
      const name2 = `user${crypto.randomUUID()}`;
      const email = `${name}@example.com`;
      const discordId = `${name}DiscordId`;

      await BlacklistDal.add({ name, email, discordId });

      //WHEN
      await BlacklistDal.add({ name: name2, email, discordId });

      //THEN

      await expect(
        db.queryAll(
          "SELECT * FROM blocklist WHERE discord_id_hash = discordId",
          [BlacklistDal.hash(discordId)]
        )
      ).resolves.toHaveLength(1);
    });
  });
  describe("contains", () => {
    it("contains user", async () => {
      //GIVEN
      const name = `user${crypto.randomUUID()}`;
      const email = `${name}@example.com`;
      const discordId = `${name}DiscordId`;
      await BlacklistDal.add({ name, email, discordId });
      await BlacklistDal.add({ name: "test", email: "test@example.com" });

      //WHEN / THEN
      //by name
      await expect(BlacklistDal.contains({ name })).resolves.toBeTruthy();
      await expect(
        BlacklistDal.contains({ name: name.toUpperCase() }),
      ).resolves.toBeTruthy();
      await expect(
        BlacklistDal.contains({ name, email: "unknown", discordId: "unknown" }),
      ).resolves.toBeTruthy();

      //by email
      await expect(BlacklistDal.contains({ email })).resolves.toBeTruthy();
      await expect(
        BlacklistDal.contains({ email: email.toUpperCase() }),
      ).resolves.toBeTruthy();
      await expect(
        BlacklistDal.contains({ name: "unknown", email, discordId: "unknown" }),
      ).resolves.toBeTruthy();

      //by discordId
      await expect(BlacklistDal.contains({ discordId })).resolves.toBeTruthy();
      await expect(
        BlacklistDal.contains({ discordId: discordId.toUpperCase() }),
      ).resolves.toBeTruthy();
      await expect(
        BlacklistDal.contains({ name: "unknown", email: "unknown", discordId }),
      ).resolves.toBeTruthy();

      //by name and email and discordId
      await expect(
        BlacklistDal.contains({ name, email, discordId }),
      ).resolves.toBeTruthy();
    });
    it("does not contain user", async () => {
      //GIVEN
      await BlacklistDal.add({ name: "test", email: "test@example.com" });
      await BlacklistDal.add({ name: "test2", email: "test2@example.com" });

      //WHEN / THEN
      await expect(
        BlacklistDal.contains({ name: "unknown" }),
      ).resolves.toBeFalsy();
      await expect(
        BlacklistDal.contains({ email: "unknown" }),
      ).resolves.toBeFalsy();
      await expect(
        BlacklistDal.contains({ discordId: "unknown" }),
      ).resolves.toBeFalsy();
      await expect(
        BlacklistDal.contains({
          name: "unknown",
          email: "unknown",
          discordId: "unknown",
        }),
      ).resolves.toBeFalsy();

      await expect(BlacklistDal.contains({})).resolves.toBeFalsy();
    });
  });

  describe("remove", () => {
    it("removes existing username", async () => {
      //GIVEN
      const name = `user${crypto.randomUUID()}`;
      const email = `${name}@example.com`;
      await BlacklistDal.add({ name, email });
      await BlacklistDal.add({ name: "test", email: "test@example.com" });

      //WHEN
      await BlacklistDal.remove({ name });

      //THEN
      await expect(BlacklistDal.contains({ name })).resolves.toBeFalsy();
      await expect(BlacklistDal.contains({ email })).resolves.toBeTruthy();

      //decoy still exists
      await expect(
        BlacklistDal.contains({ name: "test" }),
      ).resolves.toBeTruthy();
      await expect(
        BlacklistDal.contains({ email: "test@example.com" }),
      ).resolves.toBeTruthy();
    });
    it("removes existing email", async () => {
      //GIVEN
      const name = `user${crypto.randomUUID()}`;
      const email = `${name}@example.com`;
      await BlacklistDal.add({ name, email });
      await BlacklistDal.add({ name: "test", email: "test@example.com" });

      //WHEN
      await BlacklistDal.remove({ email });

      //THEN
      await expect(BlacklistDal.contains({ email })).resolves.toBeFalsy();
      await expect(BlacklistDal.contains({ name })).resolves.toBeTruthy();

      //decoy still exists
      await expect(
        BlacklistDal.contains({ name: "test" }),
      ).resolves.toBeTruthy();
      await expect(
        BlacklistDal.contains({ email: "test@example.com" }),
      ).resolves.toBeTruthy();
    });
    it("removes existing discordId", async () => {
      //GIVEN
      const name = `user${crypto.randomUUID()}`;
      const email = `${name}@example.com`;
      const discordId = `${name}DiscordId`;
      await BlacklistDal.add({ name, email, discordId });
      await BlacklistDal.add({
        name: "test",
        email: "test@example.com",
        discordId: "testDiscordId",
      });

      //WHEN
      await BlacklistDal.remove({ discordId });

      //THEN
      await expect(BlacklistDal.contains({ discordId })).resolves.toBeFalsy();
      await expect(BlacklistDal.contains({ name })).resolves.toBeTruthy();
      await expect(BlacklistDal.contains({ email })).resolves.toBeTruthy();

      //decoy still exists
      await expect(
        BlacklistDal.contains({ name: "test" }),
      ).resolves.toBeTruthy();
      await expect(
        BlacklistDal.contains({ email: "test@example.com" }),
      ).resolves.toBeTruthy();
      await expect(
        BlacklistDal.contains({ discordId: "testDiscordId" }),
      ).resolves.toBeTruthy();
    });
    it("removes existing username,email and discordId", async () => {
      //GIVEN
      const name = `user${crypto.randomUUID()}`;
      const email = `${name}@example.com`;
      const discordId = `${name}DiscordId`;
      await BlacklistDal.add({ name, email, discordId });
      await BlacklistDal.add({
        name: "test",
        email: "test@example.com",
        discordId: "testDiscordId",
      });

      //WHEN
      await BlacklistDal.remove({ name, email, discordId });

      //THEN
      await expect(BlacklistDal.contains({ email })).resolves.toBeFalsy();
      await expect(BlacklistDal.contains({ name })).resolves.toBeFalsy();
      await expect(BlacklistDal.contains({ discordId })).resolves.toBeFalsy();

      //decoy still exists
      await expect(
        BlacklistDal.contains({ name: "test" }),
      ).resolves.toBeTruthy();
      await expect(
        BlacklistDal.contains({ email: "test@example.com" }),
      ).resolves.toBeTruthy();
      await expect(
        BlacklistDal.contains({ discordId: "testDiscordId" }),
      ).resolves.toBeTruthy();
    });

    it("does not remove for empty user", async () => {
      //GIVEN
      const name = `user${crypto.randomUUID()}`;
      const email = `${name}@example.com`;
      const discordId = `${name}DiscordId`;
      await BlacklistDal.add({ name, email, discordId });
      await BlacklistDal.add({ name: "test", email: "test@example.com" });

      //WHEN
      await BlacklistDal.remove({});

      //THEN
      await expect(BlacklistDal.contains({ email })).resolves.toBeTruthy();
      await expect(BlacklistDal.contains({ name })).resolves.toBeTruthy();
      await expect(BlacklistDal.contains({ discordId })).resolves.toBeTruthy();
    });
  });
  describe("hash", () => {
    it("hashes case insensitive", () => {
      ["test", "TEST", "tESt"].forEach((value) =>
        expect(BlacklistDal.hash(value)).toEqual(
          "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        ),
      );
    });
  });
});
