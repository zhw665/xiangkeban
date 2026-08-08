"use client";

import { Edit3, FileText, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatChineseDate } from "@/lib/utils";

type Material = { id: string; title: string; subject: string; notes: string; summary: string; lessonPlan: string; status: string; createdAt: string };

function MaterialRecord({ item }: { item: Material }) {
  const router = useRouter(); const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const data = new FormData(event.currentTarget); const response = await fetch(`/api/materials/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: data.get("title"), subject: data.get("subject"), notes: data.get("notes"), summary: data.get("summary"), lessonPlan: data.get("lessonPlan") }) }); setBusy(false); if (!response.ok) return setError((await response.json()).error ?? "保存失败"); setEditing(false); router.refresh(); }
  return <details id={`material-${item.id}`} className="material-record"><summary><span className="row-icon"><FileText size={18} /></span><span className="row-main"><span className="flex gap-2"><Badge tone="blue">{item.subject}</Badge><Badge tone="green">已就绪</Badge></span><span className="row-title mt-2 block">{item.title}</span><span className="row-meta">{item.summary} · {formatChineseDate(item.createdAt)}</span></span><span className="record-open-label">查看</span></summary><div className="material-record-body">{editing ? <form className="form-grid" onSubmit={save}><div className="grid gap-3 sm:grid-cols-2"><div className="field"><label>课题</label><input className="input" name="title" defaultValue={item.title} required /></div><div className="field"><label>学科</label><select className="select" name="subject" defaultValue={item.subject}><option>数学</option><option>语文</option><option>科学</option><option>英语</option><option>综合实践</option></select></div></div><div className="field"><label>老师上次填写的备课要求</label><textarea className="textarea" name="notes" defaultValue={item.notes} placeholder="未填写额外备课要求" /></div><div className="field"><label>内容摘要</label><textarea className="textarea" name="summary" defaultValue={item.summary} required /></div><div className="field"><label>完整教案</label><textarea className="textarea min-h-72" name="lessonPlan" defaultValue={item.lessonPlan} required /></div>{error && <p className="error-text">{error}</p>}<div className="flex gap-2"><Button type="submit" disabled={busy}><Save size={16} />{busy ? "保存中" : "保存修改"}</Button><Button type="button" variant="secondary" onClick={() => setEditing(false)}><X size={16} />取消</Button></div></form> : <><div className="lesson-info"><div><span>老师上次填写的备课要求</span><p>{item.notes || "上次没有填写额外备课要求。"}</p></div><div><span>AI 整理摘要</span><p>{item.summary}</p></div></div><div className="mt-4"><div className="mb-2 flex items-center justify-between"><strong className="text-sm">完整教案</strong><Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Edit3 size={15} />修改备课</Button></div><pre className="lesson-plan">{item.lessonPlan}</pre></div></>}</div></details>;
}

export function MaterialHistory({ materials }: { materials: Material[] }) { return <>{materials.map((item) => <MaterialRecord item={item} key={item.id} />)}</>; }
