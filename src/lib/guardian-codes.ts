import "server-only";

import { createHash, randomBytes } from "node:crypto";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const codeLength = 10;
const validityMilliseconds = 7 * 24 * 60 * 60 * 1000;

function normalizeGuardianCode(code: string) {
  return code.replace(/[\s-]/g, "").toUpperCase();
}

export function hashGuardianCode(code: string) {
  return createHash("sha256")
    .update(normalizeGuardianCode(code), "utf8")
    .digest("hex");
}

export function createGuardianCode(now = new Date()) {
  const bytes = randomBytes(codeLength);
  const code = Array.from(bytes, (byte) => alphabet[byte & 31]).join("");

  return {
    code,
    codeHash: hashGuardianCode(code),
    expiresAt: new Date(now.getTime() + validityMilliseconds).toISOString(),
  };
}

export function isGuardianCodeUsable(
  record: { expiresAt: string; usedAt: string | null },
  now = new Date(),
) {
  const expiresAt = Date.parse(record.expiresAt);
  return record.usedAt === null && Number.isFinite(expiresAt) && expiresAt > now.getTime();
}
