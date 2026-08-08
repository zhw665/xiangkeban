import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { materials } from "@/db/schema";
import { jsonError, recordAudit } from "@/lib/api";
import { getApiSession, getClassContext } from "@/lib/dal";
import { db, dbReady } from "@/lib/db";

const editSchema = z.object({ title: z.string().min(2).max(80), subject: z.string().min(1).max(20), notes: z.string().max(2400), summary: z.string().min(6).max(2400), lessonPlan: z.string().min(10).max(12000) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getApiSession("teacher");
  if (!session) return jsonError("无权执行此操作", 403);
  const classroom = await getClassContext(session.user.id, "teacher");
  if (!classroom) return jsonError("未找到班级", 404);
  const parsed = editSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("请检查备课信息是否完整");
  const { id } = await context.params;
  await dbReady;
  const material = await db.select().from(materials).where(and(eq(materials.id, id), eq(materials.classId, classroom.id), eq(materials.teacherId, session.user.id))).get();
  if (!material) return jsonError("备课记录不存在", 404);
  await db.update(materials).set(parsed.data).where(eq(materials.id, id)).run();
  await recordAudit(session.user.id, "material.updated", "material", id);
  revalidatePath("/teacher/materials");
  revalidatePath("/student/learn");
  return NextResponse.json({ ok: true });
}
