import path from "node:path";

import { NetlifyDB } from "@netlify/database-dev";
import { afterAll, beforeAll, expect, test } from "vitest";

const database = new NetlifyDB({ logger: () => undefined });
const migrationsDirectory = path.join(
  process.cwd(),
  "netlify",
  "database",
  "migrations",
);

beforeAll(async () => {
  await database.start();
});

afterAll(async () => {
  await database.stop();
});

test("migrations are repeatable and seed exactly three demo users", async () => {
  await database.applyMigrations(migrationsDirectory);
  await database.applyMigrations(migrationsDirectory);

  const users = await database.query<{ count: number }>(`
    SELECT COUNT(*)::int AS count
    FROM users
    WHERE username IN ('teacher', 'student', 'parent')
  `);
  const guardianCodes = await database.query<{ name: string | null }>(`
    SELECT to_regclass('public.guardian_link_codes')::text AS name
  `);

  expect(users.rows[0]?.count).toBe(3);
  expect(guardianCodes.rows[0]?.name).toBe("guardian_link_codes");
});
