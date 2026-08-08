"use client";

import { Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { queuedJsonRequest } from "@/lib/offline-queue";
import { formatChineseDate } from "@/lib/utils";

type Message = { id: string; content: string; createdAt: string; senderId: string; senderName: string };
export function MessageBoard({ initialMessages, currentUserId, channel, receiverId }: { initialMessages: Message[]; currentUserId: string; channel: "class" | "student_teacher" | "parent_teacher"; receiverId?: string | null }) {
  const [messages, setMessages] = useState(initialMessages); const [content, setContent] = useState(""); const [status, setStatus] = useState("");
  useEffect(() => { const timer = window.setInterval(async () => { const response = await fetch("/api/messages"); if (response.ok) setMessages((await response.json()).messages); }, 10000); return () => clearInterval(timer); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); if (!content.trim()) return; const optimistic = { id: `local-${Date.now()}`, content, createdAt: new Date().toISOString(), senderId: currentUserId, senderName: "我" }; setMessages([...messages, optimistic]); setContent(""); const { response, queued } = await queuedJsonRequest("/api/messages", { content: optimistic.content, channel, receiverId }); if (queued) return setStatus("已离线保存，联网后自动发送"); if (!response!.ok) setStatus("发送失败，请稍后重试"); else { setStatus(""); const fresh = await fetch("/api/messages"); if (fresh.ok) setMessages((await fresh.json()).messages); } }
  return <div className="panel overflow-hidden"><div className="message-list max-h-[54vh] min-h-80 overflow-y-auto bg-zinc-50 p-4">{messages.length ? messages.map((message) => <div key={message.id} className={`mb-3 flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-md px-3 py-2 ${message.senderId === currentUserId ? "bg-emerald-700 text-white" : "border border-zinc-200 bg-white"}`}><div className="mb-1 text-xs opacity-70">{message.senderName} · {formatChineseDate(message.createdAt, true)}</div><p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p></div></div>) : <div className="empty-state"><p>还没有消息，写下第一条留言吧。</p></div>}</div><form className="border-t border-zinc-200 p-3" onSubmit={submit}><div className="flex gap-2"><textarea className="textarea min-h-16 flex-1" value={content} onChange={(e) => setContent(e.target.value)} placeholder="输入留言，双方可在方便时回复" /><Button type="submit" size="icon" title="发送"><Send size={18} /></Button></div>{status && <p className="mt-2 text-xs text-amber-700">{status}</p>}</form></div>;
}
