import "server-only";

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { auditLogs, requestKeys } from "@/db/schema";
import { db, dbReady } from "@/lib/db";
import { nowIso } from "@/lib/utils";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function recordAudit(actorId: string, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) {
  await dbReady;
  await db.insert(auditLogs).values({ id: randomUUID(), actorId, action, entityType, entityId, metadata: JSON.stringify(metadata), createdAt: nowIso() });
}

export async function claimOfflineRequest(request: Request, userId: string) {
  const key = request.headers.get("X-Offline-Request-Id");
  if (!key) return true;
  try {
    await dbReady;
    await db.insert(requestKeys).values({ id: key, userId, createdAt: nowIso() });
    return true;
  } catch {
    return false;
  }
}
