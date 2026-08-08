import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { requireSession, getClassContext } from "@/lib/dal";
import { getUnreadCount } from "@/lib/data";
import type { UserRole } from "@/lib/constants";

export async function PortalLayout({ role, children }: { role: UserRole; children: ReactNode }) {
  const session = await requireSession(role);
  const classroom = await getClassContext(session.user.id, role);
  if (!classroom) return <main className="grid min-h-screen place-items-center p-8">当前账号尚未加入班级</main>;
  const unreadCount = await getUnreadCount(session.user.id);
  return <AppShell role={role} userName={session.user.name ?? "用户"} className={classroom.name} schoolName="青禾中心小学" unreadCount={unreadCount}>{children}</AppShell>;
}
