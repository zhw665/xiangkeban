import { ClipboardCheck, Clock3 } from "lucide-react";
import Link from "next/link";
import { AssignmentCreateForm } from "@/components/assignment-forms";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getTeacherData } from "@/lib/data";
import { requireSession } from "@/lib/dal";
import { formatChineseDate } from "@/lib/utils";

export default async function AssignmentsPage() { const session = await requireSession("teacher"); const data = await getTeacherData(session.user.id); if (!data) return null; return <main className="page-wrap"><PageHeader title="作业管理" description="发布练习、查看提交进度，客观题自动检查，主观题保留教师反馈空间" /><div className="content-grid two"><section className="panel"><div className="panel-header"><h2>发布新作业</h2></div><div className="panel-body"><AssignmentCreateForm /></div></section><aside className="panel"><div className="panel-header"><h2>当前作业</h2><span className="text-xs text-zinc-500">点击查看完成情况</span></div>{data.assignments.map((item) => <Link href={`/teacher/assignments/${item.id}`} className="list-row assignment-link" key={item.id}><span className="row-icon"><ClipboardCheck size={18} /></span><span className="row-main"><span className="flex gap-2"><Badge tone="blue">{item.subject}</Badge><Badge tone="green">已发布</Badge></span><span className="row-title mt-2 block">{item.title}</span><span className="row-meta flex items-center gap-1"><Clock3 size={13} />截止 {formatChineseDate(item.dueAt, true)}</span><div className="mt-3"><Progress value={item.submitted / item.total * 100} label={`${item.submitted}/${item.total} 人已提交`} /></div></span></Link>)}</aside></div></main>; }
