"use client";

import { KeyRound, LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function GuardianCodeButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [result, setResult] = useState<{ code: string; expiresAt: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function generate() {
    setStatus("loading");
    try {
      const response = await fetch("/api/guardian-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "生成失败");
      setResult(payload);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-zinc-100 py-3">
      <div>
        <strong className="text-sm text-zinc-900">家长绑定</strong>
        <p className="mt-1 text-xs text-zinc-500">为{studentName}生成 7 天有效的一次性绑定码</p>
        {status === "error" ? <p className="mt-1 text-xs text-red-600">生成失败，请稍后重试</p> : null}
      </div>
      {result ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-bold text-blue-700">{result.code}</span>
          <Button type="button" variant="secondary" size="sm" onClick={generate} disabled={status === "loading"}>
            <RefreshCw size={14} />重新生成
          </Button>
        </div>
      ) : (
        <Button type="button" variant="secondary" size="sm" onClick={generate} disabled={status === "loading"}>
          {status === "loading" ? <LoaderCircle className="animate-spin" size={15} /> : <KeyRound size={15} />}
          生成绑定码
        </Button>
      )}
    </div>
  );
}
