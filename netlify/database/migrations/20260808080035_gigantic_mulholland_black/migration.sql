CREATE TABLE "answers" (
	"id" text PRIMARY KEY,
	"question_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"content" text NOT NULL,
	"published_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_items" (
	"id" text PRIMARY KEY,
	"assignment_id" text NOT NULL,
	"prompt" text NOT NULL,
	"type" text NOT NULL,
	"options_json" text DEFAULT '[]' NOT NULL,
	"answer" text NOT NULL,
	"points" integer NOT NULL,
	"order_no" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" text PRIMARY KEY,
	"class_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"file_id" text,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"due_at" text NOT NULL,
	"status" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"metadata" text DEFAULT '{}' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_members" (
	"class_id" text,
	"user_id" text,
	"member_role" text NOT NULL,
	"joined_at" text NOT NULL,
	CONSTRAINT "class_members_pkey" PRIMARY KEY("class_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" text PRIMARY KEY,
	"school_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"name" text NOT NULL,
	"grade" text NOT NULL,
	"invite_code" text NOT NULL UNIQUE,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" text PRIMARY KEY,
	"school_id" text NOT NULL,
	"class_id" text,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"storage_key" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardian_link_codes" (
	"id" text PRIMARY KEY,
	"student_id" text NOT NULL,
	"code_hash" text NOT NULL UNIQUE,
	"expires_at" text NOT NULL,
	"used_at" text,
	"created_by" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardian_links" (
	"guardian_id" text,
	"student_id" text,
	"relation" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "guardian_links_pkey" PRIMARY KEY("guardian_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "material_chunks" (
	"id" text PRIMARY KEY,
	"material_id" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" text PRIMARY KEY,
	"class_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"file_id" text,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"summary" text NOT NULL,
	"lesson_plan" text NOT NULL,
	"status" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY,
	"class_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"receiver_id" text,
	"attachment_id" text,
	"channel" text NOT NULL,
	"content" text NOT NULL,
	"read_at" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" text NOT NULL,
	"href" text NOT NULL,
	"read_at" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"id" text PRIMARY KEY,
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"rating" integer NOT NULL,
	"occurred_at" text NOT NULL,
	"visible_to_guardian" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY,
	"class_id" text NOT NULL,
	"author_id" text NOT NULL,
	"video_id" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"visibility" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY,
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"attachment_id" text,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"ai_category" text NOT NULL,
	"knowledge_point" text NOT NULL,
	"urgency" text NOT NULL,
	"ai_hint" text NOT NULL,
	"ai_draft" text NOT NULL,
	"status" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_keys" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" text PRIMARY KEY,
	"assignment_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" text NOT NULL,
	"score" integer,
	"answers_json" text DEFAULT '{}' NOT NULL,
	"feedback" text DEFAULT '' NOT NULL,
	"submitted_at" text,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"school_id" text NOT NULL,
	"username" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"avatar_color" text DEFAULT 'green' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_comments" (
	"id" text PRIMARY KEY,
	"video_id" text NOT NULL,
	"student_id" text,
	"anonymous_label" text NOT NULL,
	"content" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_shares" (
	"id" text PRIMARY KEY,
	"video_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"target_class_name" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" text PRIMARY KEY,
	"class_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"file_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"knowledge_point" text NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_reports" (
	"id" text PRIMARY KEY,
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"week_start" text NOT NULL,
	"summary" text NOT NULL,
	"accomplishments" text NOT NULL,
	"needs_help" text NOT NULL,
	"family_actions" text NOT NULL,
	"generated_by" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "assignments_class_idx" ON "assignments" ("class_id");--> statement-breakpoint
CREATE INDEX "classes_school_idx" ON "classes" ("school_id");--> statement-breakpoint
CREATE INDEX "materials_class_idx" ON "materials" ("class_id");--> statement-breakpoint
CREATE INDEX "messages_class_idx" ON "messages" ("class_id","created_at");--> statement-breakpoint
CREATE INDEX "questions_class_status_idx" ON "questions" ("class_id","status");--> statement-breakpoint
CREATE INDEX "submissions_student_idx" ON "submissions" ("student_id");--> statement-breakpoint
CREATE INDEX "users_school_idx" ON "users" ("school_id");--> statement-breakpoint
CREATE INDEX "video_comments_video_idx" ON "video_comments" ("video_id");--> statement-breakpoint
CREATE INDEX "video_shares_video_idx" ON "video_shares" ("video_id");--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_teacher_id_users_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "assignment_items" ADD CONSTRAINT "assignment_items_assignment_id_assignments_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_class_id_classes_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id");--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacher_id_users_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_file_id_files_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "class_members" ADD CONSTRAINT "class_members_class_id_classes_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "class_members" ADD CONSTRAINT "class_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_schools_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id");--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_users_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_school_id_schools_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id");--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_class_id_classes_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id");--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "guardian_link_codes" ADD CONSTRAINT "guardian_link_codes_student_id_users_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guardian_link_codes" ADD CONSTRAINT "guardian_link_codes_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_guardian_id_users_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_student_id_users_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_chunks" ADD CONSTRAINT "material_chunks_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_class_id_classes_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id");--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_teacher_id_users_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_file_id_files_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_class_id_classes_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_attachment_id_files_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "files"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_class_id_classes_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id");--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_student_id_users_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_teacher_id_users_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_class_id_classes_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_video_id_videos_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id");--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_class_id_classes_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id");--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_student_id_users_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_attachment_id_files_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "files"("id");--> statement-breakpoint
ALTER TABLE "request_keys" ADD CONSTRAINT "request_keys_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_assignments_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_users_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id");--> statement-breakpoint
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_video_id_videos_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_student_id_users_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "video_shares" ADD CONSTRAINT "video_shares_video_id_videos_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "video_shares" ADD CONSTRAINT "video_shares_teacher_id_users_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_class_id_classes_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id");--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_teacher_id_users_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_file_id_files_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id");--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_class_id_classes_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id");--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_student_id_users_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id");