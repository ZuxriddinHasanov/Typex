import {
  CreateConnectionRequest,
  CreateConnectionResponse,
  GetConnectionsQuery,
  GetConnectionsResponse,
  IdPathParams,
  UpdateConnectionRequest,
} from "@typeuz/contracts/connections";
import { TypeUZRequest } from "../types";
import { TypeUZResponse } from "../../utils/typeuz-response";
import * as ConnectionsDal from "../../dal/connections";
import * as UserDal from "../../dal/user";
import TypeUZError from "../../utils/error";

import { Connection } from "@typeuz/schemas/connections";

type DBConnectionRow = {
  _id: string;
  initiator_uid: string;
  initiator_name: string;
  receiver_uid: string;
  receiver_name: string;
  last_modified: number;
  status: string;
};

function convert(db: DBConnectionRow): Connection {
  return {
    _id: db._id,
    initiatorUid: db.initiator_uid,
    initiatorName: db.initiator_name,
    receiverUid: db.receiver_uid,
    receiverName: db.receiver_name,
    lastModified: db.last_modified,
    status: db.status as Connection["status"],
  };
}
export async function getConnections(
  req: TypeUZRequest<GetConnectionsQuery>,
): Promise<GetConnectionsResponse> {
  const { uid } = req.ctx.decodedToken;
  const { status, type } = req.query;

  const results = await ConnectionsDal.getConnections({
    initiatorUid:
      type === undefined || type.includes("outgoing") ? uid : undefined,
    receiverUid:
      type === undefined || type?.includes("incoming") ? uid : undefined,
    status: status,
  });

  return new TypeUZResponse("Connections retrieved", results.map(convert));
}

export async function createConnection(
  req: TypeUZRequest<undefined, CreateConnectionRequest>,
): Promise<CreateConnectionResponse> {
  const { uid } = req.ctx.decodedToken;
  const { receiverName } = req.body;
  const { maxPerUser } = req.ctx.configuration.connections;

  const receiver = await UserDal.getUserByName(
    receiverName,
    "create connection",
  );

  if (uid === receiver.uid) {
    throw new TypeUZError(400, "You cannot be your own friend, sorry.");
  }

  const initiator = await UserDal.getPartialUser(uid, "create connection", [
    "uid",
    "name",
  ]);

  const result = await ConnectionsDal.create(initiator, receiver, maxPerUser);

  return new TypeUZResponse("Connection created", convert(result));
}

export async function deleteConnection(
  req: TypeUZRequest<undefined, undefined, IdPathParams>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { id } = req.params;

  await ConnectionsDal.deleteById(uid, id);

  return new TypeUZResponse("Connection deleted", null);
}

export async function updateConnection(
  req: TypeUZRequest<undefined, UpdateConnectionRequest, IdPathParams>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { id } = req.params;
  const { status } = req.body;

  await ConnectionsDal.updateStatus(uid, id, status);

  return new TypeUZResponse("Connection updated", null);
}
