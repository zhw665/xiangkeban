import { afterEach, describe, expect, test } from "vitest";

import { getRuntimeConfig } from "@/lib/runtime-config";

const keys = [
  "AUTH_SECRET",
  "SCHOOL_INVITE_CODE",
  "OSS_REGION",
  "OSS_BUCKET",
  "OSS_ACCESS_KEY_ID",
  "OSS_ACCESS_KEY_SECRET",
] as const;

const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original[key];
    }
  }
});

describe("getRuntimeConfig", () => {
  test("rejects missing production secrets", () => {
    for (const key of keys) delete process.env[key];

    expect(() => getRuntimeConfig("production")).toThrow(/AUTH_SECRET/);
  });

  test("allows optional DashScope configuration", () => {
    for (const key of keys) delete process.env[key];
    process.env.AUTH_SECRET = "test-auth-secret";
    process.env.SCHOOL_INVITE_CODE = "test-school-code";

    expect(getRuntimeConfig("production").dashScopeApiKey).toBeUndefined();
  });
});
