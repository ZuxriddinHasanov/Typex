import * as db from "./db";
import Logger from "../utils/logger";
import { identity, isPlainObject } from "../utils/misc";
import { BASE_CONFIGURATION } from "../constants/base-configuration";
import { Configuration } from "@typeuz/schemas/configuration";
import { addLog } from "../dal/logs";
import {
  PartialConfiguration,
  PartialConfigurationSchema,
} from "@typeuz/contracts/configuration";
import { getErrorMessage } from "../utils/error";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { parseWithSchema as parseJsonWithSchema } from "@typeuz/util/json";
import { z } from "zod";
import { intersect } from "@typeuz/util/arrays";

const CONFIG_UPDATE_INTERVAL = 10 * 60 * 1000;
const SERVER_CONFIG_FILE_PATH = join(
  __dirname,
  "../backend-configuration.json",
);

function mergeConfigurations(
  baseConfiguration: Configuration,
  liveConfiguration: PartialConfiguration,
): void {
  if (!isPlainObject(baseConfiguration) || !isPlainObject(liveConfiguration)) {
    return;
  }

  function merge(base: object, source: object): void {
    const commonKeys = intersect(Object.keys(base), Object.keys(source), true);
    commonKeys.forEach((key) => {
      const baseValue = base[key] as object;
      const sourceValue = source[key] as object;
      const isBaseValueObject = isPlainObject(baseValue);
      const isSourceValueObject = isPlainObject(sourceValue);
      if (isBaseValueObject && isSourceValueObject) {
        merge(baseValue, sourceValue);
      } else if (identity(baseValue) === identity(sourceValue)) {
        base[key] = sourceValue;
      }
    });
  }

  merge(baseConfiguration, liveConfiguration);
}

let configuration = BASE_CONFIGURATION;
let lastFetchTime = 0;
let serverConfigurationUpdated = false;

export async function getCachedConfiguration(
  attemptCacheUpdate = false,
): Promise<Configuration> {
  if (
    attemptCacheUpdate &&
    lastFetchTime < Date.now() - CONFIG_UPDATE_INTERVAL
  ) {
    Logger.info("Cached configuration is stale.");
    return await getLiveConfiguration();
  }
  return configuration;
}

export async function getLiveConfiguration(): Promise<Configuration> {
  lastFetchTime = Date.now();

  try {
    const row = await db.queryOne<{ data: unknown }>(
      "SELECT data FROM configuration WHERE _id = 'default'",
    );

    if (row?.data !== undefined && row.data !== null) {
      const liveConfig = row.data as PartialConfiguration;
      const baseConfiguration = structuredClone(BASE_CONFIGURATION);
      mergeConfigurations(baseConfiguration, liveConfig);
      if (process.env["ADMIN_ENDPOINTS_ENABLED"] === "true") {
        baseConfiguration.admin.endpointsEnabled = true;
      }
      await pushConfiguration(baseConfiguration);
      configuration = baseConfiguration;
    } else {
      const configToSeed = {
        ...BASE_CONFIGURATION,
        admin: {
          ...BASE_CONFIGURATION.admin,
          endpointsEnabled:
            process.env["ADMIN_ENDPOINTS_ENABLED"] === "true",
        },
      };
      await db.query(
        `INSERT INTO configuration (_id, data) VALUES ('default', $1::jsonb)
         ON CONFLICT (_id) DO NOTHING`,
        [JSON.stringify(configToSeed)],
      );
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error) ?? "Unknown error";
    void addLog(
      "fetch_configuration_failure",
      `Could not fetch configuration: ${errorMessage}`,
    );
  }

  return configuration;
}

async function pushConfiguration(
  configurationToPush: Configuration,
): Promise<void> {
  if (serverConfigurationUpdated) return;

  try {
    await db.query(
      `INSERT INTO configuration (_id, data) VALUES ('default', $1::jsonb)
       ON CONFLICT (_id) DO UPDATE SET data = $1::jsonb`,
      [JSON.stringify(configurationToPush)],
    );
    serverConfigurationUpdated = true;
  } catch (error) {
    const errorMessage = getErrorMessage(error) ?? "Unknown error";
    void addLog(
      "push_configuration_failure",
      `Could not push configuration: ${errorMessage}`,
    );
  }
}

export async function patchConfiguration(
  configurationUpdates: PartialConfiguration,
): Promise<boolean> {
  try {
    const currentConfiguration = structuredClone(configuration);
    mergeConfigurations(currentConfiguration, configurationUpdates);

    await db.query(
      `INSERT INTO configuration (_id, data) VALUES ('default', $1::jsonb)
       ON CONFLICT (_id) DO UPDATE SET data = $1::jsonb`,
      [JSON.stringify(currentConfiguration)],
    );

    await getLiveConfiguration();
  } catch (error) {
    const errorMessage = getErrorMessage(error) ?? "Unknown error";
    void addLog("patch_configuration_failure", errorMessage);
    return false;
  }

  return true;
}

export async function updateFromConfigurationFile(): Promise<void> {
  if (existsSync(SERVER_CONFIG_FILE_PATH)) {
    Logger.info(
      `Reading server configuration from file ${SERVER_CONFIG_FILE_PATH}`,
    );
    const json = readFileSync(SERVER_CONFIG_FILE_PATH, "utf-8");
    const data = parseJsonWithSchema(
      json,
      z.object({
        configuration: PartialConfigurationSchema,
      }),
    );
    await patchConfiguration(data.configuration);
  }
}

export const __testing = {
  mergeConfigurations,
};
