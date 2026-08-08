"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Bell, BookOpen, ChartNoAxesCombined, CircleHelp, ClipboardCheck, FileChartColumn,
  FolderOpen, Home, LogOut, Menu, MessageCircleQuestion, MessagesSquare, School, Users, Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";

import { ROLE_LABELS, type UserRole } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";
import { ClassSwitcher } from "@/components/class-switcher";

const navItems = {
  teacher: [
    { href: "/teacher", label: "工作台", icon: Home },
    { href: "/teacher/materials", label: "备课中心", icon: FolderOpen },
    { href: "/teacher/questions", label: "学生问题", icon: MessageCircleQuestion },
    { href: "/teacher/assignments", label: "作业管理", icon: ClipboardCheck },
    { href: "/teacher/videos", label: "微课", icon: Video },
    { href: "/teacher/class-group", label: "班级群", icon: MessagesSquare },
    { href: "/teacher/messages", label: "家校沟通", icon: MessagesSquare },
    { href: "/teacher/students", label: "学生档案", icon: Users },
  ],
  student: [
    { href: "/student", label: "今日学习", icon: Home },
    { href: "/student/learn", label: "课堂资料", icon: BookOpen },
    { href: "/student/assignments", label: "我的作业", icon: ClipboardCheck },
    { href: "/student/questions", label: "提问答疑", icon: CircleHelp },
    { href: "/student/growth", label: "成长记录", icon: ChartNoAxesCombined },
    { href: "/student/messages", label: "班级群", icon: MessagesSquare },
  ],
  parent: [
    { href: "/parent", label: "孩子概览", icon: Home },
    { href: "/parent/reports", label: "学情简报", icon: FileChartColumn },
    { href: "/parent/notices", label: "学校通知", icon: Bell },
    { href: "/parent/messages", label: "联系老师", icon: MessagesSquare },
  ],
} satisfies Record<UserRole, { href: string; label: string; icon: typeof Home }[]>;

export function AppShell({ children, role, userName, className, schoolName, unreadCount }: {
  children: ReactNode; role: UserRole; userName: string; className: string; schoolName: string; unreadCount: number;
}) {
  const pathname = usePathname();
  const items = navItems[role];
  const primaryMobile = items.slice(0, 4);
  const overflowMobile = items.slice(4);
  const isActive = (href: string) => pathname === href || (href !== `/${role}` && pathname.startsWith(`${href}/`));

  return (
    <div className={cn("app-shell", role === "parent" && "parent-mode")}>
      <aside className="sidebar">
        <Link href={`/${role}`} className="brand-lockup">
          <span className="brand-mark"><School size={21} /></span>
          <span><span className="brand-name">乡课伴</span><span className="brand-school block">{schoolName}</span></span>
        </Link>
        <nav className="side-nav" aria-label={`${ROLE_LABELS[role]}导航`}>
          {items.map((item) => <Link key={item.href} href={item.href} className={cn("side-link", isActive(item.href) && "active")}><item.icon size={19} /><span>{item.label}</span></Link>)}
        </nav>
        <div className="side-footer">
          <div className="user-row"><span className="avatar">{initials(userName)}</span><span className="min-w-0"><strong className="block truncate text-sm">{userName}</strong><span className="role-pill">{ROLE_LABELS[role]}</span></span></div>
          <button className="side-link w-full" onClick={() => signOut({ redirectTo: "/login" })}><LogOut size={18} />退出登录</button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <ClassSwitcher className={className} allowDemoClasses={role === "teacher"} />
          <div className="top-actions">
            <Link href={`/${role}`} className="icon-link" aria-label="通知中心" title="通知中心"><Bell size={19} />{unreadCount > 0 ? <span className="notification-dot" /> : null}</Link>
            <span className="avatar" aria-label={userName}>{initials(userName)}</span>
          </div>
        </header>
        {children}
      </div>
      <nav className="mobile-nav" aria-label="移动端主导航">
        {primaryMobile.map((item) => <Link key={item.href} href={item.href} className={cn("mobile-link", isActive(item.href) && "active")}><item.icon size={20} /><span className="truncate">{item.label}</span></Link>)}
        {overflowMobile.length ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className={cn("mobile-link", overflowMobile.some((item) => isActive(item.href)) && "active")}><Menu size={20} /><span>更多</span></DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content side="top" align="end" sideOffset={10} className="z-50 min-w-44 rounded-md border border-zinc-200 bg-white p-1 shadow-xl">
                {overflowMobile.map((item) => <DropdownMenu.Item key={item.href} asChild><Link href={item.href} className="flex h-10 items-center gap-3 rounded px-3 text-sm outline-none hover:bg-zinc-100"><item.icon size={18} />{item.label}</Link></DropdownMenu.Item>)}
                <DropdownMenu.Separator className="my-1 h-px bg-zinc-100" />
                <DropdownMenu.Item className="flex h-10 cursor-pointer items-center gap-3 rounded px-3 text-sm text-red-700 outline-none hover:bg-red-50" onSelect={() => signOut({ redirectTo: "/login" })}><LogOut size={18} />退出登录</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : <button className="mobile-link" onClick={() => signOut({ redirectTo: "/login" })}><LogOut size={20} /><span>退出</span></button>}
      </nav>
    </div>
  );
}
