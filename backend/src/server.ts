import "dotenv/config";
import * as db from "./init/db";

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err.message);
  if (!err.message.includes("Connection terminated unexpectedly")) {
    process.exit(1);
  }
});

import jobs from "./jobs";
import {
  getLiveConfiguration,
  updateFromConfigurationFile,
} from "./init/configuration";
import app from "./app";
import { Server } from "http";
import { version } from "./version";
import { recordServerVersion } from "./utils/prometheus";
import * as RedisClient from "./init/redis";
import queues from "./queues";
import workers from "./workers";
import Logger from "./utils/logger";
import * as EmailClient from "./init/email-client";
import { init as initFirebaseAdmin } from "./init/firebase-admin";
import { createIndicies as leaderboardDbSetup } from "./dal/leaderboards";
import { createIndicies as blocklistDbSetup } from "./dal/blocklist";
import { createIndicies as connectionsDbSetup } from "./dal/connections";
import { getErrorMessage } from "./utils/error";
import bcrypt from "bcrypt";
import { devGet, devSet } from "./utils/dev-store";
import { isDevEnvironment } from "./utils/misc";
import { assertJwtConfigured } from "./utils/jwt";
import { startTelegramPolling } from "./utils/telegram-polling";

const ADMIN_CRED_KEY = "admin_credentials";

async function seedDefaultAdmin(): Promise<void> {
  const username = isDevEnvironment()
    ? (process.env["ADMIN_USERNAME"] ?? "admin")
    : process.env["ADMIN_USERNAME"];
  const password = isDevEnvironment()
    ? (process.env["ADMIN_PASSWORD"] ?? "admin123")
    : process.env["ADMIN_PASSWORD"];

  if (username === undefined || password === undefined) {
    Logger.warning(
      "Admin account not seeded: ADMIN_USERNAME and ADMIN_PASSWORD are not set.",
    );
    return;
  }
  if (!isDevEnvironment() && password.length < 8) {
    throw new Error("ADMIN_PASSWORD must contain at least 8 characters");
  }

  const hash = await bcrypt.hash(password, 10);
  if (isDevEnvironment()) {
    const existing = devGet<Record<string, unknown>>(ADMIN_CRED_KEY);
    if (existing !== null && Object.keys(existing).length > 0) return;
    devSet(ADMIN_CRED_KEY, {
      [username.toLowerCase()]: {
        username,
        passwordHash: hash,
        createdAt: Date.now(),
      },
    });
  } else {
    const existing = await db.queryOne<{ username: string }>(
      "SELECT username FROM admin_credentials WHERE username = $1",
      [username.toLowerCase()],
    );
    if (existing !== null) return;
    await db.query(
      `INSERT INTO admin_credentials (username, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (username) DO NOTHING`,
      [
        username.toLowerCase(),
        JSON.stringify({
          username,
          passwordHash: hash,
          createdAt: Date.now(),
        }),
      ],
    );
  }
  Logger.success(`Admin account created: ${username}`);
}

async function bootServer(port: number): Promise<Server> {
  try {
    Logger.info(`Starting server version ${version}`);
    Logger.info(`Starting server in ${process.env["MODE"]} mode`);
    assertJwtConfigured();
    Logger.info(`Connecting to database...`);
    await db.connect();
    const isDbConnected = db.getDb() !== undefined;
    if (isDbConnected) {
      Logger.success("Connected to database");
    }

    Logger.info("Initializing Firebase app instance...");
    initFirebaseAdmin();

    if (isDbConnected) {
      Logger.info("Fetching live configuration...");
      await getLiveConfiguration();
      Logger.success("Live configuration fetched");
    } else {
      Logger.warning("Running without database — using default configuration.");
    }
    await updateFromConfigurationFile();

    Logger.info("Initializing email client...");
    await EmailClient.init();

    Logger.info("Connecting to redis...");
    await RedisClient.connect();

    if (RedisClient.isConnected()) {
      Logger.success("Connected to redis");
      const connection = RedisClient.getConnection();

      Logger.info("Initializing queues...");
      queues.forEach((queue) => {
        queue.init(connection ?? undefined);
      });
      Logger.success(
        `Queues initialized: ${queues
          .map((queue) => queue.queueName)
          .join(", ")}`,
      );

      Logger.info("Initializing workers...");
      workers.forEach(async (worker) => {
        await worker(connection ?? undefined).run();
      });
      Logger.success(
        `Workers initialized: ${workers
          .map((worker) => worker(connection ?? undefined).name)
          .join(", ")}`,
      );
    }

    if (isDbConnected || isDevEnvironment()) {
      await seedDefaultAdmin();
    }

    recordServerVersion(version);

    const server = await new Promise<Server>((resolve, reject) => {
      const s = app.listen(port, "0.0.0.0", () => {
        Logger.success(`API server listening on port ${port}`);
        resolve(s);
      });
      s.on("error", reject);
    });

    if (isDbConnected) {
      Logger.info("Starting cron jobs...");
      jobs.forEach((job) => job.start());
      Logger.success("Cron jobs started");

      void (async () => {
        try {
          Logger.info("Setting up leaderboard indicies...");
          await leaderboardDbSetup();

          Logger.info("Setting up blocklist indicies...");
          await blocklistDbSetup();

          Logger.info("Setting up connections indicies...");
          await connectionsDbSetup();
        } catch (err) {
          Logger.error(`Indicies setup error: ${(err as Error).message}`);
        }
      })();
    }

    // Start telegram bot polling
    try {
      startTelegramPolling();
    } catch (e) {
      Logger.error(`Telegram polling error: ${(e as Error).message}`);
    }

    return server;
  } catch (error) {
    Logger.error("Failed to initialize server services");
    const message = getErrorMessage(error);
    Logger.error(message ?? "Unknown error");
    throw error;
  }
}

const PORT = parseInt(process.env["PORT"] ?? "5005", 10);

void bootServer(PORT).catch(() => {
  process.exit(1);
});
