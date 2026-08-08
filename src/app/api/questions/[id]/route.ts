import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { answers, notifications, posts, questions } from "@/db/schema";
import { jsonError, recordAudit } from "@/lib/api";
import { getApiSession, getClassContext } from "@/lib/dal";
import { db, dbReady } from "@/lib/db";
import { firstOrNull } from "@/lib/db-helpers";
import { nowIso } from "@/lib/utils";

const responseSchema = z.object({ content: z.string().min(4).max(2400), isPublic: z.boolean().default(false) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getApiSession("teacher");
  if (!session) return jsonError("无权执行此操作", 403);
  const classroom = await getClassContext(session.user.id, "teacher");
  const { id } = await context.params;
  if (!classroom) return jsonError("未找到班级", 404);
  const parsed = responseSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("回复内容过短");
  await dbReady;
  const question = firstOrNull(await db.select().from(questions).where(and(eq(questions.id, id), eq(questions.classId, classroom.id))));
  if (!question) return jsonError("问题不存在", 404);
  const existing = firstOrNull(await db.select().from(answers).where(eq(answers.questionId, id)));
  const now = nowIso();
  await db.transaction(async (tx) => {
    if (existing) await tx.update(answers).set({ content: parsed.data.content, publishedAt: now }).where(eq(answers.id, existing.id));
    else await tx.insert(answers).values({ id: randomUUID(), questionId: id, teacherId: session.user.id, content: parsed.data.content, publishedAt: now });
    await tx.update(questions).set({ status: parsed.data.isPublic ? "published" : "answered", isPublic: parsed.data.isPublic }).where(eq(questions.id, id));
    if (parsed.data.isPublic) {
      const postId = `question-post-${id}`;
      const postExists = firstOrNull(await tx.select().from(posts).where(eq(posts.id, postId)));
      const postContent = `${question.content}\n\n老师回复：${parsed.data.content}`;
      if (postExists) await tx.update(posts).set({ content: postContent, title: `${question.subject}公开答疑` }).where(eq(posts.id, postId));
      else await tx.insert(posts).values({ id: postId, classId: classroom.id, authorId: session.user.id, videoId: null, type: "question", title: `${question.subject}公开答疑`, content: postContent, visibility: "class", createdAt: now });
    }
    await tx.insert(notifications).values({ id: randomUUID(), userId: question.studentId, title: "老师回复了你的问题", body: parsed.data.content.slice(0, 60), type: "answer", href: "/student/questions", readAt: null, createdAt: now });
  });
  await recordAudit(session.user.id, "question.answered", "question", id, { isPublic: parsed.data.isPublic });
  revalidatePath("/teacher/questions");
  revalidatePath("/student/questions");
  revalidatePath("/student");
  return NextResponse.json({ ok: true });
}
