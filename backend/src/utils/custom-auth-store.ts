import { query, queryOne } from "../init/db";

export type PasswordDocument = {
  uid: string;
  passwordHash: string;
  createdAt: number;
};

export async function getPasswordDocument(
  uid: string,
): Promise<PasswordDocument | null> {
  const row = await queryOne(
    "SELECT data FROM user_passwords WHERE uid = $1",
    [uid],
  );
  if (!row) return null;
  const data = typeof row["data"] === "string" ? JSON.parse(row["data"]) : row["data"];
  return data as PasswordDocument;
}

export async function savePasswordDocument(
  document: PasswordDocument,
): Promise<void> {
  await query(
    "INSERT INTO user_passwords (uid, data) VALUES ($1, $2) ON CONFLICT (uid) DO UPDATE SET data = EXCLUDED.data",
    [document.uid, JSON.stringify(document)],
  );
}
