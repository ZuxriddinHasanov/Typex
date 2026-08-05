import { afterAll, beforeAll, afterEach, vi } from "vitest";
import { BASE_CONFIGURATION } from "../src/constants/base-configuration";
import { setupCommonMocks } from "./setup-common-mocks";
import { __testing } from "../src/init/configuration";

process.env["MODE"] = "dev";
process.env.TZ = "UTC";
beforeAll(async () => {
  vi.mock("../src/init/configuration", async (importOriginal) => {
    const orig = (await importOriginal()) as any;

    return {
      __testing: orig.__testing,
      getLiveConfiguration: () => BASE_CONFIGURATION,
      getCachedConfiguration: () => BASE_CONFIGURATION,
      patchConfiguration: vi.fn(),
    };
  });

  vi.mock("../src/init/db", () => ({
    __esModule: true,
    getDb: () => undefined,
    getPool: () => undefined,
    query: (async () => ({ rows: [], rowCount: 0 })) as any,
    queryOne: (async () => null) as any,
    queryAll: (async () => []) as any,
    close: () => {
      //
    },
  }));

  setupCommonMocks();
});

afterEach(async () => {
  //nothing
});

afterAll(async () => {
  vi.resetAllMocks();
});
