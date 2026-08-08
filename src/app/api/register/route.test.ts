import path from "node:path";

import { NetlifyDB } from "@netlify/database-dev";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { hashGuardianCode } from "@/lib/guardian-codes";

const database = new NetlifyDB({ logger: () => undefined });
const previousDatabaseUrl = process.env.NETLIFY_DB_URL;
const previousDatabaseDriver = process.env.NETLIFY_DB_DRIVER;
const previousSchoolInviteCode = process.env.SCHOOL_INVITE_CODE;
let register: (request: Request) => Promise<Response>;
let closeDrizzlePool: () => Promise<void>;

function registrationRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
  process.env.SCHOOL_INVITE_CODE = "QINGHE-SCHOOL-2026";
  await database.applyMigrations(
    path.join(process.cwd(), "netlify", "database", "migrations"),
  );
  ({ POST: register } = await import("@/app/api/register/route"));
  const { db } = await import("@/lib/db");
  closeDrizzlePool = () =>
    (db.$client as unknown as { end: () => Promise<void> }).end();
});

afterAll(async () => {
  await closeDrizzlePool();
  await database.stop();
  if (previousDatabaseUrl === undefined) delete process.env.NETLIFY_DB_URL;
  else process.env.NETLIFY_DB_URL = previousDatabaseUrl;
  if (previousDatabaseDriver === undefined) delete process.env.NETLIFY_DB_DRIVER;
  else process.env.NETLIFY_DB_DRIVER = previousDatabaseDriver;
  if (previousSchoolInviteCode === undefined) delete process.env.SCHOOL_INVITE_CODE;
  else process.env.SCHOOL_INVITE_CODE = previousSchoolInviteCode;
});

describe("registration security", () => {
  test("rejects a teacher with the wrong school invite code", async () => {
    const response = await register(
      registrationRequest({
        role: "teacher",
        name: "王老师",
        username: "teacher_wrong_invite",
        password: "password123",
        className: "五年级二班",
        grade: "五年级",
        schoolInviteCode: "WRONG-CODE",
      }),
    );

    expect(response.status).toBe(403);
  });

  test("student registration returns a one-time guardian code", async () => {
    const response = await register(
      registrationRequest({
        role: "student",
        name: "周小雨",
        username: "student_new",
        password: "password123",
        inviteCode: "QINGHE51",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.guardianCode).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
  });

  test("guardian code can be consumed only once", async () => {
    const guardianCode = "ABCD2345EF";
    await database.query(
      `INSERT INTO guardian_link_codes
        (id, student_id, code_hash, expires_at, used_at, created_by, created_at)
       VALUES ($1, $2, $3, $4, NULL, $2, $5)`,
      [
        "guardian-code-test",
        "user-student-xiaohe",
        hashGuardianCode(guardianCode),
        "2099-01-01T00:00:00.000Z",
        "2026-08-08T00:00:00.000Z",
      ],
    );

    const firstResponse = await register(
      registrationRequest({
        role: "parent",
        name: "赵家长",
        username: "parent_new_one",
        password: "password123",
        guardianCode,
        relation: "母亲",
      }),
    );
    const secondResponse = await register(
      registrationRequest({
        role: "parent",
        name: "钱家长",
        username: "parent_new_two",
        password: "password123",
        guardianCode,
        relation: "父亲",
      }),
    );

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(409);
  });
});
