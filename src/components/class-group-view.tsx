"use client";

import {
  Bell,
  BellOff,
  BookOpen,
  CircleHelp,
  Download,
  FileText,
  Hash,
  ImagePlus,
  Megaphone,
  MessageCircle,
  Paperclip,
  Send,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatChineseDate } from "@/lib/utils";

type FeedItem = { id: string; type: string; title: string; content: string; createdAt: string };
type GroupMessage = {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
  senderId: string;
  receiverId?: string | null;
  channel: string;
  attachmentId?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
};
type GroupMember = { id: string; name: string; role: "teacher" | "student" };

const channels = [
  { id: "all", label: "全部消息", icon: Hash },
  { id: "announcement", label: "班级公告", icon: Megaphone },
  { id: "resource", label: "学习资料", icon: BookOpen },
  { id: "question", label: "答疑汇总", icon: CircleHelp },
] as const;

export function ClassGroupView({ posts, initialMessages, initialPrivateMessages, members, currentUserId, role }: {
  posts: FeedItem[];
  initialMessages: GroupMessage[];
  initialPrivateMessages: GroupMessage[];
  members: GroupMember[];
  currentUserId: string;
  role: "teacher" | "student";
}) {
  const privateCandidates = useMemo(() => members.filter((member) => member.id !== currentUserId), [currentUserId, members]);
  const preferredPrivateMember = privateCandidates.find((member) => member.role === "teacher") ?? privateCandidates[0];
  const [channel, setChannel] = useState<(typeof channels)[number]["id"]>("all");
  const [mode, setMode] = useState<"group" | "private">("group");
  const [membersOpen, setMembersOpen] = useState(false);
  const [directMemberId, setDirectMemberId] = useState(preferredPrivateMember?.id ?? "");
  const [messages, setMessages] = useState([...initialMessages, ...initialPrivateMessages]);
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const directMember = members.find((member) => member.id === directMemberId) ?? preferredPrivateMember;
  const filteredPosts = channel === "all" ? posts : posts.filter((post) => post.type === channel);
  const groupMessages = messages.filter((message) => message.channel === "class");
  const allPrivateMessages = messages.filter((message) => message.channel === "student_teacher");
  const privateMessages = directMember ? allPrivateMessages.filter((message) =>
    (message.senderId === currentUserId && message.receiverId === directMember.id)
    || (message.senderId === directMember.id && message.receiverId === currentUserId),
  ) : [];

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const response = await fetch("/api/messages");
      if (!response.ok) return;
      const payload = await response.json() as { messages: GroupMessage[] };
      setMessages(payload.messages.filter((message) => message.channel === "class" || message.channel === "student_teacher"));
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  function openPrivate(member: GroupMember) {
    if (member.id === currentUserId) return;
    setDirectMemberId(member.id);
    setMode("private");
    setStatus("");
  }

  function selectAttachment(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) return;
    setAttachment(selected);
    setStatus("");
  }

  function clearAttachment() {
    setAttachment(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const value = content.trim();
    if ((!value && !attachment) || (mode === "private" && !directMember)) return;
    setSending(true);
    setStatus(attachment ? "正在上传附件..." : "");
    const receiverId = mode === "private" ? directMember?.id : null;
    const fallbackContent = attachment?.type.startsWith("image/") ? "发送了一张图片" : `发送了文件：${attachment?.name ?? "附件"}`;
    const form = new FormData();
    form.set("content", value || fallbackContent);
    form.set("channel", mode === "private" ? "student_teacher" : "class");
    if (receiverId) form.set("receiverId", receiverId);
    if (attachment) form.set("file", attachment);
    const response = await fetch("/api/messages", { method: "POST", body: form });
    const result = await response.json() as { error?: string; message?: GroupMessage };
    setSending(false);
    if (!response.ok || !result.message) {
      setStatus(result.error ?? "发送失败，请稍后重试");
      return;
    }
    setMessages((current) => [...current.filter((item) => item.id !== result.message?.id), result.message!]);
    setContent("");
    clearAttachment();
    setStatus("");
  }

  function channelCount(channelId: (typeof channels)[number]["id"]) {
    if (channelId === "all") return posts.length + groupMessages.length;
    return posts.filter((post) => post.type === channelId).length;
  }

  const selectedChannel = channels.find((item) => item.id === channel) ?? channels[0];
  const showPinnedNotice = mode === "group" && (channel === "all" || channel === "announcement");
  const showGroupMessages = mode === "group" && channel === "all";

  return <div className="group-workspace">
    <aside className="group-channels">
      <div className="group-title"><span className="avatar">五一</span><span><strong>五年级一班</strong><small><Users size={12} /> {members.length} 名成员</small></span></div>
      <nav aria-label="班级群频道">
        <span className="group-nav-label">班级内容</span>
        {channels.map((item) => <button type="button" key={item.id} className={mode === "group" && channel === item.id ? "active" : ""} onClick={() => { setMode("group"); setChannel(item.id); setStatus(""); }}><item.icon size={17} /><span>{item.label}</span><small>{channelCount(item.id)}</small></button>)}
        <span className="group-nav-label group-nav-private">私聊</span>
        <button type="button" className={mode === "private" ? "active" : ""} disabled={!privateCandidates.length} onClick={() => { if (preferredPrivateMember) { setDirectMemberId(directMember?.id ?? preferredPrivateMember.id); setMode("private"); setStatus(""); } }}><MessageCircle size={17} /><span>{role === "teacher" ? "私聊学生" : "私聊消息"}</span><small>{allPrivateMessages.length}</small></button>
      </nav>
      {membersOpen && <div className="group-members-panel">
        <div className="group-members-head"><strong>群成员</strong><button type="button" onClick={() => setMembersOpen(false)} aria-label="关闭成员列表" title="关闭"><X size={16} /></button></div>
        <div className="group-members-scroll">
          {members.map((member) => member.id === currentUserId
            ? <MemberRow key={member.id} member={member} current />
            : <MemberRow key={member.id} member={member} onOpen={() => openPrivate(member)} />)}
        </div>
      </div>}
    </aside>
    <section className="group-feed">
      <header><div><h2>{mode === "private" ? `与${directMember?.name ?? "成员"}私聊` : selectedChannel.label}</h2><p>{mode === "private" ? "仅双方可见，消息每 10 秒自动同步" : "班级教学动态与公开协作空间"}</p></div><div className="group-header-actions"><button type="button" className="group-members-button" onClick={() => setMembersOpen((open) => !open)}><Users size={15} />群成员 <span>{members.length}</span></button>{mode === "group" && <button type="button" className={`group-mute-button ${muted ? "active" : ""}`} onClick={() => setMuted((value) => !value)} title={muted ? "恢复消息提醒" : "开启消息免打扰"}>{muted ? <BellOff size={15} /> : <Bell size={15} />}{muted ? "已免打扰" : "消息提醒"}</button>}</div></header>
      <div className="group-scroll">
        {mode === "group" ? <>
          {showPinnedNotice && <div className="group-pin"><Bell size={17} /><span><strong>置顶公告</strong> 周五科学课请带一片完整叶子。</span></div>}
          {filteredPosts.map((post) => <article className="group-post" key={post.id}><div className="avatar">李</div><div><div className="flex flex-wrap items-center gap-2"><strong>李晓云</strong><Badge tone={post.type === "announcement" ? "amber" : post.type === "question" ? "blue" : "green"}>{post.type === "announcement" ? "公告" : post.type === "question" ? "公开答疑" : "学习资源"}</Badge><span className="row-meta">{formatChineseDate(post.createdAt, true)}</span></div><h3>{post.title}</h3><p>{post.content}</p></div></article>)}
          {showGroupMessages && groupMessages.map((message) => <MessageItem key={message.id} message={message} mine={message.senderId === currentUserId} />)}
          {!showPinnedNotice && !filteredPosts.length && <div className="empty-state min-h-72"><selectedChannel.icon size={30} className="text-zinc-400" /><h3>这里暂时没有内容</h3><p>教师发布后会自动同步到当前频道。</p></div>}
        </> : privateMessages.length ? privateMessages.map((message) => <MessageItem key={message.id} message={message} mine={message.senderId === currentUserId} privateMode />) : <div className="empty-state min-h-72"><MessageCircle size={30} className="text-zinc-400" /><h3>还没有私聊消息</h3><p>发送第一条消息后，会在双方账号中同步显示。</p></div>}
      </div>
      <form className="group-composer" onSubmit={send}>
        <div className="group-composer-row">
          <label className="group-attach-button" title="发送照片"><ImagePlus size={18} /><span>照片</span><input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={selectAttachment} /></label>
          <label className="group-attach-button" title="发送文件"><Paperclip size={18} /><span>文件</span><input ref={fileInputRef} type="file" accept=".pdf,.docx,.pptx,.xlsx,.txt,image/png,image/jpeg,image/webp" onChange={selectAttachment} /></label>
          <input className="group-message-input" value={content} onChange={(event) => setContent(event.target.value)} placeholder={mode === "private" ? `给${directMember?.name ?? "成员"}发私聊消息` : "发消息到班级群"} aria-label="消息内容" />
          <Button type="submit" size="icon" disabled={sending || (!content.trim() && !attachment) || (mode === "private" && !directMember)} title={mode === "private" ? "发送私聊" : "发送群消息"} aria-label={mode === "private" ? "发送私聊" : "发送群消息"}><Send size={18} /></Button>
        </div>
        {attachment && <div className="group-selected-file"><span>{attachment.type.startsWith("image/") ? <ImagePlus size={15} /> : <FileText size={15} />}{attachment.name}<small>{formatFileSize(attachment.size)}</small></span><button type="button" onClick={clearAttachment} aria-label="移除已选附件" title="移除附件"><X size={15} /></button></div>}
        {status && <span className="group-send-status" role="status">{status}</span>}
      </form>
    </section>
  </div>;
}

function MemberRow({ member, current = false, onOpen }: { member: GroupMember; current?: boolean; onOpen?: () => void }) {
  const body = <><span className="avatar">{member.name.slice(-2)}</span><span><strong>{member.name}{current ? "（我）" : ""}</strong><small>{member.role === "teacher" ? "教师" : "学生"}</small></span>{!current && <MessageCircle size={16} />}</>;
  return onOpen ? <button type="button" className="group-member-row" onClick={onOpen} aria-label={`与${member.name}私聊`} title={`与${member.name}私聊`}>{body}</button> : <div className="group-member-row current">{body}</div>;
}

function MessageItem({ message, mine, privateMode = false }: { message: GroupMessage; mine: boolean; privateMode?: boolean }) {
  return <article className={`group-post ${mine ? "mine" : ""} ${privateMode ? "private" : ""}`}><div className="avatar">{message.senderName.slice(0, 1)}</div><div><div className="flex flex-wrap items-center gap-2"><strong>{message.senderName}</strong>{privateMode && <Badge tone="blue">私聊</Badge>}<span className="row-meta">{formatChineseDate(message.createdAt, true)}</span></div><p>{message.content}</p>{message.attachmentId && <MessageAttachment message={message} />}</div></article>;
}

function MessageAttachment({ message }: { message: GroupMessage }) {
  const href = `/api/files/${message.attachmentId}`;
  const name = message.attachmentName ?? "消息附件";
  if (message.attachmentMimeType?.startsWith("image/")) return <a className="group-image-attachment" href={href} target="_blank" rel="noreferrer"><Image src={href} width={360} height={220} sizes="(max-width: 719px) 72vw, 360px" alt={name} unoptimized /><span>{name} · 点击查看原图</span></a>;
  return <a className="group-file-attachment" href={href} download><FileText size={19} /><span><strong>{name}</strong><small>{formatFileSize(message.attachmentSize ?? 0)}</small></span><Download size={17} /></a>;
}

function formatFileSize(bytes: number) {
  if (!bytes) return "附件";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
