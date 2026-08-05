import * as db from "../init/db";
import { Language } from "@typeuz/schemas/languages";

type DBQuoteRating = {
  id: number;
  quote_id: number;
  language: string;
  average: number | null;
  ratings: number;
  total_rating: number;
};

export async function submit(
  quoteId: number,
  language: Language,
  rating: number,
  update: boolean,
): Promise<void> {
  if (update) {
    await db.query(
      `INSERT INTO quote_ratings (quote_id, language, total_rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (quote_id, language)
       DO UPDATE SET total_rating = quote_ratings.total_rating + $3`,
      [quoteId, language, rating],
    );
  } else {
    await db.query(
      `INSERT INTO quote_ratings (quote_id, language, ratings, total_rating)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (quote_id, language)
       DO UPDATE SET ratings = quote_ratings.ratings + 1, total_rating = quote_ratings.total_rating + $3`,
      [quoteId, language, rating],
    );
  }

  const quoteRating = await get(quoteId, language);
  if (quoteRating === null) {
    throw new Error("Quote rating is null after adding rating?");
  }
  const average = parseFloat(
    (
      Math.round((quoteRating.total_rating / quoteRating.ratings) * 10) / 10
    ).toFixed(1),
  );

  await db.query(
    "UPDATE quote_ratings SET average = $1 WHERE quote_id = $2 AND language = $3",
    [average, quoteId, language],
  );
}

export async function get(
  quoteId: number,
  language: Language,
): Promise<DBQuoteRating | null> {
  return await db.queryOne<DBQuoteRating>(
    "SELECT * FROM quote_ratings WHERE quote_id = $1 AND language = $2",
    [quoteId, language],
  );
}
