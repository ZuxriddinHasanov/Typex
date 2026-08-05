import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import {
  addApeKey,
  DBApeKey,
  editApeKey,
  getApeKey,
  updateLastUsedOn,
} from "../../../src/dal/ape-keys";

describe("ApeKeysDal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe("addApeKey", () => {
    it("should be able to add a new ape key", async () => {
      const apeKey = buildApeKey();

      const apeKeyId = await addApeKey(apeKey);

      expect(apeKeyId).toBe(apeKey._id);

      const read = await getApeKey(apeKeyId);
      expect(read).toEqual({
        ...apeKey,
      });
    });
  });

  describe("editApeKey", () => {
    it("should edit name of an existing ape key", async () => {
      //GIVEN
      const apeKey = buildApeKey({ use_count: 5, enabled: true });
      const apeKeyId = await addApeKey(apeKey);

      //WHEN
      const newName = "new name";
      await editApeKey(apeKey.uid, apeKeyId, newName, undefined);

      //THENa
      const readAfterEdit = (await getApeKey(apeKeyId)) as DBApeKey;
      expect(readAfterEdit).toEqual({
        ...apeKey,
        name: newName,
        modified_on: Date.now(),
      });
    });

    it("should edit enabled of an existing ape key", async () => {
      //GIVEN
      const apeKey = buildApeKey({ use_count: 5, enabled: true });
      const apeKeyId = await addApeKey(apeKey);

      //WHEN

      await editApeKey(apeKey.uid, apeKeyId, undefined, false);

      //THEN
      const readAfterEdit = (await getApeKey(apeKeyId)) as DBApeKey;
      expect(readAfterEdit).toEqual({
        ...apeKey,
        enabled: false,
        modified_on: Date.now(),
      });
    });
  });

  describe("updateLastUsedOn", () => {
    it("should update last_used_on and increment use_count when editing with last_used_on", async () => {
      //GIVEN
      const apeKey = buildApeKey({
        use_count: 5,
        last_used_on: 42,
      });
      const apeKeyId = await addApeKey(apeKey);

      //WHEN
      await updateLastUsedOn(apeKey.uid, apeKeyId);
      await updateLastUsedOn(apeKey.uid, apeKeyId);

      //THENa
      const readAfterEdit = (await getApeKey(apeKeyId)) as DBApeKey;
      expect(readAfterEdit).toEqual({
        ...apeKey,
        modified_on: readAfterEdit.modified_on,
        last_used_on: Date.now(),
        use_count: 5 + 2,
      });
    });
  });
});

function buildApeKey(overrides: Partial<DBApeKey> = {}): DBApeKey {
  return {
    _id: crypto.randomUUID(),
    uid: "123",
    name: "test",
    hash: "12345",
    created_on: Date.now(),
    modified_on: Date.now(),
    last_used_on: Date.now(),
    use_count: 0,
    enabled: true,
    ...overrides,
  };
}
