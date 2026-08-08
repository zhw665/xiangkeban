"use client";

import { openDB } from "idb";

type QueuedRequest = { id: string; url: string; method: string; body: string; createdAt: string };

async function queueDb() {
  return openDB("xiangke-offline", 1, { upgrade(db) { if (!db.objectStoreNames.contains("requests")) db.createObjectStore("requests", { keyPath: "id" }); } });
}

export async function queuedJsonRequest(url: string, body: unknown) {
  if (navigator.onLine) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (response.ok) return { queued: false, response };
  }
  const db = await queueDb();
  await db.put("requests", { id: crypto.randomUUID(), url, method: "POST", body: JSON.stringify(body), createdAt: new Date().toISOString() } satisfies QueuedRequest);
  return { queued: true, response: null };
}

export async function flushQueuedRequests() {
  if (!navigator.onLine) return;
  const db = await queueDb();
  const entries = await db.getAll("requests") as QueuedRequest[];
  if (!entries.length) return;
  window.dispatchEvent(new Event("xiangke:sync"));
  for (const entry of entries) {
    try {
      const response = await fetch(entry.url, { method: entry.method, headers: { "Content-Type": "application/json", "X-Offline-Request-Id": entry.id }, body: entry.body });
      if (response.ok || response.status === 409) await db.delete("requests", entry.id);
    } catch { break; }
  }
}
