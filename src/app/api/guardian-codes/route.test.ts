import path from "node:path";

import { NetlifyDB } from "@netlify/database-dev";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

const authState = vi.hoisted(() => ({
  session: null as null | {
    user: { id: string; role: "teacher" | "student" | "parent"; schoolId: string };
  },
}));

vi.mock("@/lib/dal", () => ({
  getApiSession: async () => authState.session,
  getClassContext: async (userId: string, role: string) => {
    if (
      (userId === "user-teacher-li" && role === "teacher") ||
      (userId === "user-student-xiaohe" && role === "student")
    ) {
      return {
        id: "class-grade5-1",
        schoolId: "school-qinghe",
        teacherId: "user-teacher-li",
        name: "五年级一班",
        grade: "五年级",
        inviteCode: "QINGHE51",
        createdAt: "2026-08-08T00:00:00.000Z",
      };
    }
    return null;
  },
}));

const database = new NetlifyDB({ logger: () => undefined });
const previousDatabaseUrl = process.env.NETLIFY_DB_URL;
const previousDatabaseDriver = process.env.NETLIFY_DB_DRIVER;
let createCode: (request: Request) => Promise<Response>;
let closeDrizzlePool: () => Promise<void>;

function requestFor(studentId: string) {
  return new Request("http://localhost/api/guardian-codes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId }),
  });
}

beforeAll(async () => {
  const localDatabaseUrl = new URL(
    (await database.start()).replace(/^postgres:/, "postgresql:"),
  );
  localDatabaseUrl.username = "postgres";
  localDatabaseUrl.password = "postgres";
  process.env.NETLIFY_DB_URL = localDatabaseUrl.toString();
  process.env.NETLIFY_DB_DRIVER = "server";
  await database.applyMigrations(
    path.join(process.cwd(), "netlify", "database", "migrations"),
  );
  ({ POST: createCode } = await import("@/app/api/guardian-codes/route"));
  const { db } = await import("@/lib/db");
  closeDrizzlePool = () =>
    (db.$client as unknown as { end: () => Promise<void> }).end();
});

afterAll(async () => {
  await closeDrizzlePool?.();
  await database.stop();
  if (previousDatabaseUrl === undefined) delete process.env.NETLIFY_DB_URL;
  else process.env.NETLIFY_DB_URL = previousDatabaseUrl;
  if (previousDatabaseDriver === undefined) delete process.env.NETLIFY_DB_DRIVER;
  else process.env.NETLIFY_DB_DRIVER = previousDatabaseDriver;
});

describe("guardian code permissions", () => {
  test("rejects guardians", async () => {
    authState.session = {
      user: {
        id: "user-parent-zhang",
        role: "parent",
        schoolId: "school-qinghe",
      },
    };

    const response = await createCode(requestFor("user-student-xiaohe"));

    expect(response.status).toBe(403);
  });

  test("allows the class teacher and returns plaintext once", async () => {
    authState.session = {
      user: {
        id: "user-teacher-li",
        role: "teacher",
        schoolId: "school-qinghe",
      },
    };

    const response = await createCode(requestFor("user-student-xiaohe"));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.code).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
    expect(payload.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
