import { collection } from "../init/db";
import { devGet, devSet } from "./dev-store";
import { isDevEnvironment } from "./misc";

export type PasswordDocument = {
  uid: string;
  passwordHash: string;
  createdAt: number;
};

export async function getPasswordDocument(
  uid: string,
): Promise<PasswordDocument | null> {
  if (isDevEnvironment()) {
    return devGet<PasswordDocument>(`pw_${uid}`);
  }
  return (await collection("user-passwords").findOne({
    uid,
  })) as PasswordDocument | null;
}

export async function savePasswordDocument(
  document: PasswordDocument,
): Promise<void> {
  if (isDevEnvironment()) {
    devSet(`pw_${document.uid}`, document);
    return;
  }
  await collection("user-passwords").insertOne(document);
}
