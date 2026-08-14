import cors from "cors";
import helmet from "helmet";
import { addApiRoutes } from "./api/routes";
import express, { urlencoded, json } from "express";
import contextMiddleware from "./middlewares/context";
import errorHandlingMiddleware from "./middlewares/error";
import {
  badAuthRateLimiterHandler,
  rootRateLimiter,
} from "./middlewares/rate-limit";
import { compatibilityCheckMiddleware } from "./middlewares/compatibilityCheck";
import { COMPATIBILITY_CHECK_HEADER } from "@typeuz/contracts";
import { createETagGenerator } from "./utils/etag";
import { v4RequestBody } from "./middlewares/utility";
import { getFrontendUrl, isDevEnvironment } from "./utils/misc";

const etagFn = createETagGenerator({ weak: true });

function buildApp(): express.Application {
  const app = express();

  app.get("/", (_req, res) => {
    res.status(200).send("ok");
  });
  app.get("/health", (_req, res) => {
    res.status(200).send("ok");
  });

  app.use(urlencoded({ extended: true }));
  app.use(json());

  const allowedOriginsEnv = process.env["ALLOWED_ORIGINS"];

  const corsOrigins: string | string[] =
    allowedOriginsEnv !== undefined && allowedOriginsEnv !== ""
      ? allowedOriginsEnv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : isDevEnvironment()
        ? "*"
        : getFrontendUrl();
  app.use(
    cors({
      origin: corsOrigins,
      credentials: corsOrigins !== "*",
      exposedHeaders: [COMPATIBILITY_CHECK_HEADER],
    }),
  );
  app.use(helmet());

  app.set("trust proxy", 1);

  app.use(compatibilityCheckMiddleware);
  app.use(contextMiddleware);

  app.use(badAuthRateLimiterHandler);
  app.use(rootRateLimiter);
  app.use(v4RequestBody);

  app.set("etag", etagFn);

  addApiRoutes(app);

  app.use(errorHandlingMiddleware);

  return app;
}

export default buildApp();
