# 乡课伴 Netlify 正式试点部署 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将乡课伴迁移到 Netlify OpenNext、Netlify Database PostgreSQL 和阿里云 OSS，并完成可持续保存数据的生产部署。

**Architecture:** 应用统一使用 PostgreSQL schema，通过 `drizzle-orm/netlify-db` 连接 Netlify Database；Netlify 自动应用 `netlify/database/migrations` 中的 SQL。生产上传强制使用 OSS，教师使用学校邀请码注册，家长使用一次性学生绑定码注册。

**Tech Stack:** Next.js 16.3、TypeScript、Netlify OpenNext、Netlify Database、Drizzle ORM、Auth.js、阿里云 OSS、Vitest、Playwright。

---

## 文件结构

- `src/db/schema.ts`：唯一 PostgreSQL schema。
- `src/lib/db.ts`：Netlify Database Drizzle client，不再负责迁移或 seed。
- `src/lib/db-helpers.ts`：统一单行查询辅助函数，替代 SQLite `.get()`。
- `src/lib/runtime-config.ts`：生产环境必需变量校验。
- `src/lib/guardian-codes.ts`：家长绑定码生成、摘要和有效期判断。
- `src/app/api/guardian-codes/route.ts`：学生本人或教师生成绑定码。
- `netlify/database/migrations/`：Netlify 自动应用的 schema 与演示数据 SQL。
- `netlify.toml`：构建、Node 和函数配置。
- `src/**/*.test.ts`：单元与 PostgreSQL 集成测试。

### Task 1: 固定 Netlify 运行依赖与生产配置契约

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Create: `src/lib/runtime-config.test.ts`
- Create: `src/lib/runtime-config.ts`

- [ ] **Step 1: 写生产配置失败测试**

```ts
import { afterEach, describe, expect, test } from "vitest";

import { getRuntimeConfig } from "@/lib/runtime-config";

const keys = ["AUTH_SECRET", "SCHOOL_INVITE_CODE", "OSS_REGION", "OSS_BUCKET", "OSS_ACCESS_KEY_ID", "OSS_ACCESS_KEY_SECRET"] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) original[key] === undefined ? delete process.env[key] : process.env[key] = original[key];
});

describe("getRuntimeConfig", () => {
  test("rejects missing production secrets", () => {
    for (const key of keys) delete process.env[key];
    expect(() => getRuntimeConfig("production")).toThrow(/AUTH_SECRET/);
  });

  test("allows optional DashScope configuration", () => {
    for (const key of keys) process.env[key] = `test-${key.toLowerCase()}`;
    expect(getRuntimeConfig("production").dashScopeApiKey).toBeUndefined();
  });
});
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `pnpm test src/lib/runtime-config.test.ts`

Expected: FAIL，因为 `@/lib/runtime-config` 不存在。

- [ ] **Step 3: 安装 Netlify Database 依赖并实现配置读取**

Run:

```bash
pnpm add @netlify/database drizzle-orm@beta
pnpm add -D @netlify/database-dev drizzle-kit@beta netlify-cli
```

实现 `getRuntimeConfig(mode)`：开发环境允许本地存储，生产环境聚合缺失变量后抛出不包含任何秘密值的错误。更新 `.env.example`，新增 `SCHOOL_INVITE_CODE`，移除 `DATABASE_PATH`，保留百炼与 OSS 变量。

- [ ] **Step 4: 运行测试并确认 GREEN**

Run: `pnpm test src/lib/runtime-config.test.ts`

Expected: 2 tests passed。

- [ ] **Step 5: 提交**

```bash
git add package.json pnpm-lock.yaml .env.example src/lib/runtime-config.ts src/lib/runtime-config.test.ts
git commit -m "feat: define Netlify production configuration"
```

### Task 2: 将 schema 迁移为 PostgreSQL

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/schema.test.ts`
- Modify: `drizzle.config.ts`

- [ ] **Step 1: 写 PostgreSQL schema 测试**

```ts
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, test } from "vitest";

import { guardianLinkCodes, users } from "@/db/schema";

describe("PostgreSQL schema", () => {
  test("defines users as a PostgreSQL table", () => {
    expect(getTableConfig(users).name).toBe("users");
  });

  test("defines one-time guardian link codes", () => {
    const config = getTableConfig(guardianLinkCodes);
    expect(config.columns.map((column) => column.name)).toEqual(expect.arrayContaining(["student_id", "code_hash", "expires_at", "used_at"]));
  });
});
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `pnpm test src/db/schema.test.ts`

Expected: FAIL，因为 schema 仍为 SQLite 且 `guardianLinkCodes` 不存在。

- [ ] **Step 3: 改写 schema**

将 `sqliteTable`、SQLite integer boolean 和复合主键改为 `pgTable`、`boolean`、`integer`、`text`、`primaryKey`。保留全部现有表名与外键，新增：

```ts
export const guardianLinkCodes = pgTable("guardian_link_codes", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
});
```

将 `drizzle.config.ts` 改为 PostgreSQL dialect，schema 指向现有文件，输出目录为 `netlify/database/migrations`。

- [ ] **Step 4: 运行测试并确认 GREEN**

Run: `pnpm test src/db/schema.test.ts`

Expected: 2 tests passed。

- [ ] **Step 5: 提交**

```bash
git add src/db/schema.ts src/db/schema.test.ts drizzle.config.ts
git commit -m "feat: migrate schema to PostgreSQL"
```

### Task 3: 建立 Netlify Database client 与单行查询接口

**Files:**
- Modify: `src/lib/db.ts`
- Create: `src/lib/db-helpers.test.ts`
- Create: `src/lib/db-helpers.ts`

- [ ] **Step 1: 写单行查询辅助函数测试**

```ts
import { expect, test } from "vitest";

import { first, firstOrNull } from "@/lib/db-helpers";

test("first returns the first row", () => {
  expect(first([{ id: "1" }, { id: "2" }])).toEqual({ id: "1" });
});

test("firstOrNull returns null for an empty result", () => {
  expect(firstOrNull([])).toBeNull();
});
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `pnpm test src/lib/db-helpers.test.ts`

Expected: FAIL，因为 helper 不存在。

- [ ] **Step 3: 实现 helper 与数据库 client**

```ts
// src/lib/db-helpers.ts
export function first<T>(rows: T[]): T | undefined { return rows[0]; }
export function firstOrNull<T>(rows: T[]): T | null { return rows[0] ?? null; }
```

```ts
// src/lib/db.ts
import "server-only";
import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "@/db/schema";

export const db = drizzle({ schema });
export const dbReady = Promise.resolve();
```

移除 `node:sqlite`、运行时 migration、自动 seed 和全局 SQLite cache。

- [ ] **Step 4: 运行测试并确认 GREEN**

Run: `pnpm test src/lib/db-helpers.test.ts`

Expected: 2 tests passed。

- [ ] **Step 5: 提交**

```bash
git add src/lib/db.ts src/lib/db-helpers.ts src/lib/db-helpers.test.ts
git commit -m "feat: connect Drizzle to Netlify Database"
```

### Task 4: 迁移所有业务查询与事务

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/lib/dal.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/auth.ts`
- Modify: `src/app/api/**/*.ts`
- Test: existing `src/**/*.test.ts`

- [ ] **Step 1: 增加静态回归测试**

在 `src/lib/postgres-compat.test.ts` 读取 `src/` 下数据库调用文件，断言除测试 fixture 外不存在 `.get()`、`.all()`、`.run()` 和 `node:sqlite`。

- [ ] **Step 2: 运行测试并确认 RED**

Run: `pnpm test src/lib/postgres-compat.test.ts`

Expected: FAIL，并列出现有 SQLite 专用调用。

- [ ] **Step 3: 逐文件迁移查询**

- `await query.get()` 改为 `(await query)[0]` 或 `firstOrNull(await query)`。
- `await query.all()` 改为 `await query`。
- insert/update/delete 的 `.run()` 改为直接 `await` query。
- 需要插入结果时使用 `.returning()`。
- 保留现有 `db.transaction(async (tx) => ...)` 原子边界。
- 所有权限过滤条件、学校和班级约束保持不变。

- [ ] **Step 4: 运行兼容与现有单元测试**

Run: `pnpm test`

Expected: PostgreSQL 兼容测试和现有单元测试全部通过。

- [ ] **Step 5: 提交**

```bash
git add src
git commit -m "refactor: make application queries PostgreSQL compatible"
```

### Task 5: 生成迁移与幂等演示数据

**Files:**
- Create: `netlify/database/migrations/20260808090000_create_xiangkeban.sql`
- Create: `netlify/database/migrations/20260808091000_seed_demo_data.sql`
- Create: `src/db/migrations.integration.test.ts`

- [ ] **Step 1: 写数据库迁移集成测试**

使用 `@netlify/database-dev` 启动临时 PostgreSQL，连续两次调用 `applyMigrations("./netlify/database/migrations")`，断言 `users` 表只有三个固定演示账号，且 `guardian_link_codes` 表存在。

- [ ] **Step 2: 运行测试并确认 RED**

Run: `pnpm test src/db/migrations.integration.test.ts`

Expected: FAIL，因为 PostgreSQL migration 尚不存在。

- [ ] **Step 3: 生成结构 migration**

Run: `pnpm db:generate`

检查 SQL 包含所有现有表、外键、唯一约束、索引和 `guardian_link_codes`。

- [ ] **Step 4: 编写演示数据 migration**

将当前 `src/lib/db.ts` 中的演示学校、用户、班级、作业、问题、视频、消息、表现和周报数据转成 PostgreSQL `INSERT ... ON CONFLICT DO NOTHING`。密码 hash 保持与 `demo1234` 匹配，所有固定 ID 保持不变。

- [ ] **Step 5: 运行集成测试并确认 GREEN**

Run: `pnpm test src/db/migrations.integration.test.ts`

Expected: migration 可重复应用，教师、学生、家长各一条。

- [ ] **Step 6: 提交**

```bash
git add netlify/database/migrations src/db/migrations.integration.test.ts
git commit -m "feat: add Netlify database migrations and demo seed"
```

### Task 6: 实现学校邀请码和一次性家长绑定码

**Files:**
- Create: `src/lib/guardian-codes.test.ts`
- Create: `src/lib/guardian-codes.ts`
- Create: `src/app/api/guardian-codes/route.ts`
- Modify: `src/app/api/register/route.ts`
- Modify: `src/components/register-form.tsx`
- Modify: `src/app/teacher/students/page.tsx`

- [ ] **Step 1: 写绑定码领域测试**

测试 `createGuardianCode()` 返回便于人工输入的明文码和 SHA-256 摘要；`isGuardianCodeUsable()` 拒绝过期或已使用记录；相同明文生成相同摘要以支持数据库查询。

- [ ] **Step 2: 运行测试并确认 RED**

Run: `pnpm test src/lib/guardian-codes.test.ts`

Expected: FAIL，因为领域函数不存在。

- [ ] **Step 3: 实现领域函数**

使用 `randomBytes` 生成 10 位去歧义大写码，使用 `createHash("sha256")` 摘要，默认有效期 7 天。函数只返回业务值，不读写数据库。

- [ ] **Step 4: 运行领域测试并确认 GREEN**

Run: `pnpm test src/lib/guardian-codes.test.ts`

Expected: 全部通过。

- [ ] **Step 5: 修改注册 API 与表单**

- 教师 payload 新增 `schoolInviteCode`，与 `SCHOOL_INVITE_CODE` 做常量时间摘要比较。
- 学生创建成功时插入一条绑定码摘要，并仅在注册成功响应中返回一次明文码。
- 家长 payload 新增 `guardianCode`，事务内锁定并消费有效记录，然后创建 guardian link。
- 注册表单按角色显示对应邀请码字段，并展示学生注册后的一次性家长绑定码。
- 教师学生档案添加“生成家长绑定码”命令，API 只允许该班教师或学生本人调用。
- 注册和绑定操作写入审计日志。

- [ ] **Step 6: 添加 API 集成测试并运行**

Run: `pnpm test src/app/api/register/route.test.ts src/app/api/guardian-codes/route.test.ts`

Expected: 错误学校邀请码被拒绝；绑定码只能成功消费一次；越权生成被拒绝。

- [ ] **Step 7: 提交**

```bash
git add src
git commit -m "feat: secure teacher and guardian registration"
```

### Task 7: 强制生产 OSS 并添加 Netlify 配置

**Files:**
- Modify: `src/lib/storage.ts`
- Create: `src/lib/storage.test.ts`
- Create: `netlify.toml`
- Modify: `README.md`

- [ ] **Step 1: 写生产存储配置测试**

测试生产环境缺少任一 OSS 变量时 `getStorageProvider()` 抛出 `Storage is not configured`，开发环境仍返回本地 provider，完整变量返回 OSS provider。

- [ ] **Step 2: 运行测试并确认 RED**

Run: `pnpm test src/lib/storage.test.ts`

Expected: FAIL，因为生产环境当前会静默退回本地目录。

- [ ] **Step 3: 实现最小生产保护**

让 `getStorageProvider()` 在 `NODE_ENV === "production"` 且 OSS 未完整配置时抛出受控错误。上传 Route Handler 捕获该错误并返回 `503`，不得写入文件记录。

- [ ] **Step 4: 添加 Netlify 配置**

```toml
[build]
  command = "pnpm build"

[build.environment]
  NODE_VERSION = "22"
  PNPM_VERSION = "11.16.0"
```

README 记录 `netlify database init`、`netlify dev`、本地 migration、环境变量和部署命令。

- [ ] **Step 5: 运行存储测试并确认 GREEN**

Run: `pnpm test src/lib/storage.test.ts`

Expected: 全部通过。

- [ ] **Step 6: 提交**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts netlify.toml README.md
git commit -m "feat: configure production storage and Netlify runtime"
```

### Task 8: 完整本地验证

**Files:**
- Modify as required by failures only

- [ ] **Step 1: 应用本地数据库迁移**

Run: `pnpm exec netlify database migrations apply`

Expected: schema 与 seed migrations applied。

- [ ] **Step 2: 运行静态与单元验证**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected: 所有命令 exit 0，无 TypeScript、ESLint、测试或构建失败。

- [ ] **Step 3: 启动 Netlify 本地环境并运行 E2E**

Run: `pnpm exec netlify dev`

在另一进程运行：`pnpm test:e2e`

Expected: 三端登录、问题、作业、消息和越权测试全部通过。

- [ ] **Step 4: 浏览器视觉验收**

检查桌面 1081×898 与手机 390×844 的登录、注册、教师学生档案和三端首页；确认无错误 overlay、无相关 console error、无横向溢出。

- [ ] **Step 5: 提交验证修复**

```bash
git add src package.json pnpm-lock.yaml netlify.toml README.md
git commit -m "fix: complete Netlify deployment validation"
```

### Task 9: 连接 Netlify 并生产部署

**Files:**
- Create or Modify: `.netlify/state.json`（保持 gitignored）

- [ ] **Step 1: 登录并连接站点**

Run: `pnpm exec netlify login`

需要账号持有人在 Netlify 页面确认 OAuth。随后运行 `pnpm exec netlify init` 或连接已创建站点。

- [ ] **Step 2: 初始化 Netlify Database**

Run: `pnpm exec netlify database init`

选择现有 Drizzle schema 和自动 migration workflow。确认站点 Database 页面显示已创建数据库。

- [ ] **Step 3: 配置生产变量**

通过 Netlify UI 或 `netlify env:set` 配置 `AUTH_SECRET`、`SCHOOL_INVITE_CODE` 和六项 OSS/百炼变量。命令与日志不得回显秘密值。

- [ ] **Step 4: 创建 Deploy Preview**

Run: `pnpm exec netlify deploy --build`

Expected: 获得 preview URL，迁移自动应用到数据库分支，三个演示账号可登录。

- [ ] **Step 5: 发布生产**

Run: `pnpm exec netlify deploy --build --prod`

Expected: 获得稳定 production URL，生产 migration 成功。

### Task 10: 生产验收与交付

**Files:**
- Modify: `README.md` only if actual deployment details require documentation

- [ ] **Step 1: 验证三端登录**

在 production URL 分别使用 `teacher`、`student`、`parent` 和 `demo1234` 登录，确认角色路由正确且无越权。

- [ ] **Step 2: 验证持久化闭环**

教师创建测试作业，学生提交，教师回复问题，家长读取周报。重新打开 production URL 后确认新增记录仍存在。

- [ ] **Step 3: 验证 OSS**

上传一张非敏感测试图片，确认数据库文件记录和 OSS 下载均成功。

- [ ] **Step 4: 检查生产日志与页面**

检查 Netlify Functions 日志无秘密泄露、数据库错误或 OSS 错误；浏览器 console 无相关错误；页面无 Next.js error overlay。

- [ ] **Step 5: 记录交付信息**

在 README 记录公开 URL、部署命令、数据库 migration 流程和回滚步骤，不记录任何秘密。

- [ ] **Step 6: 最终验证**

依次运行 `pnpm typecheck`、`pnpm lint`、`pnpm test` 和 `pnpm build`，确认每条命令 exit 0 后报告 production URL、测试数量和剩余合规事项。
