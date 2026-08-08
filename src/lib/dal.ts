import "server-only";

import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { classMembers, classes, guardianLinks, users } from "@/db/schema";
import { db, dbReady } from "@/lib/db";
import type { UserRole } from "@/lib/constants";

export const getSession = cache(async () => auth());

export async function requireSession(role?: UserRole) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  if (role && session.user.role !== role) redirect(`/${session.user.role}`);
  return session;
}

export async function getApiSession(role?: UserRole) {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (role && session.user.role !== role) return null;
  return session;
}

export async function getClassContext(userId: string, role: UserRole) {
  await dbReady;
  if (role === "teacher") {
    return db.select().from(classes).where(eq(classes.teacherId, userId)).get() ?? null;
  }

  if (role === "student") {
    return db.select({
      id: classes.id,
      schoolId: classes.schoolId,
      teacherId: classes.teacherId,
      name: classes.name,
      grade: classes.grade,
      inviteCode: classes.inviteCode,
      createdAt: classes.createdAt,
    }).from(classMembers).innerJoin(classes, eq(classMembers.classId, classes.id))
      .where(and(eq(classMembers.userId, userId), eq(classMembers.memberRole, "student"))).get() ?? null;
  }

  return db.select({
    id: classes.id,
    schoolId: classes.schoolId,
    teacherId: classes.teacherId,
    name: classes.name,
    grade: classes.grade,
    inviteCode: classes.inviteCode,
    createdAt: classes.createdAt,
  }).from(guardianLinks)
    .innerJoin(classMembers, eq(guardianLinks.studentId, classMembers.userId))
    .innerJoin(classes, eq(classMembers.classId, classes.id))
    .where(eq(guardianLinks.guardianId, userId)).get() ?? null;
}

export async function getLinkedStudent(guardianId: string) {
  await dbReady;
  return db.select({
    id: users.id,
    name: users.name,
    relation: guardianLinks.relation,
  }).from(guardianLinks).innerJoin(users, eq(guardianLinks.studentId, users.id))
    .where(eq(guardianLinks.guardianId, guardianId)).get() ?? null;
}

export async function assertClassAccess(userId: string, role: UserRole, classId: string) {
  const classroom = await getClassContext(userId, role);
  return classroom?.id === classId ? classroom : null;
}
