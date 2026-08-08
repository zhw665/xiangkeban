import type { LucideIcon } from "lucide-react";
import Link from "next/link";

const tones = { green: "bg-emerald-50 text-emerald-700", blue: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700", coral: "bg-red-50 text-red-700" };

export function StatBlock({ label, value, note, icon: Icon, tone = "green", href }: { label: string; value: string | number; note: string; icon: LucideIcon; tone?: keyof typeof tones; href?: string }) {
  const content = <><div className="stat-head"><span>{label}</span><span className={`stat-icon ${tones[tone]}`}><Icon size={17} /></span></div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></>;
  return href ? <Link href={href} className="stat-block stat-link" aria-label={`${label}：${value}，查看详情`}>{content}</Link> : <div className="stat-block">{content}</div>;
}
