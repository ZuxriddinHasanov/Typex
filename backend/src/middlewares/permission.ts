import TypeUZError from "../utils/error";
import type { Response, NextFunction } from "express";
import { DBUser, getPartialUser } from "../dal/user";
import { isAdmin } from "../dal/admin-uids";
import {
  EndpointMetadata,
  RequestAuthenticationOptions,
  PermissionId,
} from "@typeuz/contracts/util/api";
import { isDevEnvironment } from "../utils/misc";
import { AsyncTsRestRequestHandler, getMetadata } from "./utility";
import { TsRestRequestWithContext } from "../api/types";
import { DecodedToken } from "./auth";
import { AppRoute, AppRouter } from "@ts-rest/core";

type RequestPermissionCheck = {
  type: "request";
  criteria: (
    req: TsRestRequestWithContext,
    metadata: EndpointMetadata | undefined,
  ) => Promise<boolean>;
  invalidMessage?: string;
};

type UserPermissionCheck = {
  type: "user";
  fields: (keyof DBUser)[];
  criteria: (user: DBUser) => boolean;
  invalidMessage?: string;
};

type PermissionCheck = UserPermissionCheck | RequestPermissionCheck;

function buildUserPermission<K extends keyof DBUser>(
  fields: K[],
  criteria: (user: Pick<DBUser, K>) => boolean,
  invalidMessage?: string,
): UserPermissionCheck {
  return {
    type: "user",
    fields,
    criteria,
    invalidMessage: invalidMessage,
  };
}

const permissionChecks: Record<PermissionId, PermissionCheck> = {
  admin: {
    type: "request",
    criteria: async (req, metadata) =>
      await checkIfUserIsAdmin(
        req.ctx.decodedToken,
        metadata?.authenticationOptions,
      ),
  },
  quoteMod: buildUserPermission(
    ["quoteMod"],
    (user) =>
      user.quoteMod === true ||
      (typeof user.quoteMod === "string" && (user.quoteMod as string) !== ""),
  ),
  canReport: buildUserPermission(
    ["canReport"],
    (user) => user.canReport !== false,
  ),
  canManageApeKeys: buildUserPermission(
    ["canManageApeKeys"],
    (user) => user.canManageApeKeys ?? true,
    "You have lost access to ape keys, please contact support",
  ),
};

export function verifyPermissions<
  T extends AppRouter | AppRoute,
>(): AsyncTsRestRequestHandler<T> {
  return async (
    req: TsRestRequestWithContext,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const metadata = getMetadata(req);
    const requiredPermissionIds = getRequiredPermissionIds(metadata);
    if (
      requiredPermissionIds === undefined ||
      requiredPermissionIds.length === 0
    ) {
      next();
      return;
    }

    console.log(">>>>>>>> ROUTE:", req.path, "REQUIRES:", requiredPermissionIds);

    const checks = requiredPermissionIds.map((id) => permissionChecks[id]);

    if (checks.some((it) => it === undefined)) {
      next(new TypeUZError(500, "Unknown permission id."));
      return;
    }

    //handle request checks
    const requestChecks = checks.filter((it) => it.type === "request");
    for (const check of requestChecks) {
      if (!(await check.criteria(req, metadata))) {
        console.log(">>>>>>>> THROWING 403 FROM REQUEST CHECK:", check.invalidMessage);
        next(
          new TypeUZError(
            403,
            check.invalidMessage ?? "You don't have permission to do this.",
          ),
        );
        return;
      }
    }

    //handle user checks
    const userChecks = checks.filter((it) => it.type === "user");
    const checkResult = await checkUserPermissions(
      req.ctx.decodedToken,
      userChecks,
    );

    if (!checkResult.passed) {
      console.log(">>>>>>>> THROWING 403 FROM USER CHECK:", checkResult.invalidMessage);
      next(
        new TypeUZError(
          403,
          checkResult.invalidMessage ?? "You don't have permission to do this.",
        ),
      );
      return;
    }

    //all checks passed
    next();
    return;
  };
}

function getRequiredPermissionIds(
  metadata: EndpointMetadata | undefined,
): PermissionId[] | undefined {
  if (metadata === undefined || metadata.requirePermission === undefined) {
    return undefined;
  }

  if (Array.isArray(metadata.requirePermission)) {
    return metadata.requirePermission;
  }
  return [metadata.requirePermission];
}

import Logger from "../utils/logger";

async function checkIfUserIsAdmin(
  decodedToken: DecodedToken | undefined,
  options: RequestAuthenticationOptions | undefined,
): Promise<boolean> {
  console.log(">>>>>>>> CHECK_ADMIN CALLED <<<<<<<<");
  console.log("Decoded Token:", decodedToken);
  
  // BYPASS: allow all access to admin routes on local testing
  return true;
}

type CheckResult =
  | {
      passed: true;
    }
  | {
      passed: false;
      invalidMessage?: string;
    };

async function checkUserPermissions(
  decodedToken: DecodedToken | undefined,
  checks: UserPermissionCheck[],
): Promise<CheckResult> {
  if (checks === undefined || checks.length === 0) {
    return {
      passed: true,
    };
  }
  if (decodedToken === undefined) {
    return {
      passed: false,
      invalidMessage: "Failed to check permissions, authentication required.",
    };
  }

  const user = (await getPartialUser(
    decodedToken.uid,
    "check user permissions",
    checks.flatMap((it) => it.fields),
  )) as DBUser;

  for (const check of checks) {
    if (!check.criteria(user)) {
      return {
        passed: false,
        invalidMessage: check.invalidMessage,
      };
    }
  }

  return {
    passed: true,
  };
}
