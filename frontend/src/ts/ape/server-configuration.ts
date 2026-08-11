import { Configuration } from "@typeuz/schemas/configuration";

const defaultConfig: Configuration = {
  maintenance: false,
  dev: { responseSlowdownMs: 0 },
  quotes: {
    reporting: { enabled: true, maxReports: 10, contentReportLimit: 3 },
    submissionsEnabled: false,
    maxFavorites: 3,
  },
  results: {
    savingEnabled: true,
    objectHashCheckEnabled: true,
    filterPresets: { enabled: true, maxPresetsPerUser: 10 },
    limits: { regularUser: 1000, premiumUser: 10000 },
    maxBatchSize: 100,
  },
  users: {
    signUp: true,
    lastHashesCheck: { enabled: true, maxHashes: 5 },
    autoBan: { enabled: false, maxCount: 0, maxHours: 0 },
    profiles: { enabled: true },
    ai: { enabled: false, maxDailyUses: 3, apiKey: "" },
    discordIntegration: { enabled: false },
    xp: {
      enabled: true,
      funboxBonus: 0,
      gainMultiplier: 1,
      maxDailyBonus: 100,
      minDailyBonus: 10,
      streak: { enabled: true, maxStreakDays: 30, maxStreakMultiplier: 2 },
    },
    inbox: { enabled: true, maxMail: 100 },
    premium: { enabled: false },
  },
  admin: { endpointsEnabled: true },
  ads: { enabled: false, masterToggle: false, slots: [] },
  apeKeys: {
    endpointsEnabled: false,
    acceptKeys: false,
    maxKeysPerUser: 0,
    apeKeyBytes: 0,
    apeKeySaltRounds: 0,
  },
  rateLimiting: {
    badAuthentication: {
      enabled: false,
      penalty: 0,
      flaggedStatusCodes: [],
    },
  },
  dailyLeaderboards: {
    enabled: false,
    leaderboardExpirationTimeInDays: 30,
    maxResults: 0,
    validModeRules: [],
    scheduleRewardsModeRules: [],
    topResultsToAnnounce: 0,
    xpRewardBrackets: [],
  },
  leaderboards: {
    minTimeTyping: 0,
    weeklyXp: {
      enabled: false,
      expirationTimeInDays: 7,
      xpRewardBrackets: [],
    },
  },
  connections: { enabled: false, maxPerUser: 0 },
};

const promise = Promise.resolve(true);
export { promise as configurationPromise };

export function get(): Configuration {
  return defaultConfig;
}

export async function sync(): Promise<void> {
  // no-op
}
