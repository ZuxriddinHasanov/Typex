import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";

import * as ConnectionsDal from "../../../src/dal/connections";
import { createConnection } from "../../__testData__/connections";
import { createUser } from "../../__testData__/users";

describe("ConnectionsDal", () => {
  beforeAll(async () => {
    await ConnectionsDal.createIndicies();
  });

  describe("getRequests", () => {
    it("get by uid", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const initOne = await createConnection({ initiator_uid: uid });
      const initTwo = await createConnection({ initiator_uid: uid });
      const friendOne = await createConnection({ receiver_uid: uid });
      const _decoy = await createConnection({});

      //WHEN / THEM

      expect(
        await ConnectionsDal.getConnections({ initiatorUid: uid,
          receiverUid: uid,
        }),
      ).toStrictEqual([initOne, initTwo, friendOne]);
    });

    it("get by uid and status", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const initAccepted = await createConnection({
        initiator_uid: uid,
        status: "accepted",
      });
      const _initPending = await createConnection({
        initiator_uid: uid,
        status: "pending",
      });
      const initBlocked = await createConnection({
        initiator_uid: uid,
        status: "blocked",
      });

      const friendAccepted = await createConnection({
        receiver_uid: uid,
        status: "accepted",
      });
      const _friendPending = await createConnection({
        receiver_uid: uid,
        status: "pending",
      });

      const _decoy = await createConnection({ status: "accepted" });

      //WHEN / THEN

      expect(
        await ConnectionsDal.getConnections({ initiatorUid: uid,
          receiverUid: uid,
          status: ["accepted", "blocked"],
        }),
      ).toStrictEqual([initAccepted, initBlocked, friendAccepted]);
    });
  });

  describe("create", () => {
    const now = 1715082588;
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("should fail creating duplicates", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const first = await createConnection({
        initiator_uid: uid,
      });

      //WHEN/THEN
      await expect(
        createConnection({
          initiator_uid: first.receiver_uid,
          receiver_uid: uid,
        }),
      ).rejects.toThrow("Connection request already sent");
    });

    it("should create", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const receiver_uid = crypto.randomUUID();

      //WHEN
      const created = await ConnectionsDal.create(
        { uid, name: "Bob" },
        { uid: receiver_uid, name: "Kevin" },
        2,
      );

      //THEN
      expect(created).toEqual({
        _id: created._id,
        initiatorUid: uid,
        initiator_name: "Bob",
        receiverUid: receiver_uid,
        receiver_name: "Kevin",
        last_modified: now,
        status: "pending",
        key: `${uid}/${receiver_uid}`,
      });
    });

    it("should fail if maximum connections are reached", async () => {
      //GIVEN
      const initiator_uid = crypto.randomUUID();
      await createConnection({ initiator_uid });
      await createConnection({ initiator_uid });

      //WHEN / THEM
      await expect(createConnection({ initiator_uid }, 2)).rejects.toThrow(
        "Maximum number of connections reached\nStack: create connection request",
      );
    });

    it("should fail creating if blocked", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const first = await createConnection({
        initiator_uid: uid,
        status: "blocked",
      });

      //WHEN/THEN
      await expect(
        createConnection({
          initiator_uid: first.receiver_uid,
          receiver_uid: uid,
        }),
      ).rejects.toThrow("Connection blocked");
    });
  });
  describe("updateStatus", () => {
    const now = 1715082588;
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });
    afterEach(() => {
      vi.useRealTimers();
    });
    it("should update the status", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const first = await createConnection({
        receiver_uid: uid,
        last_modified: 100,
      });
      const second = await createConnection({
        receiver_uid: uid,
        last_modified: 200,
      });

      //WHEN
      await ConnectionsDal.updateStatus(
        uid,
        first._id,
        "accepted",
      );

      //THEN
      expect(await ConnectionsDal.getConnections({ receiverUid: uid })).toEqual(
        [{ ...first, status: "accepted", last_modified: now }, second],
      );

      //can update twice to the same status
      await ConnectionsDal.updateStatus(
        uid,
        first._id,
        "accepted",
      );
    });
    it("should fail if uid does not match the reeceiverUid", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const first = await createConnection({
        initiator_uid: uid,
      });

      //WHEN / THEN
      await expect(
        ConnectionsDal.updateStatus(uid, first._id, "accepted"),
      ).rejects.toThrow("No permission or connection not found");
    });
  });

  describe("deleteById", () => {
    it("should delete by initiator", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const first = await createConnection({
        initiator_uid: uid,
      });
      const second = await createConnection({
        initiator_uid: uid,
      });

      //WHEN
      await ConnectionsDal.deleteById(uid, first._id);

      //THEN
      expect(
        await ConnectionsDal.getConnections({ initiatorUid: uid }),
      ).toStrictEqual([second]);
    });

    it("should delete by receiver", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const first = await createConnection({
        receiver_uid: uid,
      });
      const second = await createConnection({
        receiver_uid: uid,
        status: "accepted",
      });

      //WHEN
      await ConnectionsDal.deleteById(uid, first._id);

      //THEN
      expect(
        await ConnectionsDal.getConnections({ initiatorUid: second.initiator_uid,
        }),
      ).toStrictEqual([second]);
    });

    it("should fail if uid does not match", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const first = await createConnection({
        initiator_uid: uid,
      });

      //WHEN / THEN
      await expect(
        ConnectionsDal.deleteById("Bob", first._id),
      ).rejects.toThrow("No permission or connection not found");
    });

    it("should fail if initiator deletes blocked by receiver", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const myRequestWasBlocked = await createConnection({
        initiator_name: uid,
        status: "blocked",
      });

      //WHEN / THEN
      await expect(
        ConnectionsDal.deleteById(uid, myRequestWasBlocked._id),
      ).rejects.toThrow("No permission or connection not found");
    });
    it("allow receiver to delete blocked", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const myBlockedUser = await createConnection({
        receiver_uid: uid,
        status: "blocked",
      });

      //WHEN
      await ConnectionsDal.deleteById(uid, myBlockedUser._id);

      //THEN
      expect(await ConnectionsDal.getConnections({ receiverUid: uid })).toEqual(
        [],
      );
    });
  });

  describe("deleteByUid", () => {
    it("should delete by uid", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const _initOne = await createConnection({ initiator_uid: uid });
      const _initTwo = await createConnection({ initiator_uid: uid });
      const _friendOne = await createConnection({ receiver_uid: uid });
      const decoy = await createConnection({});

      //WHEN
      await ConnectionsDal.deleteByUid(uid);

      //THEN
      expect(
        await ConnectionsDal.getConnections({ initiatorUid: uid,
          receiverUid: uid,
        }),
      ).toEqual([]);

      expect(
        await ConnectionsDal.getConnections({ initiatorUid: decoy.initiator_uid,
        }),
      ).toEqual([decoy]);
    });
  });
  describe("updateName", () => {
    it("should update the name", async () => {
      //GIVEN
      const uid = crypto.randomUUID();
      const initOne = await createConnection({
        initiator_uid: uid,
        initiator_name: "Bob",
      });
      const initTwo = await createConnection({
        initiator_uid: uid,
        initiator_name: "Bob",
      });
      const friendOne = await createConnection({
        receiver_uid: uid,
        receiver_name: "Bob",
      });
      const decoy = await createConnection({});

      //WHEN
      await ConnectionsDal.updateName(uid, "King Bob");

      //THEN
      expect(
        await ConnectionsDal.getConnections({ initiatorUid: uid,
          receiverUid: uid,
        }),
      ).toEqual([
        { ...initOne, initiator_name: "King Bob" },
        { ...initTwo, initiator_name: "King Bob" },
        { ...friendOne, receiver_name: "King Bob" },
      ]);

      expect(
        await ConnectionsDal.getConnections({ initiatorUid: decoy.initiator_uid,
        }),
      ).toEqual([decoy]);
    });
  });

  describe("getFriendsUids", () => {
    it("should return friend uids", async () => {
      //GIVE
      const uid = crypto.randomUUID();
      const friendOne = await createConnection({
        initiator_uid: uid,
        status: "accepted",
      });
      const friendTwo = await createConnection({
        receiver_uid: uid,
        status: "accepted",
      });
      const friendThree = await createConnection({
        receiver_uid: uid,
        status: "accepted",
      });
      const _pending = await createConnection({
        initiator_uid: uid,
        status: "pending",
      });
      const _blocked = await createConnection({
        initiator_uid: uid,
        status: "blocked",
      });
      const _decoy = await createConnection({});

      //WHEN
      const friendUids = await ConnectionsDal.getFriendsUids(uid);

      //THEN
      expect(friendUids).toEqual([
        uid,
        friendOne.receiver_uid,
        friendTwo.initiator_uid,
        friendThree.initiator_uid,
      ]);
    });
  });

  describe("aggregateWithAcceptedConnections", () => {
    it("should return friend uids", async () => {
      //GIVE
      const uid = (await createUser()).uid;
      const friendOne = await createConnection({
        initiator_uid: uid,
        receiver_uid: (await createUser()).uid,
        status: "accepted",
      });
      const friendTwo = await createConnection({
        initiator_uid: (await createUser()).uid,
        receiver_uid: uid,
        status: "accepted",
      });
      const friendThree = await createConnection({
        initiator_uid: (await createUser()).uid,
        receiver_uid: uid,
        status: "accepted",
      });
      const _pending = await createConnection({
        initiator_uid: uid,
        receiver_uid: (await createUser()).uid,
        status: "pending",
      });
      const _blocked = await createConnection({
        initiator_uid: uid,
        receiver_uid: (await createUser()).uid,
        status: "blocked",
      });
      const _decoy = await createConnection({
        receiver_uid: (await createUser()).uid,
        status: "accepted",
      });

      //WHEN
      const friendUids = await ConnectionsDal.aggregateWithAcceptedConnections<{
        uid: string;
      }>({ collectionName: "users", uid }, [{ $project: { uid: true } }]);

      //THEN
      expect(friendUids.flatMap((it) => it.uid).toSorted()).toEqual([
        uid,
        friendOne.receiver_uid,
        friendTwo.initiator_uid,
        friendThree.initiator_uid,
      ]);
    });
    it("should return friend uids and metaData", async () => {
      //GIVE
      const me = await createUser();
      const friend = await createUser();

      const connection = await createConnection({
        initiator_uid: me.uid,
        receiver_uid: friend.uid,
        status: "accepted",
      });

      //WHEN
      const friendUids = await ConnectionsDal.aggregateWithAcceptedConnections(
        { collectionName: "users", uid: me.uid, includeMetaData: true },
        [
          {
            $project: {
              uid: true,
              last_modified: "$connectionMeta.last_modified",
              connectionId: "$connectionMeta._id",
            },
          },
        ],
      );

      //THEN
      expect(friendUids).toEqual([
        {
          _id: friend.uid,
          connectionId: connection._id,
          last_modified: connection.last_modified,
          uid: friend.uid,
        },
        {
          _id: me.uid,
          uid: me.uid,
        },
      ]);
    });
  });
});
