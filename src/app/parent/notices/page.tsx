import { Bell, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SpeakButton } from "@/components/speak-button";
import { Badge } from "@/components/ui/badge";
import { getParentData } from "@/lib/data";
import { requireSession } from "@/lib/dal";
import { formatChineseDate } from "@/lib/utils";

export default async function NoticesPage() { const session = await requireSession("parent"); const data = await getParentData(session.user.id); if (!data) return null; return <main className="page-wrap"><PageHeader title="学校通知" description="只显示教师公告和公开教学资源，不显示其他学生信息" /><section className="panel">{data.posts.map((post) => <article className="list-row" key={post.id}><span className="row-icon"><Bell size={18} /></span><span className="row-main"><span className="flex flex-wrap gap-2"><Badge tone="blue">教师公告</Badge><Badge tone="green"><CheckCheck size={13} className="mr-1" />已读</Badge></span><h2 className="row-title mt-3">{post.title}</h2><p className="mt-2 text-sm leading-8 text-zinc-600">{post.content}</p><div className="mt-3 flex items-center gap-3"><SpeakButton text={`${post.title}。${post.content}`} /><span className="row-meta">{formatChineseDate(post.createdAt, true)}</span></div></span></article>)}</section></main>; }
