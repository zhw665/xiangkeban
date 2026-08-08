import Image from "next/image";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegisterForm } from "@/components/register-form";

export const metadata = { title: "注册" };

export default async function RegisterPage() {
  const session = await auth(); if (session?.user?.role) redirect(`/${session.user.role}`);
  return <main className="login-page"><section className="login-visual" aria-label="明亮安静的课堂"><Image src="/images/rural-classroom-v2.jpg" alt="整洁明亮的空教室，课桌面向黑板整齐排列" fill sizes="50vw" priority /><div className="login-caption"><h1>加入乡课伴</h1><p>让学校、家庭与每一位学生保持连接</p></div></section><section className="login-panel"><RegisterForm /></section></main>;
}
