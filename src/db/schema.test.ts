import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, test } from "vitest";

import { guardianLinkCodes, users } from "@/db/schema";

describe("PostgreSQL schema", () => {
  test("defines users as a PostgreSQL table", () => {
    expect(getTableConfig(users).name).toBe("users");
  });

  test("defines one-time guardian link codes", () => {
    const config = getTableConfig(guardianLinkCodes);

    expect(config.columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        "student_id",
        "code_hash",
        "expires_at",
        "used_at",
      ]),
    );
  });
});
