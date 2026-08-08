import { randomUUID } from "node:crypto";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { files, posts, videos } from "@/db/schema";
import { jsonError, recordAudit } from "@/lib/api";
import { getApiSession, getClassContext } from "@/lib/dal";
import { db, dbReady } from "@/lib/db";
import { getStorageProvider, isStorageConfigurationError, validateUpload } from "@/lib/storage";
import { nowIso } from "@/lib/utils";

export const runtime = "nodejs";

const videoSchema = z.object({ title: z.string().min(2).max(80), description: z.string().min(2).max(800), knowledgePoint: z.string().min(1).max(80), durationSeconds: z.coerce.number().int().min(0).max(600) });

export async function POST(request: Request) {
  const session = await getApiSession("teacher");
  if (!session) return jsonError("无权执行此操作", 403);
  const classroom = await getClassContext(session.user.id, "teacher");
  if (!classroom) return jsonError("未找到班级", 404);
  const form = await request.formData();
  const parsed = videoSchema.safeParse({ title: form.get("title"), description: form.get("description"), knowledgePoint: form.get("knowledgePoint"), durationSeconds: form.get("durationSeconds") ?? 0 });
  if (!parsed.success) return jsonError("请完善微课信息，录制最长10分钟");
  const upload = form.get("file");
  if (!(upload instanceof File)) return jsonError("请选择或录制视频");
  const issue = validateUpload(upload, "video");
  if (issue) return jsonError(issue);
  await dbReady;
  const now = nowIso();
  const fileId = randomUUID();
  const videoId = randomUUID();
  const extension = path.extname(upload.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || (upload.type.includes("mp4") ? ".mp4" : ".webm");
  const storageKey = `${session.user.schoolId}/${classroom.id}/videos/${fileId}${extension}`;
  try {
    await getStorageProvider().put(storageKey, Buffer.from(await upload.arrayBuffer()), upload.type);
  } catch (error) {
    if (isStorageConfigurationError(error)) return jsonError("文件存储服务暂不可用", 503);
    throw error;
  }
  await db.transaction(async (tx) => {
    await tx.insert(files).values({ id: fileId, schoolId: session.user.schoolId, classId: classroom.id, ownerId: session.user.id, name: upload.name, mimeType: upload.type, size: upload.size, storageKey, createdAt: now });
    await tx.insert(videos).values({ id: videoId, classId: classroom.id, teacherId: session.user.id, fileId, title: parsed.data.title, description: parsed.data.description, knowledgePoint: parsed.data.knowledgePoint, durationSeconds: parsed.data.durationSeconds, status: "ready", createdAt: now });
    await tx.insert(posts).values({ id: randomUUID(), classId: classroom.id, authorId: session.user.id, videoId, type: "resource", title: parsed.data.title, content: parsed.data.description, visibility: "class", createdAt: now });
  });
  await recordAudit(session.user.id, "video.published", "video", videoId, { fileId, size: upload.size });
  revalidatePath("/teacher/videos");
  revalidatePath("/student");
  revalidatePath("/student/learn");
  return NextResponse.json({ id: videoId }, { status: 201 });
}
