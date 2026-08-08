"use client";

import { Camera, Send, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormStatus } from "@/components/form-status";
import { Button } from "@/components/ui/button";
import { queuedJsonRequest } from "@/lib/offline-queue";

export function StudentQuestionForm() {
  const router = useRouter(); const [help, setHelp] = useState(false);
  const [state, setState] = useState<{ type: "idle" | "loading" | "success" | "error"; text?: string }>({ type: "idle" });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState({ type: "loading", text: "AI 正在整理问题..." }); const form = event.currentTarget; const data = new FormData(form);
    if (help) data.set("content", `[我需要帮助] ${data.get("content")}`);
    const file = data.get("file") as File;
    let response: Response | null = null; let queued = false;
    if (file?.size) response = await fetch("/api/questions", { method: "POST", body: data });
    else ({ response, queued } = await queuedJsonRequest("/api/questions", { content: data.get("content"), subject: data.get("subject") }));
    if (queued) { form.reset(); setHelp(false); return setState({ type: "success", text: "网络较弱，问题已保存，恢复后会自动发送。" }); }
    const result = await response!.json(); if (!response!.ok) return setState({ type: "error", text: result.error ?? "提交失败" });
    form.reset(); setHelp(false); setState({ type: "success", text: `已提交。提示：${result.hint}` }); router.refresh();
  }
  return <form className="form-grid" onSubmit={submit}><div className="field"><label htmlFor="question-subject">学科</label><select id="question-subject" className="select" name="subject"><option>数学</option><option>语文</option><option>科学</option><option>英语</option><option>生活与成长</option></select></div><div className="field"><label htmlFor="question-content">我哪里没弄明白</label><textarea id="question-content" className="textarea min-h-36" name="content" placeholder="把你已经想到哪一步、卡在哪里写清楚" required minLength={4} /></div><div className="field"><label htmlFor="question-file">拍照补充（可选）</label><input id="question-file" className="input h-auto py-2" name="file" type="file" accept="image/*" capture="environment" /></div><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={help} onChange={(e) => setHelp(e.target.checked)} />我需要老师额外关注这件事</label><div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={state.type === "loading"}><Send size={17} />提交给老师</Button><span className="helper flex items-center gap-1"><Camera size={14} />支持拍照；AI 只给提示，老师会正式回复</span></div><FormStatus state={state} /></form>;
}

export function TeacherQuestionReply({ id, draft, defaultPublic = false, editing = false }: { id: string; draft: string; defaultPublic?: boolean; editing?: boolean }) {
  const router = useRouter(); const [content, setContent] = useState(draft); const [isPublic, setPublic] = useState(defaultPublic); const [busy, setBusy] = useState(false);
  async function submit() { setBusy(true); const response = await fetch(`/api/questions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, isPublic }) }); setBusy(false); if (response.ok) router.refresh(); else alert((await response.json()).error ?? "发布失败"); }
  return <div className="mt-3 grid gap-3"><label className="field"><span className="flex items-center gap-2 text-xs font-bold text-emerald-800"><WandSparkles size={14} />{editing ? "当前教师答案（可追加或修改）" : "AI 回复草稿（发布前请核对）"}</span><textarea className="textarea" value={content} onChange={(e) => setContent(e.target.value)} /></label><div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={isPublic} onChange={(e) => setPublic(e.target.checked)} />匿名公开到班级答疑</label><Button size="sm" onClick={submit} disabled={busy}>{busy ? "发布中..." : editing ? "保存修改" : "确认回复"}</Button></div></div>;
}
