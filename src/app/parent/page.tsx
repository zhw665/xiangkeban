import { BookOpenCheck, CalendarCheck, CheckCircle2, ClockAlert, HandHeart, MessageSquareText, TrendingUp, UsersRound } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { SpeakButton } from "@/components/speak-button";
import { StatBlock } from "@/components/stat-block";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getParentData } from "@/lib/data";
import { requireSession } from "@/lib/dal";
import { formatChineseDate } from "@/lib/utils";

const observationMeta = {
  attendance: { label: "到校与习惯", icon: CalendarCheck },
  participation: { label: "课堂参与", icon: BookOpenCheck },
  cooperation: { label: "同伴合作", icon: UsersRound },
  progress: { label: "学习进步", icon: TrendingUp },
} as const;

function observationState(rating: number): { label: string; tone: "green" | "blue" | "amber" } {
  if (rating >= 5) return { label: "表现突出", tone: "green" };
  if (rating >= 3) return { label: "稳步进步", tone: "blue" };
  return { label: "需要支持", tone: "amber" };
}

export default async function ParentDashboard() {
  const session = await requireSession("parent");
  const data = await getParentData(session.user.id);
  if (!data) return null;

  const completed = data.assignments.filter((assignment) => assignment.submission);
  const pending = data.assignments.filter((assignment) => !assignment.submission);
  const late = pending.filter((assignment) => new Date(assignment.dueAt) < new Date()).length;
  const report = data.reports[0];
  const nextAssignment = pending[0];
  const completionRate = data.assignments.length ? Math.round(completed.length / data.assignments.length * 100) : 100;
  const recentScore = completed.find((assignment) => assignment.submission?.score != null)?.submission?.score ?? "--";
  const weeklySummary = late ? `有 ${late} 项任务需要尽快跟进` : nextAssignment ? "本周学习节奏基本稳定" : "本周任务已经全部完成";

  return <main className="page-wrap">
    <PageHeader title={`${data.student.name}的学习概览`} description={`${data.classroom.name} · 您以${data.student.relation}身份查看`} />

    <section className="parent-summary">
      <Link href="/parent/reports" className="parent-summary-main parent-summary-link" aria-label="查看本周完整学情简报">
        <span className="parent-summary-label">本周学习节奏</span>
        <h2>{weeklySummary}</h2>
        <p>{late ? "先查看尚未完成的任务，再和孩子一起安排补交时间。" : "完成情况、课堂状态和教师建议已整理在同一页，关注具体变化，不比较排名。"}</p>
        <Progress value={completionRate} label={`已完成 ${completed.length}/${data.assignments.length} 项任务`} />
      </Link>
      <div className="parent-next-step">
        <Badge tone={late ? "amber" : "green"}>{nextAssignment ? "下一步" : "本周达成"}</Badge>
        <strong>{nextAssignment?.title ?? "继续保持当前节奏"}</strong>
        <p>{nextAssignment ? `截止 ${formatChineseDate(nextAssignment.dueAt, true)}，可以先问问孩子是否遇到困难。` : "可以和孩子一起回顾本周最有成就感的一件事。"}</p>
        <Link href="/parent/reports">查看家长行动建议</Link>
      </div>
    </section>

    <section className="stats-grid parent-stats">
      <StatBlock label="作业完成" value={`${completed.length}/${data.assignments.length}`} note={`${completionRate}% 已完成`} icon={CheckCircle2} />
      <StatBlock label="需要跟进" value={late} note={late ? "存在超过截止时间的任务" : "目前没有迟交"} icon={ClockAlert} tone={late ? "coral" : "green"} />
      <StatBlock label="最近成绩" value={recentScore} note="只看个人变化，不展示排名" icon={TrendingUp} tone="blue" />
      <StatBlock label="到校情况" value="全勤" note="来自教师本周记录" icon={CalendarCheck} />
    </section>

    {report && <section className="panel mt-5">
      <div className="panel-header"><h2>本周学情简报</h2><SpeakButton text={`${report.summary}。本周完成：${report.accomplishments}。需要帮助：${report.needsHelp}。家长可以：${report.familyActions}`} /></div>
      <div className="grid gap-4 p-4 md:grid-cols-3">
        <div><Badge tone="green">本周完成了什么</Badge><p className="mt-3 text-sm leading-7">{report.accomplishments}</p></div>
        <div><Badge tone="amber">哪里需要帮助</Badge><p className="mt-3 text-sm leading-7">{report.needsHelp}</p></div>
        <div><Badge tone="blue">家长可以做什么</Badge><p className="mt-3 text-sm leading-7">{report.familyActions}</p></div>
      </div>
      <div className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-600">{report.summary} <Link className="font-bold text-emerald-700" href="/parent/reports">查看完整简报</Link></div>
    </section>}

    <div className="content-grid two">
      <section className="panel parent-observations">
        <div className="panel-header"><div><h2>在校表现</h2><p>教师记录的具体事实，不使用星级排名</p></div><Badge tone="green">{data.observations.length} 条记录</Badge></div>
        {data.observations.length ? data.observations.map((item) => {
          const meta = observationMeta[item.category];
          const state = observationState(item.rating);
          const Icon = meta.icon;
          return <article className="parent-observation-row" key={item.id}>
            <span className="row-icon"><Icon size={18} /></span>
            <div className="row-main">
              <div className="parent-observation-meta"><Badge tone="zinc">{meta.label}</Badge><Badge tone={state.tone}>{state.label}</Badge><span>{formatChineseDate(item.occurredAt)}</span></div>
              <h3>{item.content}</h3>
            </div>
          </article>;
        }) : <div className="empty-state min-h-48"><HandHeart size={30} className="text-zinc-400" /><h3>本周暂无新记录</h3><p>教师新增并选择同步后，会显示在这里。</p></div>}
      </section>
      <aside className="panel">
        <div className="panel-header"><h2>老师通知</h2><Link href="/parent/notices" className="text-xs font-bold text-emerald-700">全部</Link></div>
        {data.posts.slice(0, 2).map((post) => <div className="list-row" key={post.id}><span className="row-icon"><MessageSquareText size={18} /></span><span className="row-main"><span className="row-title">{post.title}</span><span className="row-meta">{post.content}</span></span></div>)}
      </aside>
    </div>
  </main>;
}
