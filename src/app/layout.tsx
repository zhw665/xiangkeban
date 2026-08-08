import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { NetworkStatus } from "@/components/network-status";
import { PwaRegister } from "@/components/pwa-register";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "乡课伴", template: "%s | 乡课伴" },
  description: "连接教师、学生和家长的乡村课堂 AI 助教",
};

export const viewport: Viewport = { themeColor: "#166534", colorScheme: "light" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <PwaRegister />
        <NetworkStatus />
        {children}
      </body>
    </html>
  );
}
