import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { classMembers, guardianLinkCodes } from "@/db/schema";
import { jsonError, recordAudit } from "@/lib/api";
import { getApiSession, getClassContext } from "@/lib/dal";
import { db, dbReady } from "@/lib/db";
import { firstOrNull } from "@/lib/db-helpers";
import { createGuardianCode } from "@/lib/guardian-codes";
import { nowIso } from "@/lib/utils";

const requestSchema = z.object({ studentId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session || session.user.role === "parent") {
    return jsonError("无权生成家长绑定码", 403);
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("请选择学生");
  const studentId = parsed.data.studentId;
  await dbReady;

  if (session.user.role === "student") {
    if (studentId !== session.user.id) {
      return jsonError("只能为自己生成家长绑定码", 403);
    }
    const classroom = await getClassContext(session.user.id, "student");
    if (!classroom) return jsonError("未找到班级", 404);
  } else {
    const classroom = await getClassContext(session.user.id, "teacher");
    if (!classroom) return jsonError("未找到班级", 404);
    const membership = firstOrNull(
      await db
        .select({ userId: classMembers.userId })
        .from(classMembers)
        .where(
          and(
            eq(classMembers.classId, classroom.id),
            eq(classMembers.userId, studentId),
            eq(classMembers.memberRole, "student"),
          ),
        ),
    );
    if (!membership) return jsonError("学生不属于当前班级", 403);
  }

  const now = nowIso();
  const guardianCode = createGuardianCode(new Date(now));
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx
      .update(guardianLinkCodes)
      .set({ usedAt: now })
      .where(
        and(
          eq(guardianLinkCodes.studentId, studentId),
          isNull(guardianLinkCodes.usedAt),
        ),
      );
    await tx.insert(guardianLinkCodes).values({
      id,
      studentId,
      codeHash: guardianCode.codeHash,
      expiresAt: guardianCode.expiresAt,
      usedAt: null,
      createdBy: session.user.id,
      createdAt: now,
    });
  });

  await recordAudit(
    session.user.id,
    "guardian_code.created",
    "student",
    studentId,
  );
  return NextResponse.json(
    { code: guardianCode.code, expiresAt: guardianCode.expiresAt },
    { status: 201 },
  );
}
