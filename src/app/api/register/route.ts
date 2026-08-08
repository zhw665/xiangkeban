import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { randomUUID, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { classes, classMembers, guardianLinks, users } from "@/db/schema";
import { jsonError } from "@/lib/api";
import { DEMO_IDS } from "@/lib/constants";
import { db, dbReady } from "@/lib/db";
import { nowIso } from "@/lib/utils";

const registerSchema = z.object({
  role: z.enum(["teacher", "student", "parent"]),
  name: z.string().min(2).max(30),
  username: z.string().regex(/^[a-zA-Z0-9_]{3,24}$/),
  password: z.string().min(8).max(72),
  className: z.string().max(30).optional(),
  grade: z.string().max(20).optional(),
  inviteCode: z.string().max(20).optional(),
  studentUsername: z.string().max(24).optional(),
  relation: z.string().max(12).optional(),
});

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("请检查姓名、账号和密码，账号仅支持字母、数字与下划线");
  await dbReady;
  const input = parsed.data;
  const existingUsers = await db.select({ id: users.id }).from(users).where(eq(users.username, input.username)).all();
  if (existingUsers.length > 0) return jsonError("该账号已被使用", 409);

  let schoolId: string = DEMO_IDS.school;
  let targetClass: typeof classes.$inferSelect | undefined;
  let linkedStudent: typeof users.$inferSelect | undefined;
  if (input.role === "student") {
    if (!input.inviteCode) return jsonError("请输入老师提供的班级邀请码");
    targetClass = await db.select().from(classes).where(eq(classes.inviteCode, input.inviteCode.trim().toUpperCase())).get();
    if (!targetClass) return jsonError("班级邀请码不存在");
    schoolId = targetClass.schoolId;
  }
  if (input.role === "parent") {
    if (!input.studentUsername) return jsonError("请输入孩子的学生账号");
    linkedStudent = await db.select().from(users).where(eq(users.username, input.studentUsername.trim())).get();
    if (!linkedStudent || linkedStudent.role !== "student") return jsonError("未找到该学生账号");
    schoolId = linkedStudent.schoolId;
  }
  if (input.role === "teacher" && (!input.className || !input.grade)) return jsonError("请填写班级名称和年级");

  const userId = randomUUID();
  const now = nowIso();
  const passwordHash = await hash(input.password, 10);
  let generatedInviteCode: string | undefined;
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id: userId, schoolId, username: input.username, name: input.name, passwordHash, role: input.role, avatarColor: input.role === "student" ? "blue" : input.role === "parent" ? "amber" : "green", createdAt: now }).run();
    if (input.role === "teacher") {
      generatedInviteCode = `QH${randomBytes(3).toString("hex").toUpperCase()}`;
      const classId = randomUUID();
      await tx.insert(classes).values({ id: classId, schoolId, teacherId: userId, name: input.className!, grade: input.grade!, inviteCode: generatedInviteCode, createdAt: now }).run();
      await tx.insert(classMembers).values({ classId, userId, memberRole: "teacher", joinedAt: now }).run();
    } else if (input.role === "student" && targetClass) {
      await tx.insert(classMembers).values({ classId: targetClass.id, userId, memberRole: "student", joinedAt: now }).run();
    } else if (input.role === "parent" && linkedStudent) {
      await tx.insert(guardianLinks).values({ guardianId: userId, studentId: linkedStudent.id, relation: input.relation || "监护人", createdAt: now }).run();
    }
  });
  return NextResponse.json({ username: input.username, role: input.role, inviteCode: generatedInviteCode }, { status: 201 });
}
