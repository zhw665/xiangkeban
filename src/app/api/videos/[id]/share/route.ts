import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { videoShares, videos } from "@/db/schema";
import { jsonError, recordAudit } from "@/lib/api";
import { getApiSession, getClassContext } from "@/lib/dal";
import { db, dbReady } from "@/lib/db";
import { firstOrNull } from "@/lib/db-helpers";
import { nowIso } from "@/lib/utils";

const shareSchema = z.object({ targetClassName: z.enum(["四年级二班", "六年级一班"]) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getApiSession("teacher");
  if (!session) return jsonError("无权执行此操作", 403);
  const classroom = await getClassContext(session.user.id, "teacher");
  if (!classroom) return jsonError("未找到班级", 404);
  const parsed = shareSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("请选择目标班级");
  const { id } = await context.params;
  await dbReady;
  const video = firstOrNull(await db.select().from(videos).where(and(eq(videos.id, id), eq(videos.classId, classroom.id))));
  if (!video) return jsonError("微课不存在", 404);
  const existing = firstOrNull(await db.select().from(videoShares).where(and(eq(videoShares.videoId, id), eq(videoShares.targetClassName, parsed.data.targetClassName))));
  if (!existing) await db.insert(videoShares).values({ id: randomUUID(), videoId: id, teacherId: session.user.id, targetClassName: parsed.data.targetClassName, createdAt: nowIso() });
  await recordAudit(session.user.id, "video.shared", "video", id, { targetClassName: parsed.data.targetClassName });
  revalidatePath(`/teacher/videos/${id}`);
  return NextResponse.json({ ok: true, alreadyShared: Boolean(existing) });
}
