INSERT INTO "schools" ("id", "name", "region", "created_at") VALUES
  ('school-qinghe', '青禾中心小学', '云南省青禾乡', '2026-08-08T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "users" ("id", "school_id", "username", "name", "password_hash", "role", "avatar_color", "created_at") VALUES
  ('user-teacher-li', 'school-qinghe', 'teacher', '李晓云', '$2b$10$zv3W1tgjyyfaqmVncyCme.2CjWuGUxAf2tYZhyhMe4mXVoOpuJXYa', 'teacher', 'green', '2026-08-08T08:00:00.000Z'),
  ('user-student-xiaohe', 'school-qinghe', 'student', '张小禾', '$2b$10$zv3W1tgjyyfaqmVncyCme.2CjWuGUxAf2tYZhyhMe4mXVoOpuJXYa', 'student', 'blue', '2026-08-08T08:00:00.000Z'),
  ('user-parent-zhang', 'school-qinghe', 'parent', '张桂兰', '$2b$10$zv3W1tgjyyfaqmVncyCme.2CjWuGUxAf2tYZhyhMe4mXVoOpuJXYa', 'parent', 'amber', '2026-08-08T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "classes" ("id", "school_id", "teacher_id", "name", "grade", "invite_code", "created_at") VALUES
  ('class-grade5-1', 'school-qinghe', 'user-teacher-li', '五年级一班', '五年级', 'QINGHE51', '2026-08-08T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "class_members" ("class_id", "user_id", "member_role", "joined_at") VALUES
  ('class-grade5-1', 'user-teacher-li', 'teacher', '2026-08-08T08:00:00.000Z'),
  ('class-grade5-1', 'user-student-xiaohe', 'student', '2026-08-08T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "guardian_links" ("guardian_id", "student_id", "relation", "created_at") VALUES
  ('user-parent-zhang', 'user-student-xiaohe', '母亲', '2026-08-08T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "materials" ("id", "class_id", "teacher_id", "file_id", "title", "subject", "notes", "summary", "lesson_plan", "status", "created_at") VALUES
  ('material-fractions', 'class-grade5-1', 'user-teacher-li', NULL, '分数的意义', '数学', '学生已经认识简单分数，课堂上使用一篮玉米和四张等大的纸片；重点观察学生是否真正理解“平均分”。', '借助分田地和分玉米的乡村生活情境，理解单位“1”、分数单位与分数表示。', E'目标：理解分数表示整体与部分的关系。\n导入：一块田平均分给4户。\n探究：比较1/4与2/4。\n练习：用身边物品描述分数。\n小结：分母表示平均分的份数，分子表示取的份数。', 'ready', '2026-08-07T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "material_chunks" ("id", "material_id", "chunk_index", "content") VALUES
  ('chunk-fraction-1', 'material-fractions', 0, '把一个整体平均分成若干份，表示其中一份或几份的数叫作分数。分母表示平均分成的份数，分子表示所取的份数。'),
  ('chunk-fraction-2', 'material-fractions', 1, '一块田平均分成4份，每份是这块田的四分之一，两份是四分之二。只有平均分时才能直接用分数表示。')
ON CONFLICT DO NOTHING;

INSERT INTO "questions" ("id", "class_id", "student_id", "attachment_id", "subject", "content", "ai_category", "knowledge_point", "urgency", "ai_hint", "ai_draft", "status", "is_public", "created_at") VALUES
  ('question-1', 'class-grade5-1', 'user-student-xiaohe', NULL, '数学', '为什么一块地分成四份，其中一份不一定是四分之一？', '概念理解', '平均分与单位1', 'normal', '先想一想：四份的大小必须满足什么条件？', '关键在“平均分”。只有四份同样大，每一份才是整体的四分之一。若大小不同，就不能直接用四分之一表示。', 'pending', false, '2026-08-07T08:00:00.000Z'),
  ('question-2', 'class-grade5-1', 'user-student-xiaohe', NULL, '科学', '凤仙花为什么总朝窗外长？', '现象解释', '植物的向光性', 'normal', '观察窗内外哪一侧的光更强，再想植物的茎会朝哪里生长。', '这是植物的向光性。靠近窗外的一侧光线更充足，茎会逐渐朝光源方向生长。可以每两天转动一次花盆继续观察。', 'answered', true, '2026-08-07T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "answers" ("id", "question_id", "teacher_id", "content", "published_at") VALUES
  ('answer-2', 'question-2', 'user-teacher-li', '这是凤仙花的向光性。把花盆转半圈并记录三天，你会看到新的弯曲方向。注意每天保持浇水量一致。', '2026-08-08T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "assignments" ("id", "class_id", "teacher_id", "file_id", "title", "subject", "description", "due_at", "status", "created_at") VALUES
  ('assignment-fractions', 'class-grade5-1', 'user-teacher-li', NULL, '分数的意义 · 课后巩固', '数学', '完成两道基础题和一道生活观察题。', '2026-08-09T08:00:00.000Z', 'published', '2026-08-07T08:00:00.000Z'),
  ('assignment-reading', 'class-grade5-1', 'user-teacher-li', NULL, '《桂花雨》阅读记录', '语文', '摘录最喜欢的一句话，并说明理由。', '2026-08-14T08:00:00.000Z', 'published', '2026-08-08T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "assignment_items" ("id", "assignment_id", "prompt", "type", "options_json", "answer", "points", "order_no") VALUES
  ('item-f-1', 'assignment-fractions', '把12个玉米平均分成4份，每份占总数的几分之几？', 'single', '["1/2","1/3","1/4","3/4"]', '1/4', 40, 1),
  ('item-f-2', 'assignment-fractions', '用一句话说明分母表示什么。', 'short', '[]', '平均分成的份数', 60, 2)
ON CONFLICT DO NOTHING;

INSERT INTO "submissions" ("id", "assignment_id", "student_id", "status", "score", "answers_json", "feedback", "submitted_at", "updated_at") VALUES
  ('submission-reading', 'assignment-reading', 'user-student-xiaohe', 'graded', 92, '{"note":"桂花盛开的时候，不说香飘十里，至少前后十几家邻居，没有不浸在桂花香里的。"}', '摘录准确，理由里再补充一种感官描写会更完整。', '2026-08-07T08:00:00.000Z', '2026-08-08T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "videos" ("id", "class_id", "teacher_id", "file_id", "title", "description", "knowledge_point", "duration_seconds", "status", "created_at") VALUES
  ('video-fraction', 'class-grade5-1', 'user-teacher-li', NULL, '5分钟弄懂单位“1”', '用一块梯田和一篮玉米解释整体与部分。', '单位1', 312, 'ready', '2026-08-07T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "video_comments" ("id", "video_id", "student_id", "anonymous_label", "content", "created_at") VALUES
  ('video-comment-1', 'video-fraction', 'user-student-xiaohe', '同学A', '用玉米分成四份的例子很容易看懂，我终于分清分子和分母了。', '2026-08-07T08:00:00.000Z'),
  ('video-comment-2', 'video-fraction', NULL, '同学B', '希望老师再讲一下不是平均分时为什么不能用分数。', '2026-08-08T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "posts" ("id", "class_id", "author_id", "video_id", "type", "title", "content", "visibility", "created_at") VALUES
  ('post-video', 'class-grade5-1', 'user-teacher-li', 'video-fraction', 'resource', '今晚先看这段分数微课', '看完后请在作业里写一个生活中的分数例子。', 'class', '2026-08-07T08:00:00.000Z'),
  ('post-notice', 'class-grade5-1', 'user-teacher-li', NULL, 'announcement', '周五带一片完整叶子', '科学课需要观察叶脉，请用旧报纸夹好带到学校。', 'guardians', '2026-08-08T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "messages" ("id", "class_id", "sender_id", "receiver_id", "attachment_id", "channel", "content", "read_at", "created_at") VALUES
  ('message-1', 'class-grade5-1', 'user-student-xiaohe', 'user-teacher-li', NULL, 'student_teacher', '李老师，我把分数练习改好了，明天可以再问您一道吗？', NULL, '2026-08-07T08:00:00.000Z'),
  ('message-2', 'class-grade5-1', 'user-teacher-li', 'user-parent-zhang', NULL, 'parent_teacher', '小禾本周课堂发言更主动了，周末可以让她用家里的物品讲一个分数例子。', '2026-08-08T08:00:00.000Z', '2026-08-07T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "observations" ("id", "class_id", "student_id", "teacher_id", "category", "content", "rating", "occurred_at", "visible_to_guardian") VALUES
  ('observation-1', 'class-grade5-1', 'user-student-xiaohe', 'user-teacher-li', 'participation', '数学课主动用玉米举例说明四分之一。', 4, '2026-08-07T08:00:00.000Z', true),
  ('observation-2', 'class-grade5-1', 'user-student-xiaohe', 'user-teacher-li', 'attendance', '本周全勤，课前准备及时。', 5, '2026-08-08T08:00:00.000Z', true)
ON CONFLICT DO NOTHING;

INSERT INTO "weekly_reports" ("id", "class_id", "student_id", "week_start", "summary", "accomplishments", "needs_help", "family_actions", "generated_by", "created_at") VALUES
  ('report-week-1', 'class-grade5-1', 'user-student-xiaohe', '2026-08-07', '小禾本周完成4项学习任务，数学课堂参与明显提升。', '按时完成阅读记录；能用生活例子解释四分之一；本周全勤。', '分子和分母的含义偶尔混淆，应用题读题速度偏慢。', '晚饭时请小禾用一盘食物讲一个分数例子；每天安排10分钟朗读。', 'demo', '2026-08-08T08:00:00.000Z')
ON CONFLICT DO NOTHING;

INSERT INTO "notifications" ("id", "user_id", "title", "body", "type", "href", "read_at", "created_at") VALUES
  ('notify-teacher', 'user-teacher-li', '有1个问题待处理', '小禾提交了关于平均分的问题。', 'question', '/teacher/questions', NULL, '2026-08-08T08:00:00.000Z'),
  ('notify-student', 'user-student-xiaohe', '科学问题已回复', '李老师回复了凤仙花向光性问题。', 'answer', '/student/questions', NULL, '2026-08-08T08:00:00.000Z'),
  ('notify-parent', 'user-parent-zhang', '本周学情简报已更新', '小禾本周课堂参与有明显进步。', 'report', '/parent/reports', NULL, '2026-08-08T08:00:00.000Z')
ON CONFLICT DO NOTHING;
