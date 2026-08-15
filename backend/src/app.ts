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

  app.use(urlencoded({ extended: true }));
  app.use(json());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (origin === undefined || origin === "") {
          callback(null, true);
          return;
        }
        callback(null, true);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        COMPATIBILITY_CHECK_HEADER,
      ],
      exposedHeaders: [COMPATIBILITY_CHECK_HEADER],
    }),
  );
  app.options("*", cors());
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
