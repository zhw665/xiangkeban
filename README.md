# 乡课伴

面向乡村学校试点的教师、学生、家长三端协同平台。教师可 AI 辅助备课、处理问题、发布作业与微课；学生可学习、提交作业和提问；家长只查看已绑定孩子的学情、通知并与教师异步沟通。

## 本地运行

复制 `.env.example` 为 `.env.local`，至少设置一个随机的 `AUTH_SECRET`。未配置百炼和 OSS 时，系统会自动使用确定性的本地 AI 演示数据、SQLite 与本地文件存储。

```powershell
pnpm install
pnpm dev
```

演示账号密码均为 `demo1234`：

- 教师：`teacher`
- 学生：`student`
- 家长：`parent`

## 验证

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```
