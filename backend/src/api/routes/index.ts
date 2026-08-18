import { contract } from "@typeuz/contracts";
import { devContract } from "@typeuz/contracts/dev";
import psas from "./psas";
import publicStats from "./public";
import users from "./users";
import { join } from "path";
import quotes from "./quotes";
import results from "./results";
import presets from "./presets";
import apeKeys from "./ape-keys";
import admin from "./admin";
import docs from "./docs";
import webhooks from "./webhooks";
import configs from "./configs";
import configuration from "./configuration";
import authRoutes from "./auth";
import { version } from "../../version";
import leaderboards from "./leaderboards";
import connections from "./connections";
import addSwaggerMiddlewares from "./swagger";
import { TypeUZResponse } from "../../utils/typeuz-response";
import * as UserDAL from "../../dal/user";
import {
  Application,
  IRouter,
  NextFunction,
  Response,
  json,
  urlencoded,
  static as expressStatic,
} from "express";
import { isDevEnvironment } from "../../utils/misc";
import { devGet, devSet } from "../../utils/dev-store";
import { getLiveConfiguration } from "../../init/configuration";
import Logger from "../../utils/logger";
import { createExpressEndpoints, initServer } from "@ts-rest/express";
import { ZodIssue } from "zod";
import { authenticateTsRestRequest } from "../../middlewares/auth";
import { rateLimitRequest } from "../../middlewares/rate-limit";
import { verifyPermissions } from "../../middlewares/permission";
import { verifyRequiredConfiguration } from "../../middlewares/configuration";
import { ExpressRequestWithContext } from "../types";

const pathOverride = process.env["API_PATH_OVERRIDE"];
const BASE_ROUTE = pathOverride !== undefined ? `/${pathOverride}` : "";
const APP_START_TIME = Date.now();

const API_ROUTE_MAP = {
  "/docs": docs,
};

const s = initServer();
const dev = s.router(devContract, {
  generateData: async () => {
    return {
      status: 200,
      body: { message: "Dev routes disabled", data: { uid: "", email: "" } },
    };
  },
  addDebugInboxItem: async () => {
    return { status: 200, body: { message: "Dev routes disabled" } };
  },
});
const router = s.router(contract, {
  dev,
  admin,
  apeKeys,
  configs,
  presets,
  psas,
  public: publicStats,
  leaderboards,
  results,
  configuration,
  users,
  quotes,
  webhooks,
  connections,
});

export function addApiRoutes(app: Application): void {
  applyDevApiRoutes(app);
  applyApiRoutes(app);
  applyTsRestApiRoutes(app);

  app.use((req, res) => {
    res
      .status(404)
      .json(
        new TypeUZResponse(
          `Unknown request URL (${req.method}: ${req.path})`,
          null,
        ),
      );
  });
}

function applyTsRestApiRoutes(app: IRouter): void {
  createExpressEndpoints(contract, router, app, {
    jsonQuery: true,
    requestValidationErrorHandler(err, req, res, _next) {
      let message: string | undefined = undefined;
      let validationErrors: string[] | undefined = undefined;

      if (err.pathParams?.issues !== undefined) {
        message = "Invalid path parameter schema";
        validationErrors = err.pathParams.issues.map(prettyErrorMessage);
      } else if (err.query?.issues !== undefined) {
        message = "Invalid query schema";
        validationErrors = err.query.issues.map(prettyErrorMessage);
      } else if (err.body?.issues !== undefined) {
        message = "Invalid request data schema";
        validationErrors = err.body.issues.map(prettyErrorMessage);
      } else if (err.headers?.issues !== undefined) {
        message = "Invalid header schema";
        validationErrors = err.headers.issues.map(prettyErrorMessage);
      } else {
        Logger.error(
          `Unknown validation error for ${req.method} ${
            req.path
          }: ${JSON.stringify(err)}`,
        );
        res
          .status(500)
          .json({ message: "Unknown validation error. Contact support." });
        return;
      }

      res.status(422).json({ message, validationErrors });
    },
    globalMiddleware: [
      json({ limit: "50mb" }),
      urlencoded({ extended: true, limit: "50mb" }),
      authenticateTsRestRequest(),
      rateLimitRequest(),
      verifyRequiredConfiguration(),
      verifyPermissions(),
    ],
  });
}

function prettyErrorMessage(issue: ZodIssue | undefined): string {
  if (issue === undefined) return "";
  const path = issue.path.length > 0 ? `"${issue.path.join(".")}" ` : "";
  return `${path}${issue.message}`;
}

function applyDevApiRoutes(app: Application): void {
  if (isDevEnvironment()) {
    //disable csp to allow assets to load from unsecured http
    app.use((req, res, next) => {
      res.setHeader("Content-Security-Policy", "");
      next();
    });
    app.use("/configure", expressStatic(join(__dirname, "../../../private")));

    app.use(async (req, res, next) => {
      const slowdown = (await getLiveConfiguration()).dev.responseSlowdownMs;
      if (slowdown > 0) {
        Logger.info(
          `Simulating ${slowdown}ms delay for ${req.method} ${req.path}`,
        );
        await new Promise((resolve) => setTimeout(resolve, slowdown));
      }
      next();
    });

    app.post("/dev/login", async (req, res) => {
      try {
        const { username } = (req.body ?? {}) as { username?: unknown };
        if (
          username === undefined ||
          username === null ||
          typeof username !== "string"
        ) {
          res.status(400).json(new TypeUZResponse("Username required", null));
          return;
        }
        // Dev mode: check dev-store first
        if (isDevEnvironment()) {
          const usersByName =
            devGet<
              Record<string, { uid: string; email: string; name: string }>
            >("users_by_name") ?? {};
          const found = usersByName[username.toLowerCase()];
          if (found) {
            res.status(200).json(new TypeUZResponse("ok", found));
            return;
          }
        }
        const existing = await UserDAL.findByName(username);
        if (existing) {
          res.status(200).json(
            new TypeUZResponse("ok", {
              uid: existing.uid,
              email: existing.email,
              name: existing.name,
            }),
          );
          return;
        }
        const uid = crypto.randomUUID();
        const email = `${username}@dev.local`;
        await UserDAL.addUser(username, email, uid);
        if (isDevEnvironment()) {
          const usersByName =
            devGet<
              Record<string, { uid: string; email: string; name: string }>
            >("users_by_name") ?? {};
          usersByName[username.toLowerCase()] = { uid, email, name: username };
          devSet("users_by_name", usersByName);
          const usersByEmail =
            devGet<
              Record<string, { uid: string; email: string; name: string }>
            >("users_by_email") ?? {};
          usersByEmail[email.toLowerCase()] = { uid, email, name: username };
          devSet("users_by_email", usersByEmail);
        }
        res
          .status(200)
          .json(new TypeUZResponse("ok", { uid, email, name: username }));
      } catch (e) {
        Logger.error(`Dev login error: ${(e as Error).message}`);
        res.status(500).json(new TypeUZResponse("Dev login failed", null));
      }
    });
  }
}

function applyApiRoutes(app: Application): void {
  addSwaggerMiddlewares(app);

  app.use("/auth", authRoutes);

  app.use(
    (
      req: ExpressRequestWithContext,
      res: Response,
      next: NextFunction,
    ): void => {
      if (req.path.startsWith("/configuration")) {
        next();
        return;
      }

      const inMaintenance =
        process.env["MAINTENANCE"] === "true" ||
        req.ctx.configuration.maintenance;

      if (inMaintenance) {
        res.status(503).json({ message: "Server is down for maintenance" });
        return;
      }

      next();
    },
  );

  app.get("/", (_req, res) => {
    res.status(200).json(
      new TypeUZResponse("ok", {
        uptime: Date.now() - APP_START_TIME,
        version,
      }),
    );
  });

  for (const [route, mapRouter] of Object.entries(API_ROUTE_MAP)) {
    const apiRoute = `${BASE_ROUTE}${route}`;
    app.use(apiRoute, mapRouter);
  }
}
