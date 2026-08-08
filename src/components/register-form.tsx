"use client";

import { ArrowLeft, CheckCircle2, GraduationCap, School, UsersRound } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { FormStatus } from "@/components/form-status";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/constants";

const roles = [
  { role: "teacher" as const, label: "教师", icon: School },
  { role: "student" as const, label: "学生", icon: GraduationCap },
  { role: "parent" as const, label: "家长", icon: UsersRound },
];

export function RegisterForm() {
  const [role, setRole] = useState<UserRole>("teacher");
  const [result, setResult] = useState<{ username: string; inviteCode?: string } | null>(null);
  const [state, setState] = useState<{ type: "idle" | "loading" | "success" | "error"; text?: string }>({ type: "idle" });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    if (data.get("password") !== data.get("confirmPassword")) return setState({ type: "error", text: "两次输入的密码不一致" });
    setState({ type: "loading", text: "正在创建账号..." });
    const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, name: data.get("name"), username: data.get("username"), password: data.get("password"), className: data.get("className") || undefined, grade: data.get("grade") || undefined, inviteCode: data.get("inviteCode") || undefined, studentUsername: data.get("studentUsername") || undefined, relation: data.get("relation") || undefined }) });
    const payload = await response.json(); if (!response.ok) return setState({ type: "error", text: payload.error ?? "注册失败" });
    setResult(payload); setState({ type: "success", text: "账号创建成功" });
  }
  if (result) return <div className="login-box text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-emerald-50 text-emerald-700"><CheckCircle2 size={30} /></span><h2 className="mt-5">注册成功</h2><p className="mt-3 text-sm text-zinc-600">账号：<strong>{result.username}</strong></p>{result.inviteCode && <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4"><span className="text-xs text-emerald-800">班级邀请码</span><strong className="mt-1 block text-xl tracking-widest">{result.inviteCode}</strong><p className="mt-2 text-xs text-zinc-600">请将邀请码提供给本班学生注册使用。</p></div>}<Link className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-emerald-700 px-6 font-bold text-white" href="/login">返回登录</Link></div>;
  return <div className="login-box"><Link className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-zinc-600" href="/login"><ArrowLeft size={17} />返回登录</Link><h2>创建乡课伴账号</h2><p className="login-subtitle">选择身份并完成基本信息</p><div className="mt-5 grid grid-cols-3 gap-2" role="group" aria-label="注册身份">{roles.map(({ role: value, label, icon: Icon }) => <button type="button" key={value} className={`role-select ${role === value ? "selected" : ""}`} aria-pressed={role === value} onClick={() => { setRole(value); setState({ type: "idle" }); }}><Icon size={19} />{label}</button>)}</div><form className="form-grid mt-5" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><div className="field"><label htmlFor="register-name">真实姓名</label><input id="register-name" className="input" name="name" required minLength={2} /></div><div className="field"><label htmlFor="register-username">登录账号</label><input id="register-username" className="input" name="username" required minLength={3} pattern="[a-zA-Z0-9_]+" /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="field"><label htmlFor="register-password">密码</label><input id="register-password" className="input" name="password" type="password" required minLength={8} /></div><div className="field"><label htmlFor="register-confirm">确认密码</label><input id="register-confirm" className="input" name="confirmPassword" type="password" required minLength={8} /></div></div>{role === "teacher" && <div className="grid gap-4 sm:grid-cols-2"><div className="field"><label>班级名称</label><input className="input" name="className" placeholder="如：五年级二班" required /></div><div className="field"><label>年级</label><select className="select" name="grade" defaultValue="五年级"><option>一年级</option><option>二年级</option><option>三年级</option><option>四年级</option><option>五年级</option><option>六年级</option><option>七年级</option><option>八年级</option><option>九年级</option></select></div></div>}{role === "student" && <div className="field"><label>班级邀请码</label><input className="input uppercase" name="inviteCode" placeholder="向老师获取" required /></div>}{role === "parent" && <div className="grid gap-4 sm:grid-cols-2"><div className="field"><label>孩子的学生账号</label><input className="input" name="studentUsername" required /></div><div className="field"><label>与孩子的关系</label><select className="select" name="relation"><option>母亲</option><option>父亲</option><option>祖父母</option><option>其他监护人</option></select></div></div>}<label className="flex items-start gap-2 text-xs leading-6 text-zinc-600"><input className="mt-1" type="checkbox" required />我已阅读并同意平台的数据使用与未成年人保护说明</label><FormStatus state={state} /><Button type="submit" size="lg" disabled={state.type === "loading"}>注册</Button></form></div>;
}
