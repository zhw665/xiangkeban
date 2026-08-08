import { describe, expect, test } from "vitest";

import {
  createGuardianCode,
  hashGuardianCode,
  isGuardianCodeUsable,
} from "@/lib/guardian-codes";

describe("guardian link codes", () => {
  test("creates a human-readable code and stores only its SHA-256 digest", () => {
    const created = createGuardianCode(new Date("2026-08-08T00:00:00.000Z"));

    expect(created.code).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
    expect(created.codeHash).toBe(hashGuardianCode(created.code));
    expect(created.codeHash).toMatch(/^[a-f0-9]{64}$/);
    expect(created.expiresAt).toBe("2026-08-15T00:00:00.000Z");
  });

  test("normalizes equivalent user input before hashing", () => {
    expect(hashGuardianCode("abcd-2345 ef")).toBe(
      hashGuardianCode("ABCD2345EF"),
    );
  });

  test("rejects expired and previously used records", () => {
    const now = new Date("2026-08-08T00:00:00.000Z");

    expect(
      isGuardianCodeUsable(
        { expiresAt: "2026-08-09T00:00:00.000Z", usedAt: null },
        now,
      ),
    ).toBe(true);
    expect(
      isGuardianCodeUsable(
        { expiresAt: "2026-08-07T00:00:00.000Z", usedAt: null },
        now,
      ),
    ).toBe(false);
    expect(
      isGuardianCodeUsable(
        {
          expiresAt: "2026-08-09T00:00:00.000Z",
          usedAt: "2026-08-08T00:00:00.000Z",
        },
        now,
      ),
    ).toBe(false);
  });
});
