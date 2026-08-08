import "server-only";

import { hashSync } from "bcryptjs";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { and, count, eq } from "drizzle-orm";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import * as schema from "@/db/schema";
import { DEMO_IDS } from "@/lib/constants";

const globalDb = globalThis as unknown as {
  sqlite?: DatabaseSync;
  seedPromise?: Promise<void>;
};

const rawPath = process.env.DATABASE_PATH ?? "./data/xiangke.db";
const databasePath = path.isAbsolute(rawPath) ? rawPath : path.join(/* turbopackIgnore: true */ process.cwd(), rawPath);
mkdirSync(path.dirname(databasePath), { recursive: true });

const sqlite = globalDb.sqlite ?? new DatabaseSync(databasePath);
sqlite.exec("PRAGMA busy_timeout = 10000; PRAGMA foreign_keys = ON;");
try {
  sqlite.exec("PRAGMA journal_mode = WAL;");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("locked")) throw error;
}

const migrationPath = path.join(process.cwd(), "drizzle", "0000_init.sql");
if (!existsSync(migrationPath)) {
  throw new Error(`Missing database migration: ${migrationPath}`);
}
sqlite.exec(readFileSync(migrationPath, "utf8"));

function ensureColumn(table: string, column: string, definition: string) {
  const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((item) => item.name === column)) sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

ensureColumn("materials", "notes", "TEXT NOT NULL DEFAULT ''");
ensureColumn("assignments", "file_id", "TEXT REFERENCES files(id)");

export const db = drizzle(async (sql, params, method) => {
  const statement = sqlite.prepare(sql);
  if (method === "run") {
    statement.run(...params);
    return { rows: [] };
  }
  statement.setReturnArrays(true);
  if (method === "get") return { rows: (statement.get(...params) as unknown[] | undefined) ?? [] };
  return { rows: statement.all(...params) as unknown as unknown[][] };
}, { schema });
export { sqlite };

async function seedDatabase() {
  const existing = await db.select({ value: count() }).from(schema.users).get();
  if ((existing?.value ?? 0) > 0) return;

  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const nextWeek = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString();
  const passwordHash = hashSync("demo1234", 10);

  await db.transaction(async (tx) => {
    await tx.insert(schema.schools).values({ id: DEMO_IDS.school, name: "青禾中心小学", region: "云南省青禾乡", createdAt: now }).run();
    await tx.insert(schema.users).values([
      { id: DEMO_IDS.teacher, schoolId: DEMO_IDS.school, username: "teacher", name: "李晓云", passwordHash, role: "teacher", avatarColor: "green", createdAt: now },
      { id: DEMO_IDS.student, schoolId: DEMO_IDS.school, username: "student", name: "张小禾", passwordHash, role: "student", avatarColor: "blue", createdAt: now },
      { id: DEMO_IDS.parent, schoolId: DEMO_IDS.school, username: "parent", name: "张桂兰", passwordHash, role: "parent", avatarColor: "amber", createdAt: now },
    ]).run();
    await tx.insert(schema.classes).values({ id: DEMO_IDS.class, schoolId: DEMO_IDS.school, teacherId: DEMO_IDS.teacher, name: "五年级一班", grade: "五年级", inviteCode: "QINGHE51", createdAt: now }).run();
    await tx.insert(schema.classMembers).values([
      { classId: DEMO_IDS.class, userId: DEMO_IDS.teacher, memberRole: "teacher", joinedAt: now },
      { classId: DEMO_IDS.class, userId: DEMO_IDS.student, memberRole: "student", joinedAt: now },
    ]).run();
    await tx.insert(schema.guardianLinks).values({ guardianId: DEMO_IDS.parent, studentId: DEMO_IDS.student, relation: "母亲", createdAt: now }).run();

    await tx.insert(schema.materials).values({
      id: "material-fractions", classId: DEMO_IDS.class, teacherId: DEMO_IDS.teacher, fileId: null,
      title: "分数的意义", subject: "数学", notes: "学生已经认识简单分数，课堂上使用一篮玉米和四张等大的纸片；重点观察学生是否真正理解“平均分”。", summary: "借助分田地和分玉米的乡村生活情境，理解单位“1”、分数单位与分数表示。",
      lessonPlan: "目标：理解分数表示整体与部分的关系。\n导入：一块田平均分给4户。\n探究：比较1/4与2/4。\n练习：用身边物品描述分数。\n小结：分母表示平均分的份数，分子表示取的份数。",
      status: "ready", createdAt: yesterday,
    }).run();
    await tx.insert(schema.materialChunks).values([
      { id: "chunk-fraction-1", materialId: "material-fractions", chunkIndex: 0, content: "把一个整体平均分成若干份，表示其中一份或几份的数叫作分数。分母表示平均分成的份数，分子表示所取的份数。" },
      { id: "chunk-fraction-2", materialId: "material-fractions", chunkIndex: 1, content: "一块田平均分成4份，每份是这块田的四分之一，两份是四分之二。只有平均分时才能直接用分数表示。" },
    ]).run();

    await tx.insert(schema.questions).values([
      { id: "question-1", classId: DEMO_IDS.class, studentId: DEMO_IDS.student, attachmentId: null, subject: "数学", content: "为什么一块地分成四份，其中一份不一定是四分之一？", aiCategory: "概念理解", knowledgePoint: "平均分与单位1", urgency: "normal", aiHint: "先想一想：四份的大小必须满足什么条件？", aiDraft: "关键在“平均分”。只有四份同样大，每一份才是整体的四分之一。若大小不同，就不能直接用四分之一表示。", status: "pending", isPublic: false, createdAt: yesterday },
      { id: "question-2", classId: DEMO_IDS.class, studentId: DEMO_IDS.student, attachmentId: null, subject: "科学", content: "凤仙花为什么总朝窗外长？", aiCategory: "现象解释", knowledgePoint: "植物的向光性", urgency: "normal", aiHint: "观察窗内外哪一侧的光更强，再想植物的茎会朝哪里生长。", aiDraft: "这是植物的向光性。靠近窗外的一侧光线更充足，茎会逐渐朝光源方向生长。可以每两天转动一次花盆继续观察。", status: "answered", isPublic: true, createdAt: yesterday },
    ]).run();
    await tx.insert(schema.answers).values({ id: "answer-2", questionId: "question-2", teacherId: DEMO_IDS.teacher, content: "这是凤仙花的向光性。把花盆转半圈并记录三天，你会看到新的弯曲方向。注意每天保持浇水量一致。", publishedAt: now }).run();

    await tx.insert(schema.assignments).values([
      { id: "assignment-fractions", classId: DEMO_IDS.class, teacherId: DEMO_IDS.teacher, fileId: null, title: "分数的意义 · 课后巩固", subject: "数学", description: "完成两道基础题和一道生活观察题。", dueAt: tomorrow, status: "published", createdAt: yesterday },
      { id: "assignment-reading", classId: DEMO_IDS.class, teacherId: DEMO_IDS.teacher, fileId: null, title: "《桂花雨》阅读记录", subject: "语文", description: "摘录最喜欢的一句话，并说明理由。", dueAt: nextWeek, status: "published", createdAt: now },
    ]).run();
    await tx.insert(schema.assignmentItems).values([
      { id: "item-f-1", assignmentId: "assignment-fractions", prompt: "把12个玉米平均分成4份，每份占总数的几分之几？", type: "single", optionsJson: JSON.stringify(["1/2", "1/3", "1/4", "3/4"]), answer: "1/4", points: 40, orderNo: 1 },
      { id: "item-f-2", assignmentId: "assignment-fractions", prompt: "用一句话说明分母表示什么。", type: "short", optionsJson: "[]", answer: "平均分成的份数", points: 60, orderNo: 2 },
    ]).run();
    await tx.insert(schema.submissions).values({ id: "submission-reading", assignmentId: "assignment-reading", studentId: DEMO_IDS.student, status: "graded", score: 92, answersJson: JSON.stringify({ note: "桂花盛开的时候，不说香飘十里，至少前后十几家邻居，没有不浸在桂花香里的。" }), feedback: "摘录准确，理由里再补充一种感官描写会更完整。", submittedAt: yesterday, updatedAt: now }).run();

    await tx.insert(schema.videos).values({ id: "video-fraction", classId: DEMO_IDS.class, teacherId: DEMO_IDS.teacher, fileId: null, title: "5分钟弄懂单位“1”", description: "用一块梯田和一篮玉米解释整体与部分。", knowledgePoint: "单位1", durationSeconds: 312, status: "ready", createdAt: yesterday }).run();
    await tx.insert(schema.videoComments).values([
      { id: "video-comment-1", videoId: "video-fraction", studentId: DEMO_IDS.student, anonymousLabel: "同学A", content: "用玉米分成四份的例子很容易看懂，我终于分清分子和分母了。", createdAt: yesterday },
      { id: "video-comment-2", videoId: "video-fraction", studentId: null, anonymousLabel: "同学B", content: "希望老师再讲一下不是平均分时为什么不能用分数。", createdAt: now },
    ]).run();
    await tx.insert(schema.posts).values([
      { id: "post-video", classId: DEMO_IDS.class, authorId: DEMO_IDS.teacher, videoId: "video-fraction", type: "resource", title: "今晚先看这段分数微课", content: "看完后请在作业里写一个生活中的分数例子。", visibility: "class", createdAt: yesterday },
      { id: "post-notice", classId: DEMO_IDS.class, authorId: DEMO_IDS.teacher, videoId: null, type: "announcement", title: "周五带一片完整叶子", content: "科学课需要观察叶脉，请用旧报纸夹好带到学校。", visibility: "guardians", createdAt: now },
    ]).run();
    await tx.insert(schema.messages).values([
      { id: "message-1", classId: DEMO_IDS.class, senderId: DEMO_IDS.student, receiverId: DEMO_IDS.teacher, attachmentId: null, channel: "student_teacher", content: "李老师，我把分数练习改好了，明天可以再问您一道吗？", readAt: null, createdAt: yesterday },
      { id: "message-2", classId: DEMO_IDS.class, senderId: DEMO_IDS.teacher, receiverId: DEMO_IDS.parent, attachmentId: null, channel: "parent_teacher", content: "小禾本周课堂发言更主动了，周末可以让她用家里的物品讲一个分数例子。", readAt: now, createdAt: yesterday },
    ]).run();
    await tx.insert(schema.observations).values([
      { id: "observation-1", classId: DEMO_IDS.class, studentId: DEMO_IDS.student, teacherId: DEMO_IDS.teacher, category: "participation", content: "数学课主动用玉米举例说明四分之一。", rating: 4, occurredAt: yesterday, visibleToGuardian: true },
      { id: "observation-2", classId: DEMO_IDS.class, studentId: DEMO_IDS.student, teacherId: DEMO_IDS.teacher, category: "attendance", content: "本周全勤，课前准备及时。", rating: 5, occurredAt: now, visibleToGuardian: true },
    ]).run();
    await tx.insert(schema.weeklyReports).values({ id: "report-week-1", classId: DEMO_IDS.class, studentId: DEMO_IDS.student, weekStart: yesterday.slice(0, 10), summary: "小禾本周完成4项学习任务，数学课堂参与明显提升。", accomplishments: "按时完成阅读记录；能用生活例子解释四分之一；本周全勤。", needsHelp: "分子和分母的含义偶尔混淆，应用题读题速度偏慢。", familyActions: "晚饭时请小禾用一盘食物讲一个分数例子；每天安排10分钟朗读。", generatedBy: "demo", createdAt: now }).run();
    await tx.insert(schema.notifications).values([
      { id: "notify-teacher", userId: DEMO_IDS.teacher, title: "有1个问题待处理", body: "小禾提交了关于平均分的问题。", type: "question", href: "/teacher/questions", readAt: null, createdAt: now },
      { id: "notify-student", userId: DEMO_IDS.student, title: "科学问题已回复", body: "李老师回复了凤仙花向光性问题。", type: "answer", href: "/student/questions", readAt: null, createdAt: now },
      { id: "notify-parent", userId: DEMO_IDS.parent, title: "本周学情简报已更新", body: "小禾本周课堂参与有明显进步。", type: "report", href: "/parent/reports", readAt: null, createdAt: now },
    ]).run();
  });
}

async function ensureDemoExtras() {
  const material = await db.select().from(schema.materials).where(eq(schema.materials.id, "material-fractions")).get();
  if (material && !material.notes) {
    await db.update(schema.materials).set({ notes: "学生已经认识简单分数，课堂上使用一篮玉米和四张等大的纸片；重点观察学生是否真正理解“平均分”。" }).where(eq(schema.materials.id, material.id)).run();
  }
  const video = await db.select().from(schema.videos).where(eq(schema.videos.id, "video-fraction")).get();
  if (!video) return;
  const existingComments = await db.select({ id: schema.videoComments.id }).from(schema.videoComments).where(and(eq(schema.videoComments.videoId, video.id), eq(schema.videoComments.id, "video-comment-1"))).all();
  if (existingComments.length === 0) {
    const now = new Date().toISOString();
    await db.insert(schema.videoComments).values([
      { id: "video-comment-1", videoId: video.id, studentId: DEMO_IDS.student, anonymousLabel: "同学A", content: "用玉米分成四份的例子很容易看懂，我终于分清分子和分母了。", createdAt: now },
      { id: "video-comment-2", videoId: video.id, studentId: null, anonymousLabel: "同学B", content: "希望老师再讲一下不是平均分时为什么不能用分数。", createdAt: now },
    ]).run();
  }
}

const baseSeed = globalDb.seedPromise ?? seedDatabase();
export const dbReady = baseSeed.then(ensureDemoExtras);
globalDb.seedPromise = dbReady;

if (process.env.NODE_ENV !== "production") globalDb.sqlite = sqlite;

export async function getUserByUsername(username: string) {
  await dbReady;
  return db.select().from(schema.users).where(eq(schema.users.username, username)).get();
}
