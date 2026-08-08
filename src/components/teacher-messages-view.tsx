"use client";

import { Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import { MessageBoard } from "@/components/message-board";
import { Badge } from "@/components/ui/badge";

type Contact = { id: string; name: string; studentName: string; relation: string };
type Message = { id: string; content: string; createdAt: string; senderId: string; senderName: string };
const demoContacts: Contact[] = [{ id: "demo-parent-li", name: "李建国", studentName: "李明远", relation: "父亲" }, { id: "demo-parent-wang", name: "王秀兰", studentName: "王雨欣", relation: "祖母" }];

export function TeacherMessagesView({ contacts, messages, currentUserId }: { contacts: Contact[]; messages: Message[]; currentUserId: string }) {
  const allContacts = useMemo(() => [...contacts, ...demoContacts], [contacts]); const [selectedId, setSelectedId] = useState(allContacts[0]?.id ?? ""); const [query, setQuery] = useState(""); const selected = allContacts.find((item) => item.id === selectedId); const visible = allContacts.filter((item) => `${item.name}${item.studentName}`.includes(query)); const isDemo = selectedId.startsWith("demo-");
  return <div className="contact-workspace"><aside className="contact-list"><div className="contact-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索家长或学生" /></div><div className="contact-scroll">{visible.map((contact) => <button key={contact.id} className={selectedId === contact.id ? "active" : ""} onClick={() => setSelectedId(contact.id)}><span className="avatar">{contact.name.slice(-2)}</span><span><strong>{contact.studentName}家长</strong><small>{contact.name} · {contact.relation}</small></span>{contact.id.startsWith("demo-") && <Badge>演示</Badge>}</button>)}</div></aside><section className="contact-chat"><header><div><h2>{selected?.studentName ?? "学生"}家长</h2><p>{selected?.name} · {selected?.relation} · 最近每 10 秒同步</p></div><UserRound size={20} /></header>{isDemo ? <><div className="demo-chat"><div className="chat-bubble">老师您好，我想了解孩子最近的作业情况。</div><div className="chat-bubble mine">本周任务基本按时完成，我会继续关注订正情况。</div></div><div className="demo-chat-note">演示联系人暂不支持发送消息</div></> : selected ? <MessageBoard initialMessages={messages} currentUserId={currentUserId} channel="parent_teacher" receiverId={selected.id} /> : <div className="empty-state"><p>暂无已绑定家长</p></div>}</section></div>;
}
