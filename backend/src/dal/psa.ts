import * as db from "../init/db";

export type DBPSA = {
  _id: string;
  message: string;
  date?: number;
  level?: number;
  sticky?: boolean;
};

export async function get(): Promise<DBPSA[]> {
  return await db.queryAll<DBPSA>("SELECT * FROM psa");
}
