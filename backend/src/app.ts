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

const etagFn = createETagGenerator({ weak: true });

function buildApp(): express.Application {
  const app = express();

  app.get("/", (_req, res) => {
    res.status(200).send("ok");
  });
  app.get("/health", (_req, res) => {
    res.status(200).send("ok");
  });

  app.use(urlencoded({ extended: true, limit: "50mb" }));
  app.use(json({ limit: "50mb" }));

  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-Client-Version",
      "x-client-version",
      "Sentry-Trace",
      "sentry-trace",
      "Baggage",
      "baggage",
      COMPATIBILITY_CHECK_HEADER,
    ],
    exposedHeaders: [COMPATIBILITY_CHECK_HEADER],
  };

  app.use(cors(corsOptions));
  app.options(/(.*)/, cors(corsOptions));
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
