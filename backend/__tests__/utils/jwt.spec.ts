import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertJwtConfigured,
  signToken,
  verifyToken,
} from "../../src/utils/jwt";

describe("custom JWT", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a signed token", () => {
    vi.stubEnv("MODE", "production");
    vi.stubEnv("JWT_SECRET", "test-secret-that-is-not-used-in-production");
    const token = signToken({ uid: "uid", email: "user@example.com" });
    expect(verifyToken(token)).toMatchObject({
      uid: "uid",
      email: "user@example.com",
    });
  });

  it("rejects a missing production secret", () => {
    vi.stubEnv("MODE", "production");
    vi.stubEnv("JWT_SECRET", "");
    expect(assertJwtConfigured).toThrow("JWT_SECRET is required in production");
  });
});
