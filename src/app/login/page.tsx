import Image from "next/image";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "登录" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.role) redirect(`/${session.user.role}`);
  return <main className="login-page"><section className="login-visual" aria-label="明亮安静的课堂"><Image src="/images/rural-classroom-v2.jpg" alt="整洁明亮的空教室，课桌面向黑板整齐排列" fill sizes="50vw" priority /><div className="login-caption"><h1>乡课伴</h1><p>让每一次提问，都有人认真回应</p></div></section><section className="login-panel"><LoginForm /></section></main>;
}
