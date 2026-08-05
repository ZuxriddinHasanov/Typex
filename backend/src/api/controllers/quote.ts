import { v4 as uuidv4 } from "uuid";
import { getPartialUser, updateQuoteRatings } from "../../dal/user";
import * as ReportDAL from "../../dal/report";
import * as NewQuotesDAL from "../../dal/new-quotes";
import * as QuoteRatingsDAL from "../../dal/quote-ratings";
import TypeUZError from "../../utils/error";
import { verify } from "../../utils/captcha";
import { TypeUZResponse } from "../../utils/typeuz-response";
import { addLog } from "../../dal/logs";
import {
  AddQuoteRatingRequest,
  AddQuoteRequest,
  ApproveQuoteRequest,
  ApproveQuoteResponse,
  GetQuoteRatingQuery,
  GetQuoteRatingResponse,
  GetQuotesResponse,
  IsSubmissionEnabledResponse,
  RejectQuoteRequest,
  ReportQuoteRequest,
} from "@typeuz/contracts/quotes";
import { TypeUZRequest } from "../types";
import { Language } from "@typeuz/schemas/languages";

async function verifyCaptcha(captcha: string): Promise<void> {
  if (!(await verify(captcha))) {
    throw new TypeUZError(422, "Captcha check failed");
  }
}

export async function getQuotes(
  req: TypeUZRequest,
): Promise<GetQuotesResponse> {
  const { uid } = req.ctx.decodedToken;
  const quoteMod = (await getPartialUser(uid, "get quotes", ["quoteMod"]))
    .quoteMod;
  const quoteModLanguage = quoteMod === true ? "all" : (quoteMod as Language);

  const data = await NewQuotesDAL.get(quoteModLanguage);
  return new TypeUZResponse(
    "Quote submissions retrieved",
    data as never,
  );
}

export async function isSubmissionEnabled(
  req: TypeUZRequest,
): Promise<IsSubmissionEnabledResponse> {
  const { submissionsEnabled } = req.ctx.configuration.quotes;
  return new TypeUZResponse(
    `Quote submission ${submissionsEnabled ? "enabled" : "disabled"}`,
    { isEnabled: submissionsEnabled },
  );
}

export async function addQuote(
  req: TypeUZRequest<undefined, AddQuoteRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { text, source, language, captcha } = req.body;

  await verifyCaptcha(captcha);

  await NewQuotesDAL.add(text, source, language, uid);
  return new TypeUZResponse("Quote submission added", null);
}

export async function approveQuote(
  req: TypeUZRequest<undefined, ApproveQuoteRequest>,
): Promise<ApproveQuoteResponse> {
  const { uid } = req.ctx.decodedToken;
  const { quoteId, editText, editSource } = req.body;

  const { name } = await getPartialUser(uid, "approve quote", ["name"]);

  if (!name) {
    throw new TypeUZError(500, "Missing name field");
  }

  const data = await NewQuotesDAL.approve(quoteId, editText, editSource, name);
  void addLog("system_quote_approved", data, uid);

  return new TypeUZResponse(data.message, data.quote);
}

export async function refuseQuote(
  req: TypeUZRequest<undefined, RejectQuoteRequest>,
): Promise<TypeUZResponse> {
  const { quoteId } = req.body;

  await NewQuotesDAL.refuse(quoteId);
  return new TypeUZResponse("Quote refused", null);
}

export async function getRating(
  req: TypeUZRequest<GetQuoteRatingQuery>,
): Promise<GetQuoteRatingResponse> {
  const { quoteId, language } = req.query;

  const data = await QuoteRatingsDAL.get(quoteId, language);

  return new TypeUZResponse("Rating retrieved", data as never);
}

export async function submitRating(
  req: TypeUZRequest<undefined, AddQuoteRatingRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const { quoteId, rating, language } = req.body;

  const user = await getPartialUser(uid, "submit rating", ["quoteRatings"]);

  const userQuoteRatings = user.quoteRatings ?? {};
  const currentRating = userQuoteRatings[language]?.[quoteId] ?? 0;

  const newRating = rating - currentRating;
  const shouldUpdateRating = currentRating !== 0;

  await QuoteRatingsDAL.submit(
    quoteId,
    language,
    newRating,
    shouldUpdateRating,
  );

  userQuoteRatings[language] ??= {};
  userQuoteRatings[language][quoteId] = rating;

  await updateQuoteRatings(uid, userQuoteRatings);

  const responseMessage = `Rating ${
    shouldUpdateRating ? "updated" : "submitted"
  }`;
  return new TypeUZResponse(responseMessage, null);
}

export async function reportQuote(
  req: TypeUZRequest<undefined, ReportQuoteRequest>,
): Promise<TypeUZResponse> {
  const { uid } = req.ctx.decodedToken;
  const {
    reporting: { maxReports, contentReportLimit },
  } = req.ctx.configuration.quotes;

  const { quoteId, quoteLanguage, reason, comment, captcha } = req.body;

  await verifyCaptcha(captcha);

  const newReport: ReportDAL.DBReport = {
    id: uuidv4(),
    type: "quote",
    timestamp: new Date().getTime(),
    uid,
    content_id: `${quoteLanguage}-${quoteId}`,
    reason,
    comment: comment ?? "",
  };

  await ReportDAL.createReport(newReport, maxReports, contentReportLimit);

  return new TypeUZResponse("Quote reported", null);
}
