"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/form-status";

export function ObservationForm({ students }: { students: { id: string; name: string }[] }) {
  const router = useRouter(); const [state, setState] = useState<{ type: "idle" | "loading" | "success" | "error"; text?: string }>({ type: "idle" });
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setState({ type: "loading", text: "正在保存..." }); const response = await fetch("/api/observations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: data.get("studentId"), category: data.get("category"), content: data.get("content"), rating: Number(data.get("rating")), visibleToGuardian: data.get("visible") === "on" }) }); const result = await response.json(); if (!response.ok) return setState({ type: "error", text: result.error }); form.reset(); setState({ type: "success", text: "表现记录已保存。" }); router.refresh(); }
  return <form className="form-grid" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-3"><div className="field"><label>学生</label><select className="select" name="studentId">{students.map((student) => <option value={student.id} key={student.id}>{student.name}</option>)}</select></div><div className="field"><label>类别</label><select className="select" name="category"><option value="attendance">出勤</option><option value="participation">课堂参与</option><option value="cooperation">合作</option><option value="progress">进步</option></select></div><div className="field"><label>表现等级</label><select className="select" name="rating" defaultValue="5"><option value="5">优</option><option value="4">良</option><option value="2">差</option></select></div></div><div className="field"><label>具体记录</label><textarea className="textarea" name="content" required minLength={4} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visible" defaultChecked />同步给家长查看</label><div className="flex items-center gap-3"><Button type="submit">保存记录</Button><FormStatus state={state} /></div></form>;
}
