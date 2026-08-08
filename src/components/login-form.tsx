"use client";

import { ArrowRight, Check, GraduationCap, LoaderCircle, School, UsersRound } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DEMO_USERS, type UserRole } from "@/lib/constants";

const roles = [
  { role: "teacher" as const, title: "教师端", detail: "李晓云 · 班主任", icon: School, tone: "bg-emerald-50 text-emerald-700" },
  { role: "student" as const, title: "学生端", detail: "张小禾 · 五年级一班", icon: GraduationCap, tone: "bg-sky-50 text-sky-700" },
  { role: "parent" as const, title: "家长端", detail: "张桂兰 · 小禾家长", icon: UsersRound, tone: "bg-amber-50 text-amber-700" },
];

export function LoginForm() {
  const router = useRouter();
  const passwordInput = useRef<HTMLInputElement>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function selectRole(role: UserRole) {
    setError("");
    if (selectedRole !== role) setPassword("");
    setSelectedRole(role);
    setUsername(DEMO_USERS[role].username);
    requestAnimationFrame(() => passwordInput.current?.focus());
  }

  async function login() {
    if (!selectedRole) return setError("请先选择教师端、学生端或家长端。");
    if (username.trim() !== DEMO_USERS[selectedRole].username) return setError("所选端口与账号不匹配，请检查后重试。");
    setError("");
    setLoadingRole(selectedRole);
    const result = await signIn("credentials", { username: username.trim(), password, redirect: false });
    if (result?.error) {
      setError("账号或密码不正确，请重试。 ");
      setLoadingRole(null);
      return;
    }
    router.push(DEMO_USERS[selectedRole].path);
    router.refresh();
  }

  return (
    <div className="login-box">
      <div className="login-brand"><span className="brand-mark"><School size={24} /></span><div><strong className="block text-xl">乡课伴</strong><span className="text-xs text-zinc-500">青禾中心小学</span></div></div>
      <h2>进入你的课堂</h2>
      <p className="login-subtitle">五年级一班 · 演示环境</p>
      <div className="role-grid">
        {roles.map(({ role, title, detail, icon: Icon, tone }) => <button key={role} type="button" className={`role-card ${selectedRole === role ? "selected" : ""}`} aria-pressed={selectedRole === role} disabled={Boolean(loadingRole)} onClick={() => selectRole(role)}><span className={`role-card-icon ${tone}`}>{loadingRole === role ? <LoaderCircle className="animate-spin" size={22} /> : <Icon size={22} />}</span><span><span className="role-card-name block">{title}</span><span className="role-card-detail block">{detail}</span></span>{selectedRole === role ? <Check className="role-card-arrow selected-check" size={19} /> : <ArrowRight className="role-card-arrow" size={18} />}</button>)}
      </div>
      <div className="login-divider">账号登录</div>
      <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void login(); }}>
        <div className="field"><label htmlFor="username">账号</label><input className="input" id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="请先选择登录端口" required /></div>
        <div className="field"><label htmlFor="password">密码</label><input ref={passwordInput} className="input" id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="请输入密码" required /></div>
        {error ? <p className="error-text" role="alert">{error}</p> : null}
        <Button type="submit" size="lg" disabled={Boolean(loadingRole) || !selectedRole || !username || !password}>{loadingRole ? <LoaderCircle className="animate-spin" size={18} /> : null}登录</Button>
        <p className="text-center text-sm text-zinc-600">还没有账号？<Link href="/register" className="ml-1 font-bold text-emerald-700">立即注册</Link></p>
      </form>
    </div>
  );
}
