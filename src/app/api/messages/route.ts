import { and, eq, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { classMembers, files, guardianLinks, messages, notifications, users } from "@/db/schema";
import { claimOfflineRequest, jsonError, recordAudit } from "@/lib/api";
import { getApiSession, getClassContext } from "@/lib/dal";
import { db, dbReady } from "@/lib/db";
import { getStorageProvider, validateUpload } from "@/lib/storage";
import { nowIso } from "@/lib/utils";
import { canUseMessageChannel } from "@/lib/permissions";

export const runtime = "nodejs";

const messageSchema = z.object({ content: z.string().min(1).max(1200), receiverId: z.string().nullable().optional(), channel: z.enum(["class", "student_teacher", "parent_teacher"]) });

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session) return jsonError("请先登录", 401);
  if (!(await claimOfflineRequest(request, session.user.id))) return jsonError("该离线请求已经同步", 409);
  const classroom = await getClassContext(session.user.id, session.user.role);
  if (!classroom) return jsonError("未找到班级", 404);
  let raw: { content: unknown; receiverId?: unknown; channel: unknown };
  let attachment: File | null = null;
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await request.formData();
    raw = { content: form.get("content") || "附件消息", receiverId: form.get("receiverId"), channel: form.get("channel") };
    const upload = form.get("file");
    attachment = upload instanceof File && upload.size > 0 ? upload : null;
  } else raw = await request.json();
  const parsed = messageSchema.safeParse(raw);
  if (!parsed.success) return jsonError("消息内容不完整");
  const { channel } = parsed.data;
  if (!canUseMessageChannel(session.user.role, channel)) return jsonError("当前账号不能使用该沟通渠道", 403);
  const receiverId = channel === "class"
    ? null
    : session.user.role === "teacher"
      ? parsed.data.receiverId ?? null
      : channel === "student_teacher"
        ? parsed.data.receiverId ?? classroom.teacherId
        : classroom.teacherId;
  if (channel !== "class" && !receiverId) return jsonError("请选择联系人");
  await dbReady;
  if (receiverId) {
    const receiver = await db.select().from(users).where(and(eq(users.id, receiverId), eq(users.schoolId, session.user.schoolId))).get();
    if (!receiver) return jsonError("联系人不存在", 404);
    if (channel === "student_teacher") {
      const member = receiver.id === classroom.teacherId ? { userId: receiver.id } : await db.select({ userId: classMembers.userId }).from(classMembers).where(and(eq(classMembers.classId, classroom.id), eq(classMembers.userId, receiver.id))).get();
      if (!member || (receiver.role !== "teacher" && receiver.role !== "student")) return jsonError("只能私聊本班教师或同学", 403);
    }
    if (channel === "parent_teacher") {
      const linkedGuardian = receiver.role === "parent" ? await db.select({ guardianId: guardianLinks.guardianId }).from(guardianLinks).innerJoin(classMembers, eq(guardianLinks.studentId, classMembers.userId)).where(and(eq(guardianLinks.guardianId, receiver.id), eq(classMembers.classId, classroom.id))).get() : null;
      if (receiver.id !== classroom.teacherId && !linkedGuardian) return jsonError("只能联系本班教师或已关联家长", 403);
    }
  }
  const now = nowIso();
  let attachmentId: string | null = null;
  if (attachment) {
    const issue = validateUpload(attachment, "message");
    if (issue) return jsonError(issue);
    attachmentId = randomUUID();
    const extension = path.extname(attachment.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin";
    const storageKey = `${session.user.schoolId}/${classroom.id}/messages/${attachmentId}${extension}`;
    await getStorageProvider().put(storageKey, Buffer.from(await attachment.arrayBuffer()), attachment.type);
    await db.insert(files).values({ id: attachmentId, schoolId: session.user.schoolId, classId: classroom.id, ownerId: session.user.id, name: attachment.name, mimeType: attachment.type, size: attachment.size, storageKey, createdAt: now }).run();
  }
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(messages).values({ id, classId: classroom.id, senderId: session.user.id, receiverId: channel === "class" ? null : receiverId, attachmentId, channel, content: parsed.data.content, readAt: null, createdAt: now }).run();
    if (receiverId) await tx.insert(notifications).values({ id: randomUUID(), userId: receiverId, title: "收到一条新消息", body: parsed.data.content.slice(0, 60), type: "message", href: `/${(await tx.select({ role: users.role }).from(users).where(eq(users.id, receiverId)).get())?.role}/messages`, readAt: null, createdAt: now }).run();
  });
  await recordAudit(session.user.id, "message.sent", "message", id, { channel, attachmentId });
  revalidatePath("/teacher/messages");
  revalidatePath("/student/messages");
  revalidatePath("/parent/messages");
  return NextResponse.json({ message: { id, content: parsed.data.content, channel, createdAt: now, senderId: session.user.id, receiverId, senderName: session.user.name ?? "乡课伴用户", attachmentId, attachmentName: attachment?.name ?? null, attachmentMimeType: attachment?.type ?? null, attachmentSize: attachment?.size ?? null } }, { status: 201 });
}

export async function GET() {
  const session = await getApiSession();
  if (!session) return jsonError("请先登录", 401);
  const classroom = await getClassContext(session.user.id, session.user.role);
  if (!classroom) return jsonError("未找到班级", 404);
  await dbReady;
  const rows = await db.select({ id: messages.id, content: messages.content, channel: messages.channel, createdAt: messages.createdAt, senderId: messages.senderId, receiverId: messages.receiverId, attachmentId: messages.attachmentId, attachmentName: files.name, attachmentMimeType: files.mimeType, attachmentSize: files.size, senderName: users.name })
    .from(messages).innerJoin(users, eq(messages.senderId, users.id)).leftJoin(files, eq(messages.attachmentId, files.id))
    .where(and(eq(messages.classId, classroom.id), session.user.role === "teacher" ? or(eq(messages.receiverId, session.user.id), eq(messages.senderId, session.user.id), eq(messages.channel, "class")) : or(eq(messages.receiverId, session.user.id), eq(messages.senderId, session.user.id), eq(messages.channel, "class")))).all();
  return NextResponse.json({ messages: rows });
}
