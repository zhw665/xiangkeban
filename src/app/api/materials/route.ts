import { randomUUID } from "node:crypto";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { files, materialChunks, materials } from "@/db/schema";
import { getAIProvider, lessonPlanToText } from "@/lib/ai";
import { jsonError, recordAudit } from "@/lib/api";
import { getApiSession, getClassContext } from "@/lib/dal";
import { db, dbReady } from "@/lib/db";
import { chunkText, extractFileText } from "@/lib/file-text";
import { getStorageProvider, validateUpload } from "@/lib/storage";
import { nowIso } from "@/lib/utils";

export const runtime = "nodejs";

const fieldsSchema = z.object({ title: z.string().min(2).max(80), subject: z.string().min(1).max(20), notes: z.string().max(2000).default("") });

export async function POST(request: Request) {
  const session = await getApiSession("teacher");
  if (!session) return jsonError("无权执行此操作", 403);
  const classroom = await getClassContext(session.user.id, "teacher");
  if (!classroom) return jsonError("未找到班级", 404);
  const form = await request.formData();
  const parsed = fieldsSchema.safeParse({ title: form.get("title"), subject: form.get("subject"), notes: form.get("notes") ?? "" });
  if (!parsed.success) return jsonError("请填写完整的课件信息");
  const upload = form.get("file");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  if (file) {
    const issue = validateUpload(file, "material");
    if (issue) return jsonError(issue);
  }

  await dbReady;
  const now = nowIso();
  let fileId: string | null = null;
  let extracted = "";
  if (file) {
    fileId = randomUUID();
    const extension = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin";
    const storageKey = `${session.user.schoolId}/${classroom.id}/materials/${fileId}${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await getStorageProvider().put(storageKey, buffer, file.type);
    await db.insert(files).values({ id: fileId, schoolId: session.user.schoolId, classId: classroom.id, ownerId: session.user.id, name: file.name, mimeType: file.type, size: file.size, storageKey, createdAt: now });
    extracted = await extractFileText(file);
  }

  const analysis = await getAIProvider().analyzeMaterial({ ...parsed.data, grade: classroom.grade, text: extracted });
  const materialId = randomUUID();
  const sourceText = extracted || `${parsed.data.title}。${parsed.data.notes}。${analysis.summary}`;
  const chunks = chunkText(sourceText);
  await db.transaction(async (tx) => {
    await tx.insert(materials).values({ id: materialId, classId: classroom.id, teacherId: session.user.id, fileId, title: parsed.data.title, subject: parsed.data.subject, notes: parsed.data.notes, summary: analysis.summary, lessonPlan: lessonPlanToText(analysis), status: "ready", createdAt: now });
    if (chunks.length) await tx.insert(materialChunks).values(chunks.map((content, chunkIndex) => ({ id: randomUUID(), materialId, chunkIndex, content })));
  });
  await recordAudit(session.user.id, "material.created", "material", materialId, { fileId, chunkCount: chunks.length });
  revalidatePath("/teacher/materials");
  revalidatePath("/student/learn");
  return NextResponse.json({ id: materialId, analysis }, { status: 201 });
}
