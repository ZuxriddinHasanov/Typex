import { config } from "dotenv";
config();
import * as db from "../src/init/db";
import { devGet } from "../src/utils/dev-store";

async function run() {
  await db.connect();
  const usersByUid = devGet<Record<string, { uid: string; email: string; name: string }>>("users_by_uid") ?? {};
  
  for (const [uid, user] of Object.entries(usersByUid)) {
    const profile = devGet<Record<string, unknown>>(`user_profile_${uid}`) ?? {};
    
    try {
      await db.query(
        `INSERT INTO users (
          uid, name, first_name, last_name, email, added_at,
          gender, age, avatar, personal_bests, test_activity, last_login_at, verified,
          completed_tests, started_tests, time_typing, xp, streak, banned, 
          last_name_change, name_history
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, true,
          $13, $14, $15, $16, $17::jsonb, $18, $19, $20::jsonb
        ) ON CONFLICT (uid) DO NOTHING`,
        [
          uid,
          user.name,
          profile["firstName"] ?? null,
          profile["lastName"] ?? null,
          user.email ?? "",
          profile["addedAt"] ?? Date.now(),
          profile["gender"] ?? null,
          profile["age"] ?? null,
          profile["avatar"] ?? null,
          JSON.stringify(profile["personalBests"] ?? { time: {}, words: {} }),
          JSON.stringify(profile["testActivity"] ?? {}),
          profile["lastLoginAt"] ?? Date.now(),
          profile["completedTests"] ?? 0,
          profile["startedTests"] ?? 0,
          profile["timeTyping"] ?? 0,
          profile["xp"] ?? 0,
          JSON.stringify({ length: profile["streak"] ?? 0, maxLength: profile["maxStreak"] ?? 0 }),
          profile["banned"] ?? false,
          profile["lastNameChange"] ?? null,
          JSON.stringify(profile["nameHistory"] ?? [])
        ]
      );
      console.log(`Migrated user ${user.name}`);
    } catch (e) {
      console.error(`Failed to migrate ${user.name}:`, e);
    }
  }
  
  console.log("Migration complete!");
  process.exit(0);
}

run();
