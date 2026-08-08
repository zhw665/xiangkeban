import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const tones = {
  green: "bg-emerald-50 text-emerald-800",
  blue: "bg-sky-50 text-sky-800",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
  zinc: "bg-zinc-100 text-zinc-700",
};

export function Badge({ children, tone = "zinc", className }: { children: ReactNode; tone?: keyof typeof tones; className?: string }) {
  return <span className={cn("inline-flex min-h-6 items-center rounded px-2 py-1 text-xs font-medium", tones[tone], className)}>{children}</span>;
}
