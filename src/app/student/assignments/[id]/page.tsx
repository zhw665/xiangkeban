import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { SubmissionForm } from "@/components/assignment-forms";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getAssignmentForStudent } from "@/lib/data";
import { requireSession } from "@/lib/dal";
import { formatChineseDate } from "@/lib/utils";

export default async function AssignmentDetail({ params }: { params: Promise<{ id: string }> }) { const session = await requireSession("student"); const { id } = await params; const data = await getAssignmentForStudent(id, session.user.id); if (!data) notFound(); let answers: Record<string,string> = {}; try { answers = JSON.parse(data.submission?.answersJson ?? "{}"); } catch {} const description = data.assignment.description.trim().replace(/[。！？!?]+$/, ""); return <main className="page-wrap"><PageHeader title={data.assignment.title} description={`${data.assignment.subject} · 截止 ${formatChineseDate(data.assignment.dueAt, true)}`} actions={<div className="flex flex-wrap items-center gap-2"><Link className="side-link border border-zinc-200 bg-white" href="/student/assignments"><ArrowLeft size={17} />返回作业</Link>{data.submission && <Badge tone="green">上次得分 {data.submission.score ?? 0}</Badge>}</div>} /><div className="callout mb-5">{description}。简答题会保留给老师进一步查看；重新提交可用于订正。</div>{data.assignment.fileId && <a className="attachment-link mb-5" href={`/api/files/${data.assignment.fileId}`}><FileText size={18} /><span><strong>老师发布的作业附件</strong><small>点击查看图片或下载文件</small></span><Download size={17} /></a>}<SubmissionForm assignmentId={data.assignment.id} items={data.items} initialAnswers={answers} />{data.submission?.feedback && <div className="panel mt-5 p-4"><strong className="text-sm">批改反馈</strong><p className="mt-2 text-sm leading-7 text-zinc-600">{data.submission.feedback}</p></div>}</main>; }
