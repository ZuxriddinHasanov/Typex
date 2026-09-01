import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { IdSchema } from "@typeuz/schemas/util";
import {
  CommonResponses,
  meta,
  TypeUZResponseSchema,
  responseWithData,
} from "./util/api";

export const ToggleBanRequestSchema = z
  .object({
    uid: IdSchema,
  })
  .strict();
export type ToggleBanRequest = z.infer<typeof ToggleBanRequestSchema>;

export const ClearStreakHourOffsetRequestSchema = z
  .object({
    uid: IdSchema,
  })
  .strict();
export type ClearStreakHourOffsetRequest = z.infer<
  typeof ClearStreakHourOffsetRequestSchema
>;

export const ToggleBanResponseSchema = responseWithData(
  z.object({
    banned: z.boolean(),
  }),
).strict();
export type ToggleBanResponse = z.infer<typeof ToggleBanResponseSchema>;

export const AcceptReportsRequestSchema = z
  .object({
    reports: z.array(z.object({ reportId: z.string() }).strict()).nonempty(),
  })
  .strict();
export type AcceptReportsRequest = z.infer<typeof AcceptReportsRequestSchema>;

export const RejectReportsRequestSchema = z
  .object({
    reports: z
      .array(
        z
          .object({ reportId: z.string(), reason: z.string().optional() })
          .strict(),
      )
      .nonempty(),
  })
  .strict();
export type RejectReportsRequest = z.infer<typeof RejectReportsRequestSchema>;

export const SendForgotPasswordEmailRequestSchema = z
  .object({
    email: z.string().email(),
  })
  .strict();
export type SendForgotPasswordEmailRequest = z.infer<
  typeof SendForgotPasswordEmailRequestSchema
>;

// --- Analytics (getAnalytics) ---
export const AdminAnalyticsResponseDataSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  totalTestsStarted: z.number().int().nonnegative(),
  totalTestsCompleted: z.number().int().nonnegative(),
  totalTimeTyping: z.number().nonnegative(),
  activeUsersLast24h: z.number().int().nonnegative(),
});
export type AdminAnalyticsResponseData = z.infer<
  typeof AdminAnalyticsResponseDataSchema
>;
export const AdminAnalyticsResponseSchema = responseWithData(
  AdminAnalyticsResponseDataSchema,
);
export type AdminAnalyticsResponse = z.infer<
  typeof AdminAnalyticsResponseSchema
>;

// --- Search Users ---
export const AdminSearchUsersQuerySchema = z
  .object({
    q: z.string().min(1).max(100),
  })
  .strict();
export type AdminSearchUsersQuery = z.infer<
  typeof AdminSearchUsersQuerySchema
>;

export const AdminUserSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string(),
  banned: z.boolean().optional(),
  addedAt: z.number().int().nonnegative().optional(),
  completedTests: z.number().int().nonnegative().optional(),
  timeTyping: z.number().nonnegative().optional(),
});
export type AdminUser = z.infer<typeof AdminUserSchema>;

export const AdminSearchUsersResponseSchema = responseWithData(
  z.array(AdminUserSchema),
);
export type AdminSearchUsersResponse = z.infer<
  typeof AdminSearchUsersResponseSchema
>;

// --- Activity (getActivity) ---
export const AdminActivityDataPointSchema = z.object({
  date: z.string(),
  tests: z.number().int().nonnegative(),
  users: z.number().int().nonnegative(),
});
export type AdminActivityDataPoint = z.infer<
  typeof AdminActivityDataPointSchema
>;

export const AdminActivityResponseDataSchema = z.object({
  data: z.array(AdminActivityDataPointSchema),
});
export type AdminActivityResponseData = z.infer<
  typeof AdminActivityResponseDataSchema
>;

export const AdminActivityResponseSchema = responseWithData(
  AdminActivityResponseDataSchema,
);
export type AdminActivityResponse = z.infer<
  typeof AdminActivityResponseSchema
>;

// --- Send Notification ---
export const SendNotificationRequestSchema = z
  .object({
    uid: z.string(),
    subject: z.string().min(1).max(200),
    body: z.string().min(1).max(2000),
  })
  .strict();
export type SendNotificationRequest = z.infer<
  typeof SendNotificationRequestSchema
>;

// --- Ad Config ---
export const AdminCreativeSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  targetUrl: z.string(),
  enabled: z.boolean().optional(),
});
export type AdminCreative = z.infer<typeof AdminCreativeSchema>;

export const AdminAdSlotSchema = z.object({
  slotId: z.string(),
  creativeId: z.string().optional(),
  imageUrl: z.string().optional(),
  targetUrl: z.string().optional(),
  enabled: z.boolean(),
});
export type AdminAdSlot = z.infer<typeof AdminAdSlotSchema>;

export const AdminAdConfigResponseDataSchema = z.object({
  enabled: z.boolean(),
  masterToggle: z.boolean(),
  slots: z.array(AdminAdSlotSchema),
  creatives: z.array(AdminCreativeSchema),
});
export type AdminAdConfigResponseData = z.infer<
  typeof AdminAdConfigResponseDataSchema
>;

export const AdminAdConfigResponseSchema = responseWithData(
  AdminAdConfigResponseDataSchema,
);
export type AdminAdConfigResponse = z.infer<
  typeof AdminAdConfigResponseSchema
>;

export const UpdateAdConfigRequestSchema = z
  .object({
    enabled: z.boolean(),
    masterToggle: z.boolean(),
    slots: z.array(AdminAdSlotSchema),
    creatives: z.array(AdminCreativeSchema),
  })
  .strict();
export type UpdateAdConfigRequest = z.infer<
  typeof UpdateAdConfigRequestSchema
>;

// --- Add Creative ---
export const AddCreativeRequestSchema = z
  .object({
    imageUrl: z.string().url(),
    targetUrl: z.string().url(),
  })
  .strict();
export type AddCreativeRequest = z.infer<typeof AddCreativeRequestSchema>;

export const AddCreativeResponseSchema = responseWithData(
  AdminCreativeSchema,
);
export type AddCreativeResponse = z.infer<typeof AddCreativeResponseSchema>;

// --- Delete Creative ---
export const DeleteCreativeParamsSchema = z
  .object({
    id: z.string(),
  })
  .strict();
export type DeleteCreativeParams = z.infer<
  typeof DeleteCreativeParamsSchema
>;

const c = initContract();
export const adminContract = c.router(
  {
    test: {
      summary: "test permission",
      description: "Check for admin permission for the current user",
      method: "GET",
      path: "",
      responses: {
        200: TypeUZResponseSchema,
      },
    },
    toggleBan: {
      summary: "toggle user ban",
      description: "Ban an unbanned user or unban a banned user.",
      method: "POST",
      path: "/toggleBan",
      body: ToggleBanRequestSchema,
      responses: {
        200: ToggleBanResponseSchema,
      },
    },
    clearStreakHourOffset: {
      summary: "clear streak hour offset",
      description: "Clear the streak hour offset for a user",
      method: "POST",
      path: "/clearStreakHourOffset",
      body: ClearStreakHourOffsetRequestSchema,
      responses: {
        200: TypeUZResponseSchema,
      },
    },
    acceptReports: {
      summary: "accept reports",
      description: "Accept one or many reports",
      method: "POST",
      path: "/report/accept",
      body: AcceptReportsRequestSchema,
      responses: {
        200: TypeUZResponseSchema,
      },
    },
    rejectReports: {
      summary: "reject reports",
      description: "Reject one or many reports",
      method: "POST",
      path: "/report/reject",
      body: RejectReportsRequestSchema,
      responses: {
        200: TypeUZResponseSchema,
      },
    },
    sendForgotPasswordEmail: {
      summary: "send forgot password email",
      description: "Send a forgot password email to the given user email",
      method: "POST",
      path: "/sendForgotPasswordEmail",
      body: SendForgotPasswordEmailRequestSchema,
      responses: {
        200: TypeUZResponseSchema,
      },
    },
    getAnalytics: {
      summary: "get analytics",
      description: "Get admin analytics data",
      method: "GET",
      path: "/analytics",
      responses: {
        200: AdminAnalyticsResponseSchema,
      },
    },
    searchUsers: {
      summary: "search users",
      description: "Search users by query string",
      method: "GET",
      path: "/users",
      query: AdminSearchUsersQuerySchema,
      responses: {
        200: AdminSearchUsersResponseSchema,
      },
    },
    getActivity: {
      summary: "get activity",
      description: "Get platform activity data",
      method: "GET",
      path: "/activity",
      responses: {
        200: AdminActivityResponseSchema,
      },
    },
    sendNotification: {
      summary: "send notification",
      description: "Send a notification to a user",
      method: "POST",
      path: "/sendNotification",
      body: SendNotificationRequestSchema,
      responses: {
        200: TypeUZResponseSchema,
      },
    },
    getAdConfig: {
      summary: "get ad config",
      description: "Get the full ad configuration (admin view)",
      method: "GET",
      path: "/ads",
      responses: {
        200: AdminAdConfigResponseSchema,
      },
    },
    updateAdConfig: {
      summary: "update ad config",
      description: "Update the ad configuration",
      method: "POST",
      path: "/ads",
      body: UpdateAdConfigRequestSchema,
      responses: {
        200: AdminAdConfigResponseSchema,
      },
    },
    addCreative: {
      summary: "add creative",
      description: "Add a new ad creative",
      method: "POST",
      path: "/ads/creatives",
      body: AddCreativeRequestSchema,
      responses: {
        200: AddCreativeResponseSchema,
      },
    },
    deleteCreative: {
      summary: "delete creative",
      description: "Delete an ad creative",
      method: "DELETE",
      path: "/ads/creatives/:id",
      pathParams: DeleteCreativeParamsSchema,
      responses: {
        200: TypeUZResponseSchema,
      },
    },

    // --- Site Content ---
    getSiteContent: {
      summary: "get site content",
      method: "GET",
      path: "/content",
      responses: {
        200: responseWithData(z.object({
          hero: z.object({ title: z.string(), subtitle: z.string(), description: z.string() }),
          features: z.array(z.object({ icon: z.string(), title: z.string(), description: z.string() })),
          aboutCards: z.array(z.object({ icon: z.string(), title: z.string(), description: z.string() })),
          footer: z.object({ brandName: z.string(), tagline: z.string(), telegram: z.string() }),
        })),
      },
    },
    updateSiteContent: {
      summary: "update site content",
      method: "PUT",
      path: "/content",
      body: z.object({
        hero: z.object({ title: z.string(), subtitle: z.string(), description: z.string() }),
        features: z.array(z.object({ icon: z.string(), title: z.string(), description: z.string() })),
        aboutCards: z.array(z.object({ icon: z.string(), title: z.string(), description: z.string() })),
        footer: z.object({ brandName: z.string(), tagline: z.string(), telegram: z.string() }),
      }),
      responses: { 200: TypeUZResponseSchema },
    },

    // --- Theme Overrides ---
    getThemeSettings: {
      summary: "get theme settings",
      method: "GET",
      path: "/theme",
      responses: {
        200: responseWithData(z.object({
          accentColor: z.string(),
          isDark: z.boolean().optional(),
        })),
      },
    },
    updateThemeSettings: {
      summary: "update theme settings",
      method: "PUT",
      path: "/theme",
      body: z.object({ accentColor: z.string(), isDark: z.boolean().optional() }),
      responses: { 200: TypeUZResponseSchema },
    },

    // --- Analytics ---
    getSignupsByDay: {
      summary: "signups per day (last 30 days)",
      method: "GET",
      path: "/analytics/signups",
      responses: {
        200: responseWithData(z.array(z.object({ date: z.string(), count: z.number() }))),
      },
    },
    getLoginsByDay: {
      summary: "logins per day (last 30 days)",
      method: "GET",
      path: "/analytics/logins",
      responses: {
        200: responseWithData(z.array(z.object({ date: z.string(), count: z.number() }))),
      },
    },
    getLoginsByWeek: {
      summary: "logins per week (last 12 weeks)",
      method: "GET",
      path: "/analytics/logins/weekly",
      responses: {
        200: responseWithData(z.array(z.object({ week: z.string(), count: z.number() }))),
      },
    },
  },
  {
    pathPrefix: "/admin",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "admin",
      authenticationOptions: { noCache: true },
      rateLimit: "adminLimit",
      requirePermission: "admin",
      requireConfiguration: {
        path: "admin.endpointsEnabled",
        invalidMessage: "Admin endpoints are currently disabled.",
      },
    }),

    commonResponses: CommonResponses,
  },
);
