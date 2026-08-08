# 乡课伴

面向乡村学校试点的教师、学生、家长三端协同平台。生产架构使用 Next.js、Netlify OpenNext、Netlify Database PostgreSQL、Netlify Blobs、Drizzle ORM 和 Auth.js。

## 演示账号

三个演示账号的密码均为 `demo1234`：

- 教师：`teacher`
- 学生：`student`
- 家长：`parent`

## 环境变量

生产环境必须配置以下秘密变量：

- `AUTH_SECRET`：Auth.js 长随机密钥。
- `SCHOOL_INVITE_CODE`：教师注册使用的学校邀请码。

Netlify Database 自动管理 `NETLIFY_DB_URL`，文件默认保存到站点级 Netlify Blobs，不需要额外密钥。百炼为可选能力；配置 `DASHSCOPE_API_KEY` 后使用指定模型，未配置时使用确定性演示结果。所有真实值只保存在 `.env.local` 或 Netlify 环境变量中。

如需切换阿里云 OSS，必须同时配置 `OSS_REGION`、`OSS_BUCKET`、`OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET`；只配置其中一部分会被视为错误配置。

## 本地开发

需要 Node.js 22、pnpm 11.16 和 Netlify 账号。首次运行：

```powershell
pnpm install
pnpm exec netlify login
pnpm exec netlify init
pnpm exec netlify database init
pnpm exec netlify database migrations apply
pnpm exec netlify dev
```

`netlify dev` 提供本地 PostgreSQL 和与生产一致的 Next.js 运行环境。生产上传默认使用 Netlify Blobs；本地开发在未配置 OSS 时使用 `data/uploads`。

## 数据库迁移

唯一 schema 位于 `src/db/schema.ts`，Netlify migration 位于 `netlify/database/migrations/`。

```powershell
pnpm db:generate
pnpm exec netlify database migrations apply
```

部署时 Netlify 会按名称顺序自动应用尚未执行的 migration。演示数据 migration 使用固定 ID 和 `ON CONFLICT DO NOTHING`，可重复部署。

## 验证

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

## 部署与回滚

```powershell
pnpm exec netlify deploy --build
pnpm exec netlify deploy --build --prod
```

回滚应用版本时，在 Netlify 的 Deploys 页面选择上一个稳定部署并发布。数据库 migration 采用向前修复策略；不要直接删除生产表或回退已应用 migration。
