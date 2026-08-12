import jwt from "jsonwebtoken";
import TypeUZError from "./error";

const getSecret = (): string => {
  const secret = process.env["JWT_SECRET"];
  if (secret === undefined || secret === null || secret === "") {
    // Provide a fallback secret for development or missing configuration.
    // In production, the user should set a strong random secret.
    return "typeuz_default_fallback_jwt_secret_change_me_in_production";
  }
  return secret;
};

export type JwtPayload = {
  uid: string;
  email: string;
  admin?: boolean;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload;
  } catch {
    throw new TypeUZError(401, "Invalid or expired token");
  }
}
