import Logger from "./logger";
import jwt from "jsonwebtoken";
import TypeUZError from "./error";
import { isDevEnvironment } from "./misc";

const getSecret = (): string => {
  const secret = process.env["JWT_SECRET"];
  if (secret === undefined || secret === null || secret === "") {
    if (!isDevEnvironment()) {
      Logger.warning("JWT_SECRET is missing! Using fallback secret.");
    }
    return "typeuz_default_fallback_jwt_secret_change_me_in_production";
  }
  return secret;
};

export type JwtPayload = {
  uid: string;
  email: string;
  admin?: boolean;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function assertJwtConfigured(): void {
  void getSecret();
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload;
  } catch {
    throw new TypeUZError(401, "Invalid or expired token");
  }
}
