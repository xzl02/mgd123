# 果冻写作台真实网站化说明

当前目录仍然可以直接打开 `index.html` 预览。它适合验证 UI、流程和数据结构，但多人共用必须接入云端后端。

## 推荐部署结构

- 前端：Vercel 或 GitHub Pages
- 账号：Supabase Auth
- 数据库：Supabase Postgres
- 文件：Supabase Storage
- AI 调用：Vercel Serverless API Route
- 密钥：只放服务端环境变量，不能写入浏览器 JS

## 第一阶段上线

1. 创建 GitHub 仓库，上传 `novel_workbench`。
2. 用 Vercel 导入仓库，先部署静态前端。
3. 创建 Supabase 项目，执行 `supabase_schema.sql`。
4. 增加服务端 API：生成章节、质量检查、状态更新。
5. 前端把 `localStorage` 替换为 Supabase 读写。

## Vercel 环境变量

当前已经提供 `/api/generate` 服务端接口骨架。部署到 Vercel 后，在项目环境变量里配置：

- `AI_API_KEY`：模型平台密钥
- `AI_API_BASE`：OpenAI 兼容接口地址，默认 `https://api.deepseek.com`
- `AI_MODEL`：模型名，默认 `deepseek-chat`

本地直接打开 `index.html` 时不会调用 API，会自动使用模拟生成。

## 必须云端化的数据

- 用户资料：`profiles`
- 小说项目：`novels`
- 章节：`chapters`
- 大纲、卷纲、剧情块：`outlines`
- 记忆系统：`memories`
- 请求记录和 Trace：`requests`
- 提示词和模型配置：`prompts`、`model_configs`

## 不能放前端的内容

- DeepSeek/OpenAI/Claude API Key
- Supabase service role key
- 邮件服务密钥
- 付费额度控制逻辑
