import { hash } from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  classes,
  classMembers,
  guardianLinkCodes,
  guardianLinks,
  users,
} from "@/db/schema";
import { jsonError, recordAudit } from "@/lib/api";
import { DEMO_IDS } from "@/lib/constants";
import { db, dbReady } from "@/lib/db";
import { firstOrNull } from "@/lib/db-helpers";
import {
  createGuardianCode,
  hashGuardianCode,
} from "@/lib/guardian-codes";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { nowIso } from "@/lib/utils";

const registerSchema = z.object({
  role: z.enum(["teacher", "student", "parent"]),
  name: z.string().min(2).max(30),
  username: z.string().regex(/^[a-zA-Z0-9_]{3,24}$/),
  password: z.string().min(8).max(72),
  className: z.string().max(30).optional(),
  grade: z.string().max(20).optional(),
  inviteCode: z.string().max(20).optional(),
  schoolInviteCode: z.string().max(80).optional(),
  guardianCode: z.string().max(32).optional(),
  relation: z.string().max(12).optional(),
});

class GuardianCodeRejected extends Error {}

function inviteCodesMatch(received: string, expected: string) {
  const receivedHash = createHash("sha256").update(received.trim()).digest();
  const expectedHash = createHash("sha256").update(expected.trim()).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("请检查姓名、账号和密码，账号仅支持字母、数字与下划线");
  }

  await dbReady;
  const input = parsed.data;
  if (input.role === "teacher") {
    const expectedCode = getRuntimeConfig().schoolInviteCode;
    if (
      !input.schoolInviteCode ||
      !expectedCode ||
      !inviteCodesMatch(input.schoolInviteCode, expectedCode)
    ) {
      return jsonError("学校邀请码不正确", 403);
    }
    if (!input.className || !input.grade) {
      return jsonError("请填写班级名称和年级");
    }
  }
  if (input.role === "parent" && !input.guardianCode) {
    return jsonError("请输入学生提供的一次性家长绑定码");
  }

  const existingUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, input.username));
  if (existingUsers.length > 0) return jsonError("该账号已被使用", 409);

  let schoolId: string = DEMO_IDS.school;
  let targetClass: typeof classes.$inferSelect | undefined;
  if (input.role === "student") {
    if (!input.inviteCode) return jsonError("请输入老师提供的班级邀请码");
    targetClass =
      firstOrNull(
        await db
          .select()
          .from(classes)
          .where(eq(classes.inviteCode, input.inviteCode.trim().toUpperCase())),
      ) ?? undefined;
    if (!targetClass) return jsonError("班级邀请码不存在");
    schoolId = targetClass.schoolId;
  }

  const userId = randomUUID();
  const now = nowIso();
  const passwordHash = await hash(input.password, 10);
  let generatedInviteCode: string | undefined;
  let generatedGuardianCode: string | undefined;
  let linkedStudentId: string | undefined;

  try {
    await db.transaction(async (tx) => {
      if (input.role === "parent") {
        const claimedCode = firstOrNull(
          await tx
            .update(guardianLinkCodes)
            .set({ usedAt: now })
            .where(
              and(
                eq(
                  guardianLinkCodes.codeHash,
                  hashGuardianCode(input.guardianCode!),
                ),
                isNull(guardianLinkCodes.usedAt),
                gt(guardianLinkCodes.expiresAt, now),
              ),
            )
            .returning({ studentId: guardianLinkCodes.studentId }),
        );
        if (!claimedCode) throw new GuardianCodeRejected();

        const linkedStudent = firstOrNull(
          await tx
            .select({ id: users.id, schoolId: users.schoolId })
            .from(users)
            .where(
              and(
                eq(users.id, claimedCode.studentId),
                eq(users.role, "student"),
              ),
            ),
        );
        if (!linkedStudent) throw new GuardianCodeRejected();
        linkedStudentId = linkedStudent.id;
        schoolId = linkedStudent.schoolId;
      }

      await tx.insert(users).values({
        id: userId,
        schoolId,
        username: input.username,
        name: input.name,
        passwordHash,
        role: input.role,
        avatarColor:
          input.role === "student"
            ? "blue"
            : input.role === "parent"
              ? "amber"
              : "green",
        createdAt: now,
      });

      if (input.role === "teacher") {
        generatedInviteCode = `QH${randomBytes(3).toString("hex").toUpperCase()}`;
        const classId = randomUUID();
        await tx.insert(classes).values({
          id: classId,
          schoolId,
          teacherId: userId,
          name: input.className!,
          grade: input.grade!,
          inviteCode: generatedInviteCode,
          createdAt: now,
        });
        await tx.insert(classMembers).values({
          classId,
          userId,
          memberRole: "teacher",
          joinedAt: now,
        });
      } else if (input.role === "student" && targetClass) {
        await tx.insert(classMembers).values({
          classId: targetClass.id,
          userId,
          memberRole: "student",
          joinedAt: now,
        });
        const guardianCode = createGuardianCode(new Date(now));
        generatedGuardianCode = guardianCode.code;
        await tx.insert(guardianLinkCodes).values({
          id: randomUUID(),
          studentId: userId,
          codeHash: guardianCode.codeHash,
          expiresAt: guardianCode.expiresAt,
          usedAt: null,
          createdBy: userId,
          createdAt: now,
        });
      } else if (input.role === "parent" && linkedStudentId) {
        await tx.insert(guardianLinks).values({
          guardianId: userId,
          studentId: linkedStudentId,
          relation: input.relation || "监护人",
          createdAt: now,
        });
      }
    });
  } catch (error) {
    if (error instanceof GuardianCodeRejected) {
      return jsonError("家长绑定码无效、已过期或已被使用", 409);
    }
    throw error;
  }

  await recordAudit(userId, "user.registered", "user", userId, {
    role: input.role,
  });
  if (input.role === "parent" && linkedStudentId) {
    await recordAudit(userId, "guardian.linked", "student", linkedStudentId, {
      relation: input.relation || "监护人",
    });
  }

  return NextResponse.json(
    {
      username: input.username,
      role: input.role,
      inviteCode: generatedInviteCode,
      guardianCode: generatedGuardianCode,
    },
    { status: 201 },
  );
}
