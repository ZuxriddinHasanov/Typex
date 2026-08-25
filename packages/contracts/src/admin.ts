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
  ;
export type ToggleBanRequest = z.infer<typeof ToggleBanRequestSchema>;

export const ClearStreakHourOffsetRequestSchema = z
  .object({
    uid: IdSchema,
  })
  ;
export type ClearStreakHourOffsetRequest = z.infer<
  typeof ClearStreakHourOffsetRequestSchema
>;

export const ToggleBanResponseSchema = responseWithData(
  z.object({
    banned: z.boolean(),
  }),
);
export type ToggleBanResponse = z.infer<typeof ToggleBanResponseSchema>;

export const DeleteUserRequestSchema = z
  .object({
    uid: IdSchema,
  })
  ;
export type DeleteUserRequest = z.infer<typeof DeleteUserRequestSchema>;

export const AcceptReportsRequestSchema = z
  .object({
    reports: z.array(z.object({ reportId: z.string() }).strict()).nonempty(),
  })
  ;
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
  ;
export type RejectReportsRequest = z.infer<typeof RejectReportsRequestSchema>;

export const SendForgotPasswordEmailRequestSchema = z
  .object({
    email: z.string().email(),
  })
  ;
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
  ;
export type AdminSearchUsersQuery = z.infer<typeof AdminSearchUsersQuerySchema>;

export const AdminUserSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string(),
  banned: z.boolean().optional(),
  addedAt: z.number().int().nonnegative().optional(),
  completedTests: z.number().int().nonnegative().optional(),
  timeTyping: z.number().nonnegative().optional(),
  lastTest: z.any().optional(),
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
export type AdminActivityResponse = z.infer<typeof AdminActivityResponseSchema>;

// --- Notification History ---
export const AdminNotificationRecordSchema = z.object({
  id: z.string(),
  uid: z.string(),
  subject: z.string(),
  body: z.string(),
  timestamp: z.number(),
  read: z.boolean(),
});
export type AdminNotificationRecord = z.infer<
  typeof AdminNotificationRecordSchema
>;

export const AdminNotificationsResponseSchema = responseWithData(
  z.array(AdminNotificationRecordSchema),
);
export type AdminNotificationsResponse = z.infer<
  typeof AdminNotificationsResponseSchema
>;

// --- Legal Content ---
export const AdminLegalContentResponseDataSchema = z.object({
  privacy: z.object({ title: z.string(), content: z.string() }),
  terms: z.object({ title: z.string(), content: z.string() }),
  security: z.object({ title: z.string(), content: z.string() }),
});
export type AdminLegalContentResponseData = z.infer<
  typeof AdminLegalContentResponseDataSchema
>;

export const AdminLegalContentResponseSchema = responseWithData(
  AdminLegalContentResponseDataSchema,
);
export type AdminLegalContentResponse = z.infer<
  typeof AdminLegalContentResponseSchema
>;

export const AdminUpdateLegalContentRequestSchema =
  AdminLegalContentResponseDataSchema;
export type AdminUpdateLegalContentRequest = z.infer<
  typeof AdminUpdateLegalContentRequestSchema
>;

// --- List Users (paginated) ---
export const AdminListUsersQuerySchema = z.object({
  skip: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type AdminListUsersQuery = z.infer<typeof AdminListUsersQuerySchema>;

export const AdminListUserRecordSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string(),
  banned: z.boolean().optional(),
  addedAt: z.number().optional(),
  pbs: z.record(z.string(), z.number()).optional(),
  personalBests: z.record(z.string(), z.any()).optional(),
  completedTests: z.number().optional(),
  startedTests: z.number().optional(),
  timeTyping: z.number().optional(),
  streak: z.number().optional(),
  maxStreak: z.number().optional(),
  xp: z.number().optional(),
  gender: z.string().nullable().optional(),
  age: z.number().nullable().optional(),
  avatar: z.string().nullable().optional(),
  lastLoginAt: z.number().optional(),
});
export type AdminListUserRecord = z.infer<typeof AdminListUserRecordSchema>;

export const AdminListUsersResponseSchema = responseWithData(
  z.object({
    total: z.number(),
    users: z.array(AdminListUserRecordSchema),
  }),
);
export type AdminListUsersResponse = z.infer<
  typeof AdminListUsersResponseSchema
>;

export const AdminUserTestsResponseSchema = responseWithData(
  z.array(z.any())
);

// --- Daily Active Users ---
export const AdminDauPointSchema = z.object({
  date: z.string(),
  count: z.number(),
});
export type AdminDauPoint = z.infer<typeof AdminDauPointSchema>;
export const AdminDauResponseSchema = responseWithData(
  z.array(AdminDauPointSchema),
);
export type AdminDauResponse = z.infer<typeof AdminDauResponseSchema>;

// --- User Retention ---
export const AdminRetentionDataSchema = z.object({
  day1: z.number(),
  day7: z.number(),
  day30: z.number(),
});
export type AdminRetentionData = z.infer<typeof AdminRetentionDataSchema>;
export const AdminRetentionResponseSchema = responseWithData(
  AdminRetentionDataSchema,
);
export type AdminRetentionResponse = z.infer<
  typeof AdminRetentionResponseSchema
>;

// --- WPM Distribution ---
export const AdminWpmBucketSchema = z.object({
  range: z.string(),
  count: z.number(),
});
export type AdminWpmBucket = z.infer<typeof AdminWpmBucketSchema>;
export const AdminWpmDistributionResponseSchema = responseWithData(
  z.array(AdminWpmBucketSchema),
);
export type AdminWpmDistributionResponse = z.infer<
  typeof AdminWpmDistributionResponseSchema
>;

// --- Top Users ---
export const AdminTopUserSchema = z.object({
  uid: z.string(),
  name: z.string(),
  wpm: z.number(),
  accuracy: z.number().optional(),
  tests: z.number(),
});
export type AdminTopUser = z.infer<typeof AdminTopUserSchema>;
export const AdminTopUsersResponseSchema = responseWithData(
  z.array(AdminTopUserSchema),
);
export type AdminTopUsersResponse = z.infer<typeof AdminTopUsersResponseSchema>;

// --- User Growth ---
export const AdminUserGrowthPointSchema = z.object({
  date: z.string(),
  total: z.number(),
  newUsers: z.number(),
});
export type AdminUserGrowthPoint = z.infer<typeof AdminUserGrowthPointSchema>;
export const AdminUserGrowthResponseSchema = responseWithData(
  z.array(AdminUserGrowthPointSchema),
);
export type AdminUserGrowthResponse = z.infer<
  typeof AdminUserGrowthResponseSchema
>;

// --- Send Notification ---
export const SendNotificationRequestSchema = z
  .object({
    uid: z.string(),
    subject: z.string().min(1).max(200),
    body: z.string().min(1).max(2000),
  })
  ;
export type SendNotificationRequest = z.infer<
  typeof SendNotificationRequestSchema
>;

// --- Ad Config ---
export const AdminCreativeSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  targetUrl: z.string(),
  size: z.string().optional(),
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
export type AdminAdConfigResponse = z.infer<typeof AdminAdConfigResponseSchema>;

export const UpdateAdConfigRequestSchema = z
  .object({
    enabled: z.boolean(),
    masterToggle: z.boolean(),
    slots: z.array(AdminAdSlotSchema),
    creatives: z.array(AdminCreativeSchema),
  })
  ;
export type UpdateAdConfigRequest = z.infer<typeof UpdateAdConfigRequestSchema>;

// --- Add Creative ---
export const AddCreativeRequestSchema = z
  .object({
    imageUrl: z.string().min(1),
    targetUrl: z.string().optional().or(z.literal("")),
    size: z.string().optional(),
  })
  ;
export type AddCreativeRequest = z.infer<typeof AddCreativeRequestSchema>;

export const AddCreativeResponseSchema = responseWithData(AdminCreativeSchema);
export type AddCreativeResponse = z.infer<typeof AddCreativeResponseSchema>;

// --- Delete Creative ---
export const DeleteCreativeParamsSchema = z
  .object({
    id: z.string(),
  })
  ;
export type DeleteCreativeParams = z.infer<typeof DeleteCreativeParamsSchema>;

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
    deleteUser: {
      method: "POST",
      summary: "Delete user completely",
      description: "Deletes a user and all their data permanently",
      path: "/deleteUser",
      body: DeleteUserRequestSchema,
      responses: {
        200: TypeUZResponseSchema,
      },
    },
    changeUserPassword: {
      method: "POST",
      summary: "Change user password",
      description: "Directly change a user's password",
      path: "/changeUserPassword",
      body: z.object({ uid: IdSchema, newPassword: z.string().min(6) }).strict(),
      responses: {
        200: TypeUZResponseSchema,
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
        200: responseWithData(
          z.object({
            hero: z.object({
              title: z.string(),
              subtitle: z.string(),
              description: z.string(),
            }),
            features: z.array(
              z.object({
                icon: z.string(),
                title: z.string(),
                description: z.string(),
              }),
            ),
            aboutCards: z.array(
              z.object({
                icon: z.string(),
                title: z.string(),
                description: z.string(),
              }),
            ),
            footer: z.object({
              brandName: z.string(),
              tagline: z.string(),
              telegram: z.string(),
            }),
          }),
        ),
      },
    },
    updateSiteContent: {
      summary: "update site content",
      method: "PUT",
      path: "/content",
      body: z.object({
        hero: z.object({
          title: z.string(),
          subtitle: z.string(),
          description: z.string(),
        }),
        features: z.array(
          z.object({
            icon: z.string(),
            title: z.string(),
            description: z.string(),
          }),
        ),
        aboutCards: z.array(
          z.object({
            icon: z.string(),
            title: z.string(),
            description: z.string(),
          }),
        ),
        footer: z.object({
          brandName: z.string(),
          tagline: z.string(),
          telegram: z.string(),
        }),
      }),
      responses: { 200: TypeUZResponseSchema },
    },

    // --- Theme Overrides ---
    getThemeSettings: {
      summary: "get theme settings",
      method: "GET",
      path: "/theme",
      responses: {
        200: responseWithData(
          z.object({
            accentColor: z.string(),
            isDark: z.boolean().optional(),
          }),
        ),
      },
    },
    updateThemeSettings: {
      summary: "update theme settings",
      method: "PUT",
      path: "/theme",
      body: z.object({
        accentColor: z.string(),
        isDark: z.boolean().optional(),
      }),
      responses: { 200: TypeUZResponseSchema },
    },

    // --- Analytics ---
    getSignupsByDay: {
      summary: "signups per day (last 30 days)",
      method: "GET",
      path: "/analytics/signups",
      responses: {
        200: responseWithData(
          z.array(z.object({ date: z.string(), count: z.number() })),
        ),
      },
    },
    getLoginsByDay: {
      summary: "logins per day (last 30 days)",
      method: "GET",
      path: "/analytics/logins",
      responses: {
        200: responseWithData(
          z.array(z.object({ date: z.string(), count: z.number() })),
        ),
      },
    },
    getLoginsByWeek: {
      summary: "logins per week (last 12 weeks)",
      method: "GET",
      path: "/analytics/logins/weekly",
      responses: {
        200: responseWithData(
          z.array(z.object({ week: z.string(), count: z.number() })),
        ),
      },
    },
    getDau: {
      summary: "daily active users (last 30 days)",
      method: "GET",
      path: "/analytics/dau",
      responses: { 200: AdminDauResponseSchema },
    },
    getRetention: {
      summary: "user retention (day 1, 7, 30)",
      method: "GET",
      path: "/analytics/retention",
      responses: { 200: AdminRetentionResponseSchema },
    },
    getWpmDistribution: {
      summary: "WPM distribution buckets",
      method: "GET",
      path: "/analytics/wpm-distribution",
      responses: { 200: AdminWpmDistributionResponseSchema },
    },
    getTopUsers: {
      summary: "top users by WPM",
      method: "GET",
      path: "/analytics/top-users",
      responses: { 200: AdminTopUsersResponseSchema },
    },
    getUserGrowth: {
      summary: "cumulative user growth",
      method: "GET",
      path: "/analytics/user-growth",
      responses: { 200: AdminUserGrowthResponseSchema },
    },
    getNotifications: {
      summary: "get notification history",
      method: "GET",
      path: "/notifications",
      responses: {
        200: AdminNotificationsResponseSchema,
      },
    },
    getLegalContent: {
      summary: "get legal page content",
      method: "GET",
      path: "/content/legal",
      responses: {
        200: AdminLegalContentResponseSchema,
      },
    },
    updateLegalContent: {
      summary: "update legal page content",
      method: "PUT",
      path: "/content/legal",
      body: AdminUpdateLegalContentRequestSchema,
      responses: {
        200: TypeUZResponseSchema,
      },
    },
    listUsers: {
      summary: "list all users (paginated)",
      method: "GET",
      path: "/users/list",
      query: AdminListUsersQuerySchema,
      responses: {
        200: AdminListUsersResponseSchema,
      },
    },
    getUserTests: {
      summary: "get latest tests for a specific user",
      method: "GET",
      path: "/users/:uid/tests",
      pathParams: z.object({ uid: z.string() }),
      responses: {
        200: AdminUserTestsResponseSchema,
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
