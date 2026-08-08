import { CheckCircle2, ClipboardList, RotateCcw } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getStudentData } from "@/lib/data";
import { requireSession } from "@/lib/dal";
import { formatChineseDate } from "@/lib/utils";

export default async function AssignmentsPage() { const session = await requireSession("student"); const data = await getStudentData(session.user.id); if (!data) return null; return <main className="page-wrap"><PageHeader title="我的作业" description="可以保存进度，弱网提交会自动排队，恢复连接后继续发送" /><section className="panel">{data.assignments.map((item) => { const status = item.submission?.status; return <Link href={`/student/assignments/${item.id}`} className="list-row" key={item.id}><span className="row-icon">{status === "graded" ? <CheckCircle2 size={19} /> : status === "revision" ? <RotateCcw size={19} /> : <ClipboardList size={19} />}</span><span className="row-main"><span className="flex flex-wrap gap-2"><Badge tone="blue">{item.subject}</Badge><Badge tone={status === "graded" ? "green" : status === "revision" ? "red" : "amber"}>{status === "graded" ? `已批改 ${item.submission?.score}分` : status === "revision" ? "需订正" : "待完成"}</Badge></span><span className="row-title mt-2 block">{item.title}</span><span className="row-meta">截止 {formatChineseDate(item.dueAt, true)} · {item.description}</span>{item.submission?.feedback && <span className="mt-2 block text-xs text-emerald-800">老师反馈：{item.submission.feedback}</span>}</span></Link>; })}</section></main>; }
