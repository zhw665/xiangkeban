"use client";

import { CalendarCheck, Handshake, MessageCircle, Search, TrendingUp, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import { ObservationForm } from "@/components/observation-form";
import { GuardianCodeButton } from "@/components/guardian-code-button";
import { Badge } from "@/components/ui/badge";
import { formatChineseDate } from "@/lib/utils";

type Student = { id: string; name: string };
type Observation = { id: string; studentId: string; category: "attendance" | "participation" | "cooperation" | "progress"; content: string; rating: number; occurredAt: string };
const demoStudents = [{ id: "demo-student-li", name: "李明远" }, { id: "demo-student-wang", name: "王雨欣" }];
const categoryLabels = { attendance: "出勤", participation: "课堂参与", cooperation: "合作", progress: "进步" };
const categoryIcons = { attendance: CalendarCheck, participation: MessageCircle, cooperation: Handshake, progress: TrendingUp };
const ratingLabel = (rating: number) => rating >= 5 ? "优" : rating >= 4 ? "良" : "差";

export function StudentDirectoryView({ students, observations }: { students: Student[]; observations: Observation[] }) {
  const allStudents = useMemo(() => [...students, ...demoStudents], [students]); const [selectedId, setSelectedId] = useState(allStudents[0]?.id ?? ""); const [query, setQuery] = useState(""); const selected = allStudents.find((item) => item.id === selectedId); const visible = allStudents.filter((item) => item.name.includes(query)); const isDemo = selectedId.startsWith("demo-"); const records = observations.filter((item) => item.studentId === selectedId);
  return <div className="student-workspace"><aside className="student-list"><div className="contact-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索学生" /></div><div className="contact-scroll">{visible.map((student) => <button key={student.id} className={selectedId === student.id ? "active" : ""} onClick={() => setSelectedId(student.id)}><span className="avatar">{student.name.slice(-2)}</span><span><strong>{student.name}</strong><small>{student.id.startsWith("demo-") ? "演示档案" : "五年级一班"}</small></span></button>)}</div></aside><div className="student-profile"><section className="panel"><div className="panel-header"><h2>{selected?.name} · 学情概览</h2><Badge tone="green">本周全勤</Badge></div><div className="panel-body"><div className="grid gap-3 sm:grid-cols-3"><div className="metric-soft green"><span>最近成绩</span><strong>{isDemo ? 86 : 92}</strong></div><div className="metric-soft blue"><span>待订正</span><strong>{isDemo ? 2 : 1}</strong></div><div className="metric-soft amber"><span>薄弱点</span><strong>{isDemo ? "阅读概括" : "分数意义"}</strong></div></div>{!isDemo && selected ? <GuardianCodeButton studentId={selected.id} studentName={selected.name} /> : null}<div className="mt-5 grid gap-1">{isDemo ? <><div className="list-row !px-0"><span className="timeline-dot"><MessageCircle size={14} /></span><span className="row-main"><span className="row-title">课堂参与 · 良</span><span className="row-meta">能够按要求完成小组讨论，表达还可以更完整。</span></span></div><div className="list-row !px-0"><span className="timeline-dot"><TrendingUp size={14} /></span><span className="row-main"><span className="row-title">进步 · 优</span><span className="row-meta">本周订正速度明显提高。</span></span></div></> : records.map((item) => { const Icon = categoryIcons[item.category]; return <div className="list-row !px-0" key={item.id}><span className="timeline-dot"><Icon size={14} /></span><span className="row-main"><span className="row-title">{categoryLabels[item.category]} · {ratingLabel(item.rating)}</span><span className="row-meta">{item.content} · {formatChineseDate(item.occurredAt)}</span></span></div>; })}</div></div></section><section className="panel"><div className="panel-header"><h2>新增表现记录</h2><UserRound size={18} /></div><div className="panel-body">{isDemo ? <div className="empty-state min-h-56"><UserRound size={30} className="text-zinc-400" /><h3>演示学生档案</h3><p>切换回真实学生后可新增表现记录。</p></div> : <ObservationForm students={students.filter((item) => item.id === selectedId)} />}</div></section></div></div>;
}
