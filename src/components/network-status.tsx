"use client";

import { CloudOff, RefreshCw, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export function NetworkStatus() {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const handleSync = () => {
      setSyncing(true);
      window.setTimeout(() => setSyncing(false), 1400);
    };
    window.addEventListener("xiangke:sync", handleSync);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("xiangke:sync", handleSync);
    };
  }, []);

  if (!online) return <div className="network-banner offline"><CloudOff size={16} />当前为离线模式，提交会在联网后自动发送</div>;
  if (syncing) return <div className="network-banner syncing"><RefreshCw className="animate-spin" size={16} />正在同步离线内容</div>;
  return <span className="sr-only"><Wifi size={16} />网络正常</span>;
}
