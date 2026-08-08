import { Clock3, FileText } from "lucide-react";
import { MaterialUpload } from "@/components/material-upload";
import { MaterialHistory } from "@/components/material-history";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getTeacherData } from "@/lib/data";
import { requireSession } from "@/lib/dal";
import { formatChineseDate } from "@/lib/utils";

export default async function MaterialsPage() { const session = await requireSession("teacher"); const data = await getTeacherData(session.user.id); if (!data) return null; return <main className="page-wrap"><PageHeader title="备课中心" description="上传材料，让 AI 先整理；教案内容由老师最终决定" /><div className="content-grid two"><section className="panel"><div className="panel-header"><h2>新建备课</h2><Badge tone="green">AI 辅助</Badge></div><div className="panel-body"><MaterialUpload /></div></section><aside className="panel"><div className="panel-header"><h2>最近备课</h2><Clock3 size={17} /></div><div>{data.materials.slice(0,4).map((item) => <a className="list-row" href={`#material-${item.id}`} key={item.id}><span className="row-icon"><FileText size={17} /></span><span className="row-main"><span className="row-title">{item.title}</span><span className="row-meta">{item.subject} · {formatChineseDate(item.createdAt)} · 可查看和修改</span></span></a>)}</div></aside></div><section className="panel mt-5"><div className="panel-header"><h2>历史备课记录</h2><span className="text-xs text-zinc-500">{data.materials.length} 份</span></div><MaterialHistory materials={data.materials} /></section></main>; }
