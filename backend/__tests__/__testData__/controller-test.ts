import request from "supertest";
import crypto from "crypto";
import app from "../../src/app";
import { BearerAuthenticationMock, mockBearerAuthentication } from "./auth";
import { beforeEach } from "vitest";
import TestAgent from "supertest/lib/agent";

export function setup(): {
  mockApp: TestAgent;
  uid: string;
  mockAuth: BearerAuthenticationMock;
} {
  const mockApp = request(app);
  const uid = crypto.randomUUID();
  const mockAuth = mockBearerAuthentication(uid);

  beforeEach(() => {
    mockAuth.beforeEach();
  });

  return { mockApp, uid, mockAuth };
}
