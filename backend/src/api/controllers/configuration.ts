import * as Configuration from "../../init/configuration";
import { TypeUZResponse } from "../../utils/typeuz-response";
import { CONFIGURATION_FORM_SCHEMA } from "../../constants/base-configuration";
import {
  ConfigurationSchemaResponse,
  GetConfigurationResponse,
  PatchConfigurationRequest,
} from "@typeuz/contracts/configuration";
import TypeUZError from "../../utils/error";
import { TypeUZRequest } from "../types";

export async function getConfiguration(
  _req: TypeUZRequest,
): Promise<GetConfigurationResponse> {
  const currentConfiguration = await Configuration.getCachedConfiguration(true);
  const sanitized = structuredClone(currentConfiguration);
  if (sanitized.users?.ai) {
    sanitized.users.ai.apiKey = "***";
  }
  return new TypeUZResponse("Configuration retrieved", sanitized);
}

export async function getSchema(
  _req: TypeUZRequest,
): Promise<ConfigurationSchemaResponse> {
  return new TypeUZResponse(
    "Configuration schema retrieved",
    CONFIGURATION_FORM_SCHEMA,
  );
}

export async function updateConfiguration(
  req: TypeUZRequest<undefined, PatchConfigurationRequest>,
): Promise<TypeUZResponse> {
  const { configuration } = req.body;
  const success = await Configuration.patchConfiguration(configuration);

  if (!success) {
    throw new TypeUZError(500, "Configuration update failed");
  }

  return new TypeUZResponse("Configuration updated", null);
}
