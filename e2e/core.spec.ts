import { expect, test, type Page } from "@playwright/test";

async function enter(page: Page, role: "教师端" | "学生端" | "家长端") {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(role) }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("密码").fill("demo1234");
  await page.getByRole("button", { name: "登录" }).click();
  const path = role === "教师端" ? "teacher" : role === "学生端" ? "student" : "parent";
  await expect(page).toHaveURL(new RegExp(`/${path}$`));
}

test("student can ask a question and cannot open teacher pages", async ({ page }) => {
  await enter(page, "学生端");
  await expect(page.getByRole("heading", { name: /今天好/ })).toBeVisible();
  await page.goto("/student/questions");
  await page.getByLabel("我哪里没弄明白").fill("为什么平均分以后分母表示总份数？");
  await page.getByRole("button", { name: "提交给老师" }).click();
  await expect(page.getByRole("status")).toContainText("已提交", { timeout: 15_000 });
  await page.goto("/teacher/questions");
  await expect(page).toHaveURL(/\/student/);
});

test("teacher can review AI-organized questions", async ({ page }) => {
  await enter(page, "教师端");
  await expect(page.getByRole("heading", { name: /老师/ })).toBeVisible();
  await page.goto("/teacher/questions");
  await expect(page.getByRole("heading", { name: "学生问题" })).toBeVisible();
  await expect(page.getByText("AI 回复草稿", { exact: false }).first()).toBeVisible();
});

test("teacher dashboard metrics link to their detail areas", async ({ page }) => {
  await enter(page, "教师端");
  await expect(page.locator('.stat-link')).toHaveCount(4);
  await expect(page.getByRole("link", { name: /待处理问题/ })).toHaveAttribute("href", "/teacher/questions");
  await expect(page.getByRole("link", { name: /平均提交率/ })).toHaveAttribute("href", "/teacher/assignments");
  await expect(page.getByRole("link", { name: /薄弱知识点/ })).toHaveAttribute("href", "/teacher/students");
  await expect(page.getByRole("link", { name: /未读提醒/ })).toHaveAttribute("href", "/teacher/messages");
});

test("student dashboard and growth metrics link to their detail areas", async ({ page }) => {
  await enter(page, "学生端");
  await expect(page.locator(".stat-link")).toHaveCount(4);
  await expect(page.getByRole("link", { name: /待完成作业/ })).toHaveAttribute("href", "/student/assignments");
  await expect(page.getByRole("link", { name: /老师新回复/ })).toHaveAttribute("href", "/student/questions");
  await expect(page.getByRole("link", { name: /本周已完成/ })).toHaveAttribute("href", "/student/growth");
  await expect(page.getByRole("link", { name: /课堂资料.*查看详情/ })).toHaveAttribute("href", "/student/learn");
  await page.goto("/student/growth");
  await expect(page.locator(".stat-link")).toHaveCount(4);
  await expect(page.getByRole("link", { name: /已完成任务/ })).toHaveAttribute("href", "/student/assignments");
  await expect(page.getByRole("link", { name: /待巩固知识点/ })).toHaveAttribute("href", "/student/growth#mistakes");
  await expect(page.getByRole("link", { name: /收到回复/ })).toHaveAttribute("href", "/student/questions");
});

test("teacher can switch demo classes and open editable work records", async ({ page }) => {
  await enter(page, "教师端");
  await page.getByRole("button", { name: "切换班级" }).click();
  await page.getByText("四年级二班", { exact: true }).click();
  await expect(page.getByRole("status")).toContainText("演示视图");
  await page.goto("/teacher/materials");
  await page.locator(".material-record summary").first().click();
  await expect(page.getByText("老师上次填写的备课要求", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "修改备课" }).first()).toBeVisible();
  await page.goto("/teacher/assignments");
  await page.locator(".assignment-link").first().click();
  await expect(page.getByRole("heading", { name: "完成情况" })).toBeVisible();
  await page.goto("/teacher/videos");
  await page.locator(".assignment-link").first().click();
  await expect(page.getByRole("heading", { name: "同学评论" })).toBeVisible();
  await page.goto("/teacher/class-group");
  await expect(page.getByRole("heading", { name: "班级群" })).toBeVisible();
  await page.getByRole("button", { name: /群成员/ }).click();
  await expect(page.getByText("群成员", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "与张小禾私聊" }).click();
  await expect(page.getByRole("heading", { name: "与张小禾私聊" })).toBeVisible();
  await expect(page.getByText(/我把分数练习改好了/)).toBeVisible();
  await expect(page.getByTitle("发送照片")).toBeVisible();
  await expect(page.getByTitle("发送文件")).toBeVisible();
});

test("student uses the shared class group, can privately message a classmate, and return from assignment detail", async ({ page, request }) => {
  const classmateName = `同班同学${Date.now()}`;
  const registration = await request.post("/api/register", { data: { role: "student", name: classmateName, username: `classmate_${Date.now()}`, password: "trial1234", inviteCode: "QINGHE51" } });
  expect(registration.status()).toBe(201);
  await enter(page, "学生端");
  await expect(page.getByRole("button", { name: "切换班级" })).toHaveCount(0);
  await page.goto("/student/assignments/assignment-fractions");
  await expect(page.getByRole("link", { name: "返回作业" })).toHaveAttribute("href", "/student/assignments");
  await page.goto("/student/messages");
  await expect(page.getByRole("heading", { name: "班级群" })).toBeVisible();
  await expect(page.getByText("今晚先看这段分数微课", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /群成员/ }).click();
  await expect(page.locator(".group-members-scroll")).toHaveCSS("overflow-y", "auto");
  await page.getByRole("button", { name: `与${classmateName}私聊` }).click();
  await expect(page.getByRole("heading", { name: `与${classmateName}私聊` })).toBeVisible();
  await expect(page.getByText("群成员", { exact: true })).toBeVisible();
  await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles({ name: "学习记录.txt", mimeType: "text/plain", buffer: Buffer.from("fraction notes") });
  await expect(page.locator(".group-selected-file")).toContainText("学习记录.txt");
  await page.getByRole("button", { name: "发送私聊" }).click();
  await expect(page.getByRole("link", { name: /学习记录.txt/ })).toBeVisible();
  await page.getByRole("button", { name: "与李晓云私聊" }).click();
  await expect(page.getByRole("heading", { name: "与李晓云私聊" })).toBeVisible();
  await expect(page.getByText(/我把分数练习改好了/)).toBeVisible();
  await expect(page.getByTitle("发送照片")).toBeVisible();
  await expect(page.getByTitle("发送文件")).toBeVisible();
});

test("registration adapts to each role", async ({ page, request }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "创建乡课伴账号" })).toBeVisible();
  await page.getByRole("button", { name: "学生" }).click();
  await expect(page.getByText("班级邀请码", { exact: true })).toBeVisible();
  const username = `trial_${Date.now()}`;
  const response = await request.post("/api/register", { data: { role: "student", name: "试点学生", username, password: "trial1234", inviteCode: "QINGHE51" } });
  expect(response.status()).toBe(201);
});

test("parent sees only linked child's overview", async ({ page }) => {
  await enter(page, "家长端");
  await expect(page.getByRole("heading", { name: "张小禾的学习概览" })).toBeVisible();
  await expect(page.getByText("您以母亲身份查看")).toBeVisible();
  await expect(page.getByRole("button", { name: "切换班级" })).toHaveCount(0);
  await expect(page.getByText("不使用星级排名")).toBeVisible();
  await expect(page.getByText(/★/)).toHaveCount(0);
  const weeklyReportLink = page.getByRole("link", { name: "查看本周完整学情简报" });
  await expect(weeklyReportLink).toHaveAttribute("href", "/parent/reports");
  await weeklyReportLink.click();
  await expect(page).toHaveURL(/\/parent\/reports/);
  await page.goto("/parent");
  const speak = page.getByRole("button", { name: "开始语音播报" });
  await speak.click();
  await expect(page.getByRole("button", { name: "暂停语音播报" })).toBeVisible();
  await page.goto("/student");
  await expect(page).toHaveURL(/\/parent/);
});
