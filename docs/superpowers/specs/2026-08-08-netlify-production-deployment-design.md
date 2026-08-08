# 乡课伴 Netlify 正式试点部署设计

## 目标

将现有乡课伴 Next.js 应用部署到 Netlify，并确保账号、班级、作业、消息等数据长期保存，课件、图片、语音和视频可靠存储。部署后保留三类演示账号，同时支持受控的教师、学生和家长注册。

## 部署架构

- Netlify 使用 OpenNext adapter 运行 Next.js App Router、服务端渲染、Route Handlers、Auth.js 和图片优化。
- Netlify Database 提供托管 PostgreSQL。生产部署使用主数据库，Deploy Preview 使用隔离的数据库分支。
- 应用安装 `@netlify/database` 以启用数据库自动预配，并使用 Drizzle ORM 的 PostgreSQL schema 与查询接口。
- SQL 迁移放在 `netlify/database/migrations/`，由 Netlify 在生产部署和预览部署的正确生命周期阶段自动应用。
- 本地开发改用 `netlify dev` 提供的 PostgreSQL 兼容数据库，避免本地 SQLite 与线上 PostgreSQL 行为分叉。
- 阿里云 OSS 保存所有用户上传内容。生产环境不允许退回到临时本地文件系统。
- 阿里云百炼保持可选；没有密钥时使用确定性的演示 AI Provider。

## 数据库迁移

- 将 `sqliteTable` schema 改为 PostgreSQL `pgTable` schema，保留现有表名、主键和外键关系。
- 时间字段首轮继续使用 ISO 文本，JSON 内容首轮继续使用文本，减少与现有业务代码的行为差异。
- 布尔字段使用 PostgreSQL `boolean`，数字和排序字段使用 `integer`。
- 将 SQLite 专用的 `.get()`、`.all()` 和 `.run()` 调用改为数据库无关的 Promise 查询和 `returning()` 结果。
- 保留事务边界，确保作业发布、问题回复、提交批改、消息通知和注册流程保持原子性。
- 移除应用启动时自动执行迁移的逻辑。迁移由 Netlify lifecycle 管理，演示数据通过独立、幂等的 SQL 数据迁移创建。
- seed 数据迁移使用 `ON CONFLICT DO NOTHING`，只在演示记录不存在时插入青禾中心小学、五年级一班及教师、学生、家长演示数据，不覆盖真实数据。

## 注册与绑定安全

- 教师注册必须提交学校邀请码。邀请码通过服务端 `SCHOOL_INVITE_CODE` 环境变量配置，不进入客户端包或数据库记录。
- 学生注册继续使用唯一的班级邀请码。
- 新学生注册时生成一次性家长绑定码。教师可在学生档案中重新生成绑定码。
- 家长注册必须提交学生账号和有效绑定码。绑定成功后绑定码立即失效，不能重复使用。
- 家长绑定码保存在 `guardian_link_codes` 表中，只保存 SHA-256 摘要，并记录有效期、使用时间和创建人。
- 注册、绑定码生成和绑定成功写入审计日志。所有错误只返回必要信息，避免泄露学生或账号是否存在的额外细节。

## 存储与配置

- 开发环境可继续使用本地上传目录，便于无 OSS 凭据时调试页面。
- Netlify 生产环境缺少任意 OSS 配置时，上传接口返回明确的服务未配置错误，不写入数据库。
- 文件先上传 OSS，成功后再创建数据库记录。数据库写入失败时记录可追踪错误，后续通过存储键清理孤立对象。
- 必需的生产变量为 `AUTH_SECRET`、`SCHOOL_INVITE_CODE`、`OSS_REGION`、`OSS_BUCKET`、`OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET`。
- `NETLIFY_DB_URL` 由 Netlify Database 自动提供。百炼变量保持可选。
- 所有密钥只配置在 Netlify 环境变量中，不提交到仓库，也不使用 `NEXT_PUBLIC_` 前缀。

## Netlify 配置

- 使用 Node.js 22 和 pnpm 11.16.0。
- Netlify 构建命令为 `pnpm build`，OpenNext 自动识别 Next.js，无需旧版 Next.js plugin。
- `netlify.toml` 只固定构建命令、Node 版本和必要的函数配置，不硬编码站点 ID 或秘密。
- 数据库迁移由 Netlify Database 自动执行；本地使用 `netlify database migrations apply`。
- 部署采用 Netlify CLI 连接当前工作目录。首次生产部署完成后保留站点 URL，后续可连接 Git 仓库实现自动部署。

## 错误处理

- 启动或请求阶段缺少数据库连接时返回可诊断的服务端错误，不退回 SQLite。
- 数据库暂时不可用时，写接口返回 `503`，客户端保留现有草稿或待同步队列。
- OSS 上传失败时不创建文件记录；数据库事务失败时不发布关联业务内容。
- 邀请码错误、过期或已使用统一返回受控的 `400`/`409` 响应。
- Netlify 函数日志不得输出数据库 URL、OSS 密钥、邀请码或用户密码。

## 验证标准

- 单元测试覆盖生产配置校验、教师邀请码、家长绑定码摘要/过期/单次使用和演示数据迁移幂等性。
- PostgreSQL 集成测试覆盖迁移、注册、作业发布、学生提交、教师回复和家长读取授权。
- 现有三端 Playwright 流程在本地 `netlify dev` 环境全部通过。
- Deploy Preview 验证页面渲染、静态资源、登录和数据库分支隔离。
- 生产 URL 验证教师、学生、家长演示账号登录，新增数据在重新访问和函数冷启动后仍存在。
- 验证课件或图片上传后可从 OSS 正常读取，并确认未配置百炼密钥时演示 AI 流程仍可用。

## 不在本次范围

- 教育局或多学校管理后台。
- 短信、微信或邮件验证码。
- PostgreSQL 全文检索优化和向量检索。
- 自定义域名、ICP备案和短信服务采购。
- 将阿里云 OSS 替换为 Netlify Blobs。
