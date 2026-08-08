import "server-only";

import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";

import {
  answers,
  assignmentItems,
  assignments,
  classMembers,
  files,
  guardianLinks,
  materials,
  messages,
  notifications,
  observations,
  posts,
  questions,
  submissions,
  users,
  videoComments,
  videoShares,
  videos,
  weeklyReports,
} from "@/db/schema";
import { db, dbReady } from "@/lib/db";
import { firstOrNull } from "@/lib/db-helpers";
import { getClassContext, getLinkedStudent } from "@/lib/dal";

export async function getTeacherData(userId: string) {
  await dbReady;
  const classroom = await getClassContext(userId, "teacher");
  if (!classroom) return null;

  const [questionRows, answerRows, assignmentRows, submissionRows, materialRows, videoRows, postRows, messageRows, notificationRows, studentRows, observationRows] = await Promise.all([
    db.select({
      id: questions.id, content: questions.content, subject: questions.subject, category: questions.aiCategory,
      knowledgePoint: questions.knowledgePoint, urgency: questions.urgency, hint: questions.aiHint,
      draft: questions.aiDraft, status: questions.status, isPublic: questions.isPublic,
      createdAt: questions.createdAt, studentName: users.name,
    }).from(questions).innerJoin(users, eq(questions.studentId, users.id))
      .where(eq(questions.classId, classroom.id)).orderBy(desc(questions.createdAt)),
    db.select().from(answers).orderBy(desc(answers.publishedAt)),
    db.select().from(assignments).where(eq(assignments.classId, classroom.id)).orderBy(desc(assignments.createdAt)),
    db.select().from(submissions),
    db.select().from(materials).where(eq(materials.classId, classroom.id)).orderBy(desc(materials.createdAt)),
    db.select().from(videos).where(eq(videos.classId, classroom.id)).orderBy(desc(videos.createdAt)),
    db.select().from(posts).where(and(eq(posts.classId, classroom.id), eq(posts.visibility, "class"))).orderBy(desc(posts.createdAt)),
    db.select({
      id: messages.id, content: messages.content, channel: messages.channel, createdAt: messages.createdAt,
      readAt: messages.readAt, senderId: messages.senderId, receiverId: messages.receiverId,
      attachmentId: messages.attachmentId, attachmentName: files.name, attachmentMimeType: files.mimeType, attachmentSize: files.size,
      senderName: users.name,
    }).from(messages).innerJoin(users, eq(messages.senderId, users.id)).leftJoin(files, eq(messages.attachmentId, files.id))
      .where(and(eq(messages.classId, classroom.id), or(eq(messages.channel, "class"), eq(messages.senderId, userId), eq(messages.receiverId, userId)))).orderBy(asc(messages.createdAt)),
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)),
    db.select({ id: users.id, name: users.name }).from(classMembers).innerJoin(users, eq(classMembers.userId, users.id))
      .where(and(eq(classMembers.classId, classroom.id), eq(classMembers.memberRole, "student"))),
    db.select().from(observations).where(eq(observations.classId, classroom.id)).orderBy(desc(observations.occurredAt)),
  ]);

  const assignmentIds = assignmentRows.map((item) => item.id);
  const classSubmissions = submissionRows.filter((item) => assignmentIds.includes(item.assignmentId));

  return {
    classroom,
    questions: questionRows.map((item) => ({ ...item, answer: answerRows.find((answer) => answer.questionId === item.id) ?? null })),
    assignments: assignmentRows.map((item) => ({
      ...item,
      submitted: classSubmissions.filter((entry) => entry.assignmentId === item.id && ["submitted", "graded", "revision"].includes(entry.status)).length,
      total: Math.max(studentRows.length, 1),
    })),
    submissions: classSubmissions,
    materials: materialRows,
    videos: videoRows,
    posts: postRows,
    messages: messageRows,
    notifications: notificationRows,
    students: studentRows,
    observations: observationRows,
  };
}

export async function getStudentData(userId: string) {
  await dbReady;
  const classroom = await getClassContext(userId, "student");
  if (!classroom) return null;

  const [assignmentRows, submissionRows, questionRows, answerRows, postRows, videoRows, materialRows, notificationRows, messageRows, memberRows] = await Promise.all([
    db.select().from(assignments).where(and(eq(assignments.classId, classroom.id), eq(assignments.status, "published"))).orderBy(asc(assignments.dueAt)),
    db.select().from(submissions).where(eq(submissions.studentId, userId)),
    db.select().from(questions).where(eq(questions.studentId, userId)).orderBy(desc(questions.createdAt)),
    db.select().from(answers).orderBy(desc(answers.publishedAt)),
    db.select().from(posts).where(and(eq(posts.classId, classroom.id), eq(posts.visibility, "class"))).orderBy(desc(posts.createdAt)),
    db.select().from(videos).where(and(eq(videos.classId, classroom.id), eq(videos.status, "ready"))).orderBy(desc(videos.createdAt)),
    db.select().from(materials).where(and(eq(materials.classId, classroom.id), eq(materials.status, "ready"))).orderBy(desc(materials.createdAt)),
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)),
    db.select({ id: messages.id, content: messages.content, channel: messages.channel, createdAt: messages.createdAt, senderId: messages.senderId, receiverId: messages.receiverId, attachmentId: messages.attachmentId, attachmentName: files.name, attachmentMimeType: files.mimeType, attachmentSize: files.size, senderName: users.name })
      .from(messages).innerJoin(users, eq(messages.senderId, users.id)).leftJoin(files, eq(messages.attachmentId, files.id))
      .where(and(eq(messages.classId, classroom.id), or(eq(messages.channel, "class"), eq(messages.senderId, userId), eq(messages.receiverId, userId)))).orderBy(asc(messages.createdAt)),
    db.select({ id: users.id, name: users.name, role: users.role }).from(classMembers).innerJoin(users, eq(classMembers.userId, users.id))
      .where(eq(classMembers.classId, classroom.id)).orderBy(asc(classMembers.joinedAt)),
  ]);

  const answerByQuestion = new Map(answerRows.map((item) => [item.questionId, item]));
  return {
    classroom,
    assignments: assignmentRows.map((item) => ({ ...item, submission: submissionRows.find((entry) => entry.assignmentId === item.id) ?? null })),
    questions: questionRows.map((item) => ({ ...item, answer: answerByQuestion.get(item.id) ?? null })),
    posts: postRows,
    videos: videoRows,
    materials: materialRows,
    notifications: notificationRows,
    messages: messageRows,
    members: memberRows,
  };
}

export async function getAssignmentForStudent(assignmentId: string, studentId: string) {
  await dbReady;
  const classroom = await getClassContext(studentId, "student");
  if (!classroom) return null;
  const assignment = firstOrNull(await db.select().from(assignments).where(and(eq(assignments.id, assignmentId), eq(assignments.classId, classroom.id), eq(assignments.status, "published"))));
  if (!assignment) return null;
  const items = await db.select().from(assignmentItems).where(eq(assignmentItems.assignmentId, assignmentId)).orderBy(asc(assignmentItems.orderNo));
  const submission = firstOrNull(await db.select().from(submissions).where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, studentId))));
  return { assignment, items, submission };
}

export async function getAssignmentForTeacher(assignmentId: string, teacherId: string) {
  await dbReady;
  const classroom = await getClassContext(teacherId, "teacher");
  if (!classroom) return null;
  const assignment = firstOrNull(await db.select().from(assignments).where(and(eq(assignments.id, assignmentId), eq(assignments.classId, classroom.id), eq(assignments.teacherId, teacherId))));
  if (!assignment) return null;
  const [items, submissionRows] = await Promise.all([
    db.select().from(assignmentItems).where(eq(assignmentItems.assignmentId, assignmentId)).orderBy(asc(assignmentItems.orderNo)),
    db.select({ id: submissions.id, status: submissions.status, score: submissions.score, answersJson: submissions.answersJson, feedback: submissions.feedback, submittedAt: submissions.submittedAt, studentId: submissions.studentId, studentName: users.name })
      .from(submissions).innerJoin(users, eq(submissions.studentId, users.id)).where(eq(submissions.assignmentId, assignmentId)).orderBy(desc(submissions.updatedAt)),
  ]);
  return { assignment, items, submissions: submissionRows };
}

export async function getVideoForTeacher(videoId: string, teacherId: string) {
  await dbReady;
  const classroom = await getClassContext(teacherId, "teacher");
  if (!classroom) return null;
  const video = firstOrNull(await db.select().from(videos).where(and(eq(videos.id, videoId), eq(videos.classId, classroom.id), eq(videos.teacherId, teacherId))));
  if (!video) return null;
  const [comments, shares] = await Promise.all([
    db.select({ id: videoComments.id, anonymousLabel: videoComments.anonymousLabel, content: videoComments.content, createdAt: videoComments.createdAt }).from(videoComments).where(eq(videoComments.videoId, videoId)).orderBy(desc(videoComments.createdAt)),
    db.select().from(videoShares).where(eq(videoShares.videoId, videoId)).orderBy(desc(videoShares.createdAt)),
  ]);
  return { video, comments, shares };
}

export async function getTeacherGuardianContacts(teacherId: string) {
  await dbReady;
  const classroom = await getClassContext(teacherId, "teacher");
  if (!classroom) return [];
  const [links, people, members] = await Promise.all([
    db.select().from(guardianLinks),
    db.select({ id: users.id, name: users.name, role: users.role }).from(users),
    db.select().from(classMembers).where(and(eq(classMembers.classId, classroom.id), eq(classMembers.memberRole, "student"))),
  ]);
  const memberIds = new Set(members.map((item) => item.userId));
  return links.filter((link) => memberIds.has(link.studentId)).map((link) => ({
    id: link.guardianId,
    name: people.find((person) => person.id === link.guardianId)?.name ?? "家长",
    studentName: people.find((person) => person.id === link.studentId)?.name ?? "学生",
    relation: link.relation,
  }));
}

export async function getParentData(userId: string) {
  await dbReady;
  const [classroom, student] = await Promise.all([getClassContext(userId, "parent"), getLinkedStudent(userId)]);
  if (!classroom || !student) return null;

  const [assignmentRows, submissionRows, reportRows, observationRows, postRows, notificationRows, messageRows] = await Promise.all([
    db.select().from(assignments).where(and(eq(assignments.classId, classroom.id), eq(assignments.status, "published"))).orderBy(asc(assignments.dueAt)),
    db.select().from(submissions).where(eq(submissions.studentId, student.id)),
    db.select().from(weeklyReports).where(eq(weeklyReports.studentId, student.id)).orderBy(desc(weeklyReports.weekStart)),
    db.select().from(observations).where(and(eq(observations.studentId, student.id), eq(observations.visibleToGuardian, true))).orderBy(desc(observations.occurredAt)),
    db.select().from(posts).where(and(eq(posts.classId, classroom.id), eq(posts.visibility, "guardians"))).orderBy(desc(posts.createdAt)),
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)),
    db.select({ id: messages.id, content: messages.content, channel: messages.channel, createdAt: messages.createdAt, senderId: messages.senderId, receiverId: messages.receiverId, senderName: users.name })
      .from(messages).innerJoin(users, eq(messages.senderId, users.id))
      .where(and(eq(messages.classId, classroom.id), eq(messages.channel, "parent_teacher"), or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))).orderBy(asc(messages.createdAt)),
  ]);

  return {
    classroom,
    student,
    assignments: assignmentRows.map((item) => ({ ...item, submission: submissionRows.find((entry) => entry.assignmentId === item.id) ?? null })),
    reports: reportRows,
    observations: observationRows,
    posts: postRows,
    notifications: notificationRows,
    messages: messageRows,
  };
}

export async function getQuestionAnswer(questionId: string) {
  await dbReady;
  return firstOrNull(await db.select().from(answers).where(eq(answers.questionId, questionId)));
}

export async function getAssignmentItemsForTeacher(assignmentIds: string[]) {
  await dbReady;
  if (assignmentIds.length === 0) return [];
  return db.select().from(assignmentItems).where(inArray(assignmentItems.assignmentId, assignmentIds)).orderBy(asc(assignmentItems.orderNo));
}

export async function getUnreadCount(userId: string) {
  await dbReady;
  const rows = await db.select().from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return rows.length;
}
