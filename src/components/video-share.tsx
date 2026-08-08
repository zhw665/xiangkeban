"use client";

import { Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function VideoShare({ videoId }: { videoId: string }) {
  const router = useRouter(); const [target, setTarget] = useState("四年级二班"); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  async function share() { setBusy(true); setStatus(""); const response = await fetch(`/api/videos/${videoId}/share`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetClassName: target }) }); const result = await response.json(); setBusy(false); if (!response.ok) return setStatus(result.error ?? "分享失败"); setStatus(result.alreadyShared ? "该班级已经分享过" : `已分享到${target}`); router.refresh(); }
  return <div className="flex flex-wrap items-center gap-2"><select className="select w-auto min-w-36" value={target} onChange={(e) => setTarget(e.target.value)}><option>四年级二班</option><option>六年级一班</option></select><Button onClick={share} disabled={busy}><Share2 size={16} />分享到其他班级</Button>{status && <span className="text-xs text-emerald-700" role="status">{status}</span>}</div>;
}
