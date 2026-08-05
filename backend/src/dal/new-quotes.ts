import { simpleGit } from "simple-git";
import path from "path";
import { existsSync, writeFileSync } from "fs";
import { readFile } from "node:fs/promises";
import * as db from "../init/db";
import TypeUZError from "../utils/error";
import { compareTwoStrings } from "string-similarity";
import { ApproveQuote } from "@typeuz/schemas/quotes";
import { parseWithSchema as parseJsonWithSchema } from "@typeuz/util/json";
import { z } from "zod";
import { tryCatchSync } from "@typeuz/util/trycatch";
import { Language } from "@typeuz/schemas/languages";

const JsonQuoteSchema = z.object({
  text: z.string(),
  britishText: z.string().optional(),
  approvedBy: z.string().optional(),
  source: z.string(),
  length: z.number(),
  id: z.number(),
});

const QuoteDataSchema = z.object({
  language: z.string(),
  quotes: z.array(JsonQuoteSchema),
  groups: z.array(z.tuple([z.number(), z.number()])),
});

const PATH_TO_REPO = "../../../../typeuz-new-quotes";
const repoPath = path.join(__dirname, PATH_TO_REPO);
const git = existsSync(repoPath)
  ? tryCatchSync(() => simpleGit(repoPath)).data
  : undefined;

if (!git) {
  console.warn("Git repo not available — new quotes workflow disabled.");
}

type AddQuoteReturn = {
  languageError?: number;
  duplicateId?: number;
  similarityScore?: number;
};

export type DBNewQuote = {
  _id: string;
  text: string;
  source: string;
  language: string;
  submitted_by: string;
  timestamp: number;
  approved: boolean;
};

export async function add(
  text: string,
  source: string,
  language: string,
  uid: string,
): Promise<AddQuoteReturn | undefined> {
  if (git === undefined) throw new TypeUZError(500, "Git not available.");

  if (!/^\w+$/.test(language)) {
    throw new TypeUZError(500, "Invalid language name", language);
  }

  const countResult = await db.queryOne<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM new_quotes WHERE language = $1",
    [language.toLowerCase()],
  );
  const count = countResult?.count ?? 0;

  if (count >= 100) {
    throw new TypeUZError(
      409,
      "There are already 100 quotes in the queue for this language.",
    );
  }

  const fileDir = path.join(
    __dirname,
    `${PATH_TO_REPO}/frontend/static/quotes/${language}.json`,
  );
  let duplicateId = -1;
  let similarityScore = -1;
  if (existsSync(fileDir)) {
    const quoteFile = await readFile(fileDir);
    const quoteFileJSON = parseJsonWithSchema(
      quoteFile.toString(),
      QuoteDataSchema,
    );
    quoteFileJSON.quotes.every((old) => {
      if (compareTwoStrings(old.text, text) > 0.9) {
        duplicateId = old.id;
        similarityScore = compareTwoStrings(old.text, text);
        return false;
      }
      return true;
    });
  } else {
    return { languageError: 1 };
  }
  if (duplicateId !== -1) {
    return { duplicateId, similarityScore };
  }

  await db.query(
    `INSERT INTO new_quotes (text, source, language, submitted_by, timestamp, approved)
     VALUES ($1, $2, $3, $4, $5, false)`,
    [text, source, language.toLowerCase(), uid, Date.now()],
  );
  return undefined;
}

export async function get(language: Language | "all"): Promise<DBNewQuote[]> {
  if (git === undefined) throw new TypeUZError(500, "Git not available.");

  if (!/^\w+$/.test(language)) {
    throw new TypeUZError(500, "Invalid language name", language);
  }

  if (language === "all") {
    return await db.queryAll<DBNewQuote>(
      "SELECT * FROM new_quotes WHERE approved = false ORDER BY timestamp ASC LIMIT 10",
    );
  }
  return await db.queryAll<DBNewQuote>(
    "SELECT * FROM new_quotes WHERE approved = false AND language = $1 ORDER BY timestamp ASC LIMIT 10",
    [language],
  );
}

type ApproveReturn = {
  quote: ApproveQuote;
  message: string;
};

export async function approve(
  quoteId: string,
  editQuote: string | undefined,
  editSource: string | undefined,
  name: string,
): Promise<ApproveReturn> {
  if (!git) throw new TypeUZError(500, "Git not available.");

  const targetQuote = await db.queryOne<DBNewQuote>(
    "SELECT * FROM new_quotes WHERE _id = $1::uuid",
    [quoteId],
  );
  if (!targetQuote) {
    throw new TypeUZError(
      404,
      "Quote not found. It might have already been reviewed. Please refresh the list.",
    );
  }

  const language = targetQuote.language;
  const quote: ApproveQuote = {
    text: editQuote ?? targetQuote.text,
    source: editSource ?? targetQuote.source,
    length: targetQuote.text.length,
    approvedBy: name,
    id: -1,
  };
  let message = "";

  if (!/^\w+$/.test(language)) {
    throw new TypeUZError(500, "Invalid language name", language);
  }

  const fileDir = path.join(
    __dirname,
    `${PATH_TO_REPO}/frontend/static/quotes/${language}.json`,
  );
  await git.pull("upstream", "master");
  if (existsSync(fileDir)) {
    const quoteFile = await readFile(fileDir);
    const quoteObject = parseJsonWithSchema(
      quoteFile.toString(),
      QuoteDataSchema,
    );
    quoteObject.quotes.every((old) => {
      if (compareTwoStrings(old.text, quote.text) > 0.8) {
        throw new TypeUZError(409, "Duplicate quote");
      }
      return true;
    });
    let maxid = 0;
    quoteObject.quotes.forEach((q) => {
      if (q.id > maxid) maxid = q.id;
    });
    quote.id = maxid + 1;

    if (quote.id === -1) {
      throw new TypeUZError(500, "Failed to get max id");
    }

    quoteObject.quotes.push(quote);
    writeFileSync(fileDir, JSON.stringify(quoteObject, null, 2));
    message = `Added quote to ${language}.json.`;
  } else {
    quote.id = 1;
    writeFileSync(
      fileDir,
      JSON.stringify({
        language: language,
        groups: [
          [0, 100],
          [101, 300],
          [301, 600],
          [601, 9999],
        ],
        quotes: [quote],
      }),
    );
    message = `Created file ${language}.json and added quote.`;
  }
  await git.add([`frontend/static/quotes/${language}.json`]);
  await git.commit(`Added quote to ${language}.json`);
  await git.push("origin", "master");
  await db.query("DELETE FROM new_quotes WHERE _id = $1::uuid", [quoteId]);
  return { quote, message };
}

export async function refuse(quoteId: string): Promise<void> {
  if (git === undefined) throw new TypeUZError(500, "Git not available.");
  await db.query("DELETE FROM new_quotes WHERE _id = $1::uuid", [quoteId]);
}
