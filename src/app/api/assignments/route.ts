import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { assignmentItems, assignments, classMembers, files, notifications } from "@/db/schema";
import { jsonError, recordAudit } from "@/lib/api";
import { getApiSession, getClassContext } from "@/lib/dal";
import { db, dbReady } from "@/lib/db";
import { nowIso } from "@/lib/utils";
import { getStorageProvider, isStorageConfigurationError, validateUpload } from "@/lib/storage";

export const runtime = "nodejs";

const assignmentSchema = z.object({
  title: z.string().min(2).max(80), subject: z.string().min(1).max(20), description: z.string().min(4).max(1000), dueAt: z.string().datetime(),
  items: z.array(z.object({ prompt: z.string().min(2), type: z.enum(["single", "short"]), options: z.array(z.string()).default([]), answer: z.string().min(1), points: z.number().int().min(1).max(100) })).min(1).max(20),
});

export async function POST(request: Request) {
  const session = await getApiSession("teacher");
  if (!session) return jsonError("无权执行此操作", 403);
  const classroom = await getClassContext(session.user.id, "teacher");
  if (!classroom) return jsonError("未找到班级", 404);
  let raw: unknown;
  let attachment: File | null = null;
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await request.formData();
    try { raw = JSON.parse(String(form.get("payload") ?? "{}")); } catch { return jsonError("作业内容格式不正确"); }
    const upload = form.get("file");
    attachment = upload instanceof File && upload.size > 0 ? upload : null;
  } else raw = await request.json();
  const parsed = assignmentSchema.safeParse(raw);
  if (!parsed.success) return jsonError("请检查作业内容与截止时间");
  if (attachment) {
    const issue = validateUpload(attachment, "material");
    if (issue) return jsonError(issue);
  }
  await dbReady;
  const id = randomUUID();
  const now = nowIso();
  let fileId: string | null = null;
  if (attachment) {
    fileId = randomUUID();
    const extension = path.extname(attachment.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin";
    const storageKey = `${session.user.schoolId}/${classroom.id}/assignments/${fileId}${extension}`;
    try {
      await getStorageProvider().put(storageKey, Buffer.from(await attachment.arrayBuffer()), attachment.type);
    } catch (error) {
      if (isStorageConfigurationError(error)) return jsonError("文件存储服务暂不可用", 503);
      throw error;
    }
    await db.insert(files).values({ id: fileId, schoolId: session.user.schoolId, classId: classroom.id, ownerId: session.user.id, name: attachment.name, mimeType: attachment.type, size: attachment.size, storageKey, createdAt: now });
  }
  const students = await db.select().from(classMembers).where(eq(classMembers.classId, classroom.id));
  await db.transaction(async (tx) => {
    await tx.insert(assignments).values({ id, classId: classroom.id, teacherId: session.user.id, fileId, title: parsed.data.title, subject: parsed.data.subject, description: parsed.data.description, dueAt: parsed.data.dueAt, status: "published", createdAt: now });
    await tx.insert(assignmentItems).values(parsed.data.items.map((item, orderNo) => ({ id: randomUUID(), assignmentId: id, prompt: item.prompt, type: item.type, optionsJson: JSON.stringify(item.options), answer: item.answer, points: item.points, orderNo })));
    const studentIds = students.filter((item) => item.memberRole === "student").map((item) => item.userId);
    if (studentIds.length) await tx.insert(notifications).values(studentIds.map((userId) => ({ id: randomUUID(), userId, title: "有新作业", body: parsed.data.title, type: "assignment", href: "/student/assignments", readAt: null, createdAt: now })));
  });
  await recordAudit(session.user.id, "assignment.published", "assignment", id, { itemCount: parsed.data.items.length, fileId });
  revalidatePath("/teacher/assignments");
  revalidatePath("/student/assignments");
  return NextResponse.json({ id }, { status: 201 });
}
