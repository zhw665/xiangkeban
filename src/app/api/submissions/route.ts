import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { assignmentItems, assignments, notifications, submissions } from "@/db/schema";
import { claimOfflineRequest, jsonError, recordAudit } from "@/lib/api";
import { getApiSession, getClassContext } from "@/lib/dal";
import { db, dbReady } from "@/lib/db";
import { gradeSubmission } from "@/lib/grading";
import { nowIso } from "@/lib/utils";

const submissionSchema = z.object({ assignmentId: z.string().min(1), answers: z.record(z.string(), z.string().max(3000)) });

export async function POST(request: Request) {
  const session = await getApiSession("student");
  if (!session) return jsonError("无权执行此操作", 403);
  if (!(await claimOfflineRequest(request, session.user.id))) return jsonError("该离线请求已经同步", 409);
  const parsed = submissionSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("提交内容不完整");
  const classroom = await getClassContext(session.user.id, "student");
  if (!classroom) return jsonError("未找到班级", 404);
  await dbReady;
  const assignment = await db.select().from(assignments).where(and(eq(assignments.id, parsed.data.assignmentId), eq(assignments.classId, classroom.id), eq(assignments.status, "published"))).get();
  if (!assignment) return jsonError("作业不存在或已经关闭", 404);
  const items = await db.select().from(assignmentItems).where(eq(assignmentItems.assignmentId, assignment.id)).all();
  const result = gradeSubmission(items.map((item) => ({ id: item.id, type: item.type, answer: item.answer, points: item.points })), parsed.data.answers);
  const now = nowIso();
  const existing = await db.select().from(submissions).where(and(eq(submissions.assignmentId, assignment.id), eq(submissions.studentId, session.user.id))).get();
  const submissionId = existing?.id ?? randomUUID();
  await db.transaction(async (tx) => {
    if (existing) await tx.update(submissions).set({ status: "graded", score: result.score, answersJson: JSON.stringify(parsed.data.answers), feedback: result.feedback, submittedAt: now, updatedAt: now }).where(eq(submissions.id, existing.id)).run();
    else await tx.insert(submissions).values({ id: submissionId, assignmentId: assignment.id, studentId: session.user.id, status: "graded", score: result.score, answersJson: JSON.stringify(parsed.data.answers), feedback: result.feedback, submittedAt: now, updatedAt: now }).run();
    await tx.insert(notifications).values({ id: randomUUID(), userId: classroom.teacherId, title: "学生提交了作业", body: assignment.title, type: "submission", href: "/teacher/assignments", readAt: null, createdAt: now }).run();
  });
  await recordAudit(session.user.id, "submission.submitted", "submission", submissionId, { score: result.score, missed: result.missed });
  revalidatePath("/student/assignments");
  revalidatePath(`/student/assignments/${assignment.id}`);
  revalidatePath("/teacher/assignments");
  revalidatePath("/parent");
  return NextResponse.json({ id: submissionId, ...result }, { status: existing ? 200 : 201 });
}
