import { boolean, index, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
};

export const schools = pgTable("schools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  ...timestamps,
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["teacher", "student", "parent"] }).notNull(),
  avatarColor: text("avatar_color").notNull().default("green"),
  ...timestamps,
}, (table) => [index("users_school_idx").on(table.schoolId)]);

export const classes = pgTable("classes", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  teacherId: text("teacher_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  ...timestamps,
}, (table) => [index("classes_school_idx").on(table.schoolId)]);

export const classMembers = pgTable("class_members", {
  classId: text("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  memberRole: text("member_role").notNull(),
  joinedAt: text("joined_at").notNull(),
}, (table) => [primaryKey({ columns: [table.classId, table.userId] })]);

export const guardianLinks = pgTable("guardian_links", {
  guardianId: text("guardian_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  relation: text("relation").notNull(),
  ...timestamps,
}, (table) => [primaryKey({ columns: [table.guardianId, table.studentId] })]);

export const guardianLinkCodes = pgTable("guardian_link_codes", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdBy: text("created_by").notNull().references(() => users.id),
  ...timestamps,
});

export const files = pgTable("files", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  classId: text("class_id").references(() => classes.id),
  ownerId: text("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  storageKey: text("storage_key").notNull(),
  ...timestamps,
});

export const materials = pgTable("materials", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull().references(() => classes.id),
  teacherId: text("teacher_id").notNull().references(() => users.id),
  fileId: text("file_id").references(() => files.id),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  notes: text("notes").notNull().default(""),
  summary: text("summary").notNull(),
  lessonPlan: text("lesson_plan").notNull(),
  status: text("status", { enum: ["processing", "ready", "failed"] }).notNull(),
  ...timestamps,
}, (table) => [index("materials_class_idx").on(table.classId)]);

export const materialChunks = pgTable("material_chunks", {
  id: text("id").primaryKey(),
  materialId: text("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
});

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull().references(() => classes.id),
  studentId: text("student_id").notNull().references(() => users.id),
  attachmentId: text("attachment_id").references(() => files.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  aiCategory: text("ai_category").notNull(),
  knowledgePoint: text("knowledge_point").notNull(),
  urgency: text("urgency", { enum: ["normal", "attention"] }).notNull(),
  aiHint: text("ai_hint").notNull(),
  aiDraft: text("ai_draft").notNull(),
  status: text("status", { enum: ["sorting", "pending", "answered", "published"] }).notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  ...timestamps,
}, (table) => [index("questions_class_status_idx").on(table.classId, table.status)]);

export const answers = pgTable("answers", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  publishedAt: text("published_at").notNull(),
});

export const assignments = pgTable("assignments", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull().references(() => classes.id),
  teacherId: text("teacher_id").notNull().references(() => users.id),
  fileId: text("file_id").references(() => files.id),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  dueAt: text("due_at").notNull(),
  status: text("status", { enum: ["draft", "published", "closed"] }).notNull(),
  ...timestamps,
}, (table) => [index("assignments_class_idx").on(table.classId)]);

export const assignmentItems = pgTable("assignment_items", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  type: text("type", { enum: ["single", "short"] }).notNull(),
  optionsJson: text("options_json").notNull().default("[]"),
  answer: text("answer").notNull(),
  points: integer("points").notNull(),
  orderNo: integer("order_no").notNull(),
});

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => users.id),
  status: text("status", { enum: ["draft", "queued", "submitted", "graded", "revision"] }).notNull(),
  score: integer("score"),
  answersJson: text("answers_json").notNull().default("{}"),
  feedback: text("feedback").notNull().default(""),
  submittedAt: text("submitted_at"),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("submissions_student_idx").on(table.studentId)]);

export const videos = pgTable("videos", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull().references(() => classes.id),
  teacherId: text("teacher_id").notNull().references(() => users.id),
  fileId: text("file_id").references(() => files.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  knowledgePoint: text("knowledge_point").notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  status: text("status", { enum: ["processing", "ready", "failed"] }).notNull(),
  ...timestamps,
});

export const videoComments = pgTable("video_comments", {
  id: text("id").primaryKey(),
  videoId: text("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => users.id),
  anonymousLabel: text("anonymous_label").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("video_comments_video_idx").on(table.videoId)]);

export const videoShares = pgTable("video_shares", {
  id: text("id").primaryKey(),
  videoId: text("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").notNull().references(() => users.id),
  targetClassName: text("target_class_name").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("video_shares_video_idx").on(table.videoId)]);

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull().references(() => classes.id),
  authorId: text("author_id").notNull().references(() => users.id),
  videoId: text("video_id").references(() => videos.id),
  type: text("type", { enum: ["announcement", "resource", "question"] }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  visibility: text("visibility", { enum: ["class", "guardians"] }).notNull(),
  ...timestamps,
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull().references(() => classes.id),
  senderId: text("sender_id").notNull().references(() => users.id),
  receiverId: text("receiver_id").references(() => users.id),
  attachmentId: text("attachment_id").references(() => files.id),
  channel: text("channel", { enum: ["class", "student_teacher", "parent_teacher"] }).notNull(),
  content: text("content").notNull(),
  readAt: text("read_at"),
  ...timestamps,
}, (table) => [index("messages_class_idx").on(table.classId, table.createdAt)]);

export const observations = pgTable("observations", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull().references(() => classes.id),
  studentId: text("student_id").notNull().references(() => users.id),
  teacherId: text("teacher_id").notNull().references(() => users.id),
  category: text("category", { enum: ["attendance", "participation", "cooperation", "progress"] }).notNull(),
  content: text("content").notNull(),
  rating: integer("rating").notNull(),
  occurredAt: text("occurred_at").notNull(),
  visibleToGuardian: boolean("visible_to_guardian").notNull().default(true),
});

export const weeklyReports = pgTable("weekly_reports", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull().references(() => classes.id),
  studentId: text("student_id").notNull().references(() => users.id),
  weekStart: text("week_start").notNull(),
  summary: text("summary").notNull(),
  accomplishments: text("accomplishments").notNull(),
  needsHelp: text("needs_help").notNull(),
  familyActions: text("family_actions").notNull(),
  generatedBy: text("generated_by", { enum: ["ai", "demo"] }).notNull(),
  ...timestamps,
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull(),
  href: text("href").notNull(),
  readAt: text("read_at"),
  ...timestamps,
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: text("metadata").notNull().default("{}"),
  ...timestamps,
});

export const requestKeys = pgTable("request_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ...timestamps,
});
