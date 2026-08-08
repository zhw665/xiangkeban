"use client";

import { useEffect } from "react";

import { flushQueuedRequests } from "@/lib/offline-queue";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => undefined);
    flushQueuedRequests().catch(() => undefined);
    const sync = () => flushQueuedRequests().catch(() => undefined);
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, []);
  return null;
}
