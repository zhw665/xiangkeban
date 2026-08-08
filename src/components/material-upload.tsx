"use client";

import { Sparkles, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/form-status";

export function MaterialUpload() {
  const router = useRouter();
  const [state, setState] = useState<{ type: "idle" | "loading" | "success" | "error"; text?: string }>({ type: "idle" });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState({ type: "loading", text: "正在提取内容并生成教案..." });
    const form = event.currentTarget;
    const response = await fetch("/api/materials", { method: "POST", body: new FormData(form) });
    const result = await response.json();
    if (!response.ok) return setState({ type: "error", text: result.error ?? "上传失败" });
    form.reset(); setState({ type: "success", text: "课件已入库，AI 教案已生成。" }); router.refresh();
  }
  return <form className="form-grid" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><div className="field"><label htmlFor="material-title">课题</label><input id="material-title" className="input" name="title" placeholder="如：小数乘法" required /></div><div className="field"><label htmlFor="material-subject">学科</label><select id="material-subject" className="select" name="subject"><option>数学</option><option>语文</option><option>科学</option><option>英语</option><option>综合实践</option></select></div></div><div className="field"><label htmlFor="material-file">课件文件</label><input id="material-file" className="input h-auto py-2" name="file" type="file" accept=".pdf,.docx,.pptx,.txt,image/*" /><span className="helper">支持 PDF、DOCX、PPTX、TXT 和图片，最大 20MB；没有文件也可按主题生成。</span></div><div className="field"><label htmlFor="material-notes">备课要求</label><textarea id="material-notes" className="textarea" name="notes" placeholder="写下班级情况、可用教具或希望联系的乡土情境" /></div><div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={state.type === "loading"}><Sparkles size={17} />AI 生成教案</Button><Button type="button" variant="secondary" onClick={() => document.getElementById("material-file")?.click()}><Upload size={17} />选择课件</Button><FormStatus state={state} /></div></form>;
}
