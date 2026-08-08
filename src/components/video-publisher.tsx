"use client";

import { Upload, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { FormStatus } from "@/components/form-status";
import { Button } from "@/components/ui/button";

export function VideoPublisher() {
  const router = useRouter(); const [state, setState] = useState<{ type: "idle" | "loading" | "success" | "error"; text?: string }>({ type: "idle" });
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const upload = data.get("file") as File; if (!upload?.size) return setState({ type: "error", text: "请选择需要发布的微课视频。" }); data.set("durationSeconds", "0"); setState({ type: "loading", text: "正在上传并发布到当前班级..." }); const response = await fetch("/api/videos", { method: "POST", body: data }); const result = await response.json(); if (!response.ok) return setState({ type: "error", text: result.error }); form.reset(); setState({ type: "success", text: "微课已发布，学生现在可以查看。" }); router.refresh(); }
  return <form className="form-grid" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><div className="field"><label>标题</label><input className="input" name="title" required /></div><div className="field"><label>知识点</label><input className="input" name="knowledgePoint" required /></div></div><div className="field"><label>内容摘要 / 字幕提要</label><textarea className="textarea" name="description" required /></div><label className="video-upload"><span><Video size={28} /></span><strong>选择微课视频</strong><small>支持 MP4、WebM 或音频文件，最大 150MB</small><input name="file" type="file" accept="video/*,audio/*" required /></label><div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={state.type === "loading"}><Upload size={17} />发布微课</Button><FormStatus state={state} /></div></form>;
}
