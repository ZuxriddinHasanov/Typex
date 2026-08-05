import { randomBytes } from "crypto";
import { hash } from "bcrypt";
import * as ApeKeysDAL from "../../dal/ape-keys";
import TypeUZError from "../../utils/error";
import { TypeUZResponse } from "../../utils/typeuz-response";
import { base64UrlEncode } from "../../utils/misc";

import {
  AddApeKeyRequest,
  AddApeKeyResponse,
  ApeKeyParams,
  EditApeKeyRequest,
  GetApeKeyResponse,
} from "@typeuz/contracts/ape-keys";
import { ApeKey } from "@typeuz/schemas/ape-keys";
import { TypeUZRequest } from "../types";

function cleanApeKey(apeKey: ApeKeysDAL.DBApeKey): ApeKey {
  return {
    name: apeKey.name,
    enabled: apeKey.enabled,
    createdOn: apeKey.created_on,
    modifiedOn: apeKey.modified_on,
    lastUsedOn: apeKey.last_used_on,
  };
}

export async function getApeKeys(
  req: TypeUZRequest,
): Promise<GetApeKeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const apeKeys = await ApeKeysDAL.getApeKeys(uid);
  const cleanedKeys: Record<string, ApeKey> = Object.fromEntries(
    apeKeys.map((item) => [item._id, cleanApeKey(item)]),
  );

  return new TypeUZResponse("ApeKeys retrieved", cleanedKeys);
}

export async function generateApeKey(
  req: TypeUZRequest<undefined, AddApeKeyRequest>,
): Promise<AddApeKeyResponse> {
  const { name, enabled } = req.body;
  const { uid } = req.ctx.decodedToken;
  const { maxKeysPerUser, apeKeyBytes, apeKeySaltRounds } =
    req.ctx.configuration.apeKeys;

  const currentNumberOfApeKeys = await ApeKeysDAL.countApeKeysForUser(uid);

  if (currentNumberOfApeKeys >= maxKeysPerUser) {
    throw new TypeUZError(409, "Maximum number of ApeKeys have been generated");
  }

  const apiKey = randomBytes(apeKeyBytes).toString("base64url");
  const saltyHash = await hash(apiKey, apeKeySaltRounds);

  const apeKey: ApeKeysDAL.DBApeKey = {
    _id: crypto.randomUUID(),
    name,
    enabled,
    uid,
    hash: saltyHash,
    created_on: Date.now(),
    modified_on: Date.now(),
    last_used_on: -1,
    use_count: 0,
  };

  const apeKeyId = await ApeKeysDAL.addApeKey(apeKey);

  return new TypeUZResponse("ApeKey generated", {
    apeKey: base64UrlEncode(`${apeKeyId}.${apiKey}`),
    apeKeyId,
    apeKeyDetails: cleanApeKey(apeKey),
  });
}

export async function editApeKey(
  req: TypeUZRequest<undefined, EditApeKeyRequest, ApeKeyParams>,
): Promise<TypeUZResponse> {
  const { apeKeyId } = req.params;
  const { name, enabled } = req.body;
  const { uid } = req.ctx.decodedToken;

  await ApeKeysDAL.editApeKey(uid, apeKeyId, name, enabled);

  return new TypeUZResponse("ApeKey updated", null);
}

export async function deleteApeKey(
  req: TypeUZRequest<undefined, undefined, ApeKeyParams>,
): Promise<TypeUZResponse> {
  const { apeKeyId } = req.params;
  const { uid } = req.ctx.decodedToken;

  await ApeKeysDAL.deleteApeKey(uid, apeKeyId);

  return new TypeUZResponse("ApeKey deleted", null);
}
