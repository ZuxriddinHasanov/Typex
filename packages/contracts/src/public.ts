import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { CommonResponses, meta, responseWithData } from "./util/api";
import {
  SpeedHistogramSchema,
  TypingStatsSchema,
} from "@typeuz/schemas/public";
import { Mode2Schema, ModeSchema } from "@typeuz/schemas/shared";
import { LanguageSchema } from "@typeuz/schemas/languages";

export const GetSpeedHistogramQuerySchema = z
  .object({
    language: LanguageSchema,
    mode: ModeSchema,
    mode2: Mode2Schema,
  })
  .strict();
export type GetSpeedHistogramQuery = z.infer<
  typeof GetSpeedHistogramQuerySchema
>;

export const GetSpeedHistogramResponseSchema =
  responseWithData(SpeedHistogramSchema);
export type GetSpeedHistogramResponse = z.infer<
  typeof GetSpeedHistogramResponseSchema
>;

export const GetTypingStatsResponseSchema = responseWithData(TypingStatsSchema);
export type GetTypingStatsResponse = z.infer<
  typeof GetTypingStatsResponseSchema
>;

export const PublicAdSlotInfoSchema = z.object({
  slotId: z.string(),
  imageUrl: z.string().optional(),
  targetUrl: z.string().optional(),
});
export const PublicAdConfigResponseSchema = responseWithData(
  z.object({
    enabled: z.boolean(),
    slots: z.array(PublicAdSlotInfoSchema),
  }),
);

const c = initContract();
export const publicContract = c.router(
  {
    getSpeedHistogram: {
      summary: "get speed histogram",
      description:
        "get number of users personal bests grouped by wpm level (multiples of ten)",
      method: "GET",
      path: "/speedHistogram",
      query: GetSpeedHistogramQuerySchema,
      responses: {
        200: GetSpeedHistogramResponseSchema,
      },
    },

    getTypingStats: {
      summary: "get typing stats",
      description: "get number of tests and time users spend typing.",
      method: "GET",
      path: "/typingStats",
      responses: {
        200: GetTypingStatsResponseSchema,
      },
    },
    getAdConfig: {
      summary: "get public ad config",
      description: "Get ad slot configuration for the public site",
      method: "GET",
      path: "/ads",
      responses: {
        200: PublicAdConfigResponseSchema,
      },
    },
    getSiteContent: {
      summary: "get site content for landing page",
      description: "Get editable site content (hero, features, about, footer)",
      method: "GET",
      path: "/site-content",
      responses: {
        200: responseWithData(z.object({
          hero: z.object({ title: z.string(), subtitle: z.string(), description: z.string() }),
          features: z.array(z.object({ icon: z.string(), title: z.string(), description: z.string() })),
          aboutCards: z.array(z.object({ icon: z.string(), title: z.string(), description: z.string() })),
          footer: z.object({ brandName: z.string(), tagline: z.string(), telegram: z.string() }),
        })),
      },
    },
  },
  {
    pathPrefix: "/public",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "public",
      authenticationOptions: {
        isPublic: true,
      },
      rateLimit: "publicStatsGet",
    }),
    commonResponses: CommonResponses,
  },
);
