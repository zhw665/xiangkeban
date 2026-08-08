import type { ReactNode } from "react";
import { PortalLayout } from "@/components/portal-layout";
export const dynamic = "force-dynamic";
export default async function Layout({ children }: { children: ReactNode }) { return PortalLayout({ role: "teacher", children }); }
