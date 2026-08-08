import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { classMembers, observations } from "@/db/schema";
import { jsonError, recordAudit } from "@/lib/api";
import { getApiSession, getClassContext } from "@/lib/dal";
import { db, dbReady } from "@/lib/db";
import { firstOrNull } from "@/lib/db-helpers";
import { nowIso } from "@/lib/utils";

const observationSchema = z.object({ studentId: z.string(), category: z.enum(["attendance", "participation", "cooperation", "progress"]), content: z.string().min(4).max(600), rating: z.number().int().min(1).max(5), visibleToGuardian: z.boolean().default(true) });

export async function POST(request: Request) {
  const session = await getApiSession("teacher");
  if (!session) return jsonError("无权执行此操作", 403);
  const classroom = await getClassContext(session.user.id, "teacher");
  if (!classroom) return jsonError("未找到班级", 404);
  const parsed = observationSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("请填写完整的表现记录");
  await dbReady;
  const member = firstOrNull(await db.select().from(classMembers).where(and(eq(classMembers.classId, classroom.id), eq(classMembers.userId, parsed.data.studentId), eq(classMembers.memberRole, "student"))));
  if (!member) return jsonError("学生不属于当前班级", 403);
  const id = randomUUID();
  const now = nowIso();
  await db.insert(observations).values({ id, classId: classroom.id, studentId: parsed.data.studentId, teacherId: session.user.id, category: parsed.data.category, content: parsed.data.content, rating: parsed.data.rating, occurredAt: now, visibleToGuardian: parsed.data.visibleToGuardian });
  await recordAudit(session.user.id, "observation.created", "observation", id, { category: parsed.data.category });
  revalidatePath("/teacher/students");
  revalidatePath("/parent");
  return NextResponse.json({ id }, { status: 201 });
}
