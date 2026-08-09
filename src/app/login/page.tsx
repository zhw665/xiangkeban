import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "登录" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.role) redirect(`/${session.user.role}`);
  return (
    <main className="login-page login-page-centered">
      <section className="login-panel">
        <LoginForm />
      </section>
    </main>
  );
}
