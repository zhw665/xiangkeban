import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { files, materialChunks, materials, notifications, questions } from "@/db/schema";
import { getAIProvider } from "@/lib/ai";
import { claimOfflineRequest, jsonError, recordAudit } from "@/lib/api";
import { getApiSession, getClassContext } from "@/lib/dal";
import { db, dbReady } from "@/lib/db";
import { getStorageProvider, validateUpload } from "@/lib/storage";
import { nowIso } from "@/lib/utils";

export const runtime = "nodejs";

const questionSchema = z.object({ content: z.string().min(4).max(1200), subject: z.string().min(1).max(20) });

export async function POST(request: Request) {
  const session = await getApiSession("student");
  if (!session) return jsonError("无权执行此操作", 403);
  if (!(await claimOfflineRequest(request, session.user.id))) return jsonError("该离线请求已经同步", 409);
  const classroom = await getClassContext(session.user.id, "student");
  if (!classroom) return jsonError("未找到班级", 404);

  let raw: { content: unknown; subject: unknown };
  let attachment: File | null = null;
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await request.formData();
    raw = { content: form.get("content"), subject: form.get("subject") };
    const upload = form.get("file");
    attachment = upload instanceof File && upload.size > 0 ? upload : null;
  } else raw = await request.json();
  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) return jsonError("问题至少需要4个字");
  if (attachment) {
    const issue = validateUpload(attachment, "image");
    if (issue) return jsonError(issue);
  }

  await dbReady;
  const contextRows = await db.select({ content: materialChunks.content }).from(materialChunks).innerJoin(materials, eq(materialChunks.materialId, materials.id)).where(eq(materials.classId, classroom.id));
  const analysis = await getAIProvider().classifyQuestion({ ...parsed.data, grade: classroom.grade, context: contextRows.slice(0, 3).map((item) => item.content) });
  const now = nowIso();
  let attachmentId: string | null = null;
  if (attachment) {
    attachmentId = randomUUID();
    const extension = path.extname(attachment.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".jpg";
    const storageKey = `${session.user.schoolId}/${classroom.id}/questions/${attachmentId}${extension}`;
    await getStorageProvider().put(storageKey, Buffer.from(await attachment.arrayBuffer()), attachment.type);
    await db.insert(files).values({ id: attachmentId, schoolId: session.user.schoolId, classId: classroom.id, ownerId: session.user.id, name: attachment.name, mimeType: attachment.type, size: attachment.size, storageKey, createdAt: now });
  }
  const questionId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(questions).values({ id: questionId, classId: classroom.id, studentId: session.user.id, attachmentId, subject: parsed.data.subject, content: parsed.data.content, aiCategory: analysis.category, knowledgePoint: analysis.knowledgePoint, urgency: analysis.urgency, aiHint: analysis.hint, aiDraft: analysis.draftAnswer, status: "pending", isPublic: false, createdAt: now });
    await tx.insert(notifications).values({ id: randomUUID(), userId: classroom.teacherId, title: analysis.urgency === "attention" ? "有一条求助需要关注" : "有新问题待处理", body: parsed.data.content.slice(0, 60), type: "question", href: "/teacher/questions", readAt: null, createdAt: now });
  });
  await recordAudit(session.user.id, "question.created", "question", questionId, { category: analysis.category, urgency: analysis.urgency });
  revalidatePath("/student/questions");
  revalidatePath("/teacher/questions");
  return NextResponse.json({ id: questionId, hint: analysis.hint, queued: false }, { status: 201 });
}
