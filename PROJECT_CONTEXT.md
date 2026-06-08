# PROJECT_CONTEXT.md

> 本文件是 AI 理解 Prism 项目的入口。
> AI 拿到这个项目时，先读这个文件，再看代码。

---

## 一、这个项目是什么

**Prism** 是 Yason 的个人项目平台，有两个核心功能：

1. **个人博客**（对外的能力证明站）— 不是传统博客，而是按「能力维度 → 代表项目 → 项目文章」组织的证据链。目标：让访问者 10 秒判断「这人值不值得深入了解」。
2. **个人工具站**（对内的工作台）— 承载仪表盘、项目管理、知识管理入口等个人服务。

**一句话定位：** 对外的能力证明站 + 对内的个人工具服务站。

---

## 二、技术栈

- **框架：** Nx monorepo + Next.js 15 + React 19
- **语言：** TypeScript
- **样式：** Tailwind CSS
- **包管理：** pnpm
- **测试：** Vitest + Playwright
- **组件开发：** Storybook
- **仓库：** `git@github.com:yasonlee/Prism.git`，当前在 `develop` 分支

---

## 三、项目结构

```
apps/
  jd-frontend/        ← 当前唯一的 app（Next.js 应用壳）
    app/
      page.tsx         ← 首页
      layout.tsx       ← 全局布局
      providers.tsx    ← 全局 Provider
      _ui/             ← 页面级 UI 组件
    features/          ← （待建）业务特性模块
libs/
  shared/              ← 共享工具函数
  tokens/              ← 设计 token 和 Tailwind 预设
  ui/                  ← 通用 UI 组件
```

---

## 四、当前状态（截至 2026-06-08）

### 已完成

- ✅ Nx monorepo 骨架搭建
- ✅ 基础 Next.js 应用壳（jd-frontend）
- ✅ AGENTS.md（AI 编程规则入口）
- ✅ SSO 认证后端（auth.yason.tech，独立服务，不在 Prism 仓库里）
  - Fastify + PostgreSQL
  - Cookie Domain=.yason.tech，所有子域共享登录态
  - API: register / login / logout / me

### 部署情况

- **yason.tech** → Prism 博客（端口 3002，systemd `prism.service`）
- **dev.yason.tech** → Prism 博客（同上）
- **dev.yason.tech/dashboard** → Hermes Dashboard（端口 9119，basic auth）
- **auth.yason.tech** → SSO 认证服务（端口 3000，systemd `auth-service.service`）

### 进行中

- 🔄 博客首页内容设计（PRD 已写，原型已画，代码待实现）
- 🔄 SSO 前端接入（后端已完成，前端登录 UI 待加）

### 未开始

- ❌ 项目管理工具（apps/kanban）— 需求已讨论，方案待设计
- ❌ 电商 demo — 计划中，依赖 SSO

---

## 五、关键设计决策

1. **博客不是按时间线组织的**，而是按「能力维度 → 代表项目 → 项目文章」。参考 PRD：`Obsidian/01-Projects/个人博客/个人博客-PRD.md`
2. **信息分三层存放：**
   - Obsidian → 想法和思考（可以模糊）
   - 项目仓库 `docs/` → 设计方案和技术决策（必须精确）
   - Hermes kanban → 可验收的执行任务（有完成标准）
3. **SSO 是独立服务**，不在 Prism 仓库里。通过 `.yason.tech` Cookie 实现跨子域登录。
4. **AGENTS.md 是 AI 编程规则入口**，所有 AI 工具（Codex、Claude Code、Cursor）以它为准。

---

## 六、AI 工作指南

### 做什么之前先读

1. 本文件（PROJECT_CONTEXT.md）
2. `AGENTS.md`（编码规则）
3. 如果涉及博客设计，读 PRD：`Obsidian/01-Projects/个人博客/个人博客-PRD.md`

### 当前优先级

1. **博客首页实现** — PRD 和原型已就绪，需要写代码
2. **SSO 前端接入** — 后端 API 已就绪，需要在博客加登录 UI
3. **项目管理工具设计** — 需求已讨论，需要出技术方案

### 不要做的事

- 不要猜业务需求，问 Yason
- 不要自行引入新的 npm 包，除非经过讨论
- 不要修改部署相关的配置（nginx、systemd），除非明确要求
- 不要使用 `<img>`，必须用 `next/image`

---

## 七、相关资源

- **Obsidian 知识库：** `/home/ubuntu/Obsidian/`
- **博客 PRD：** `Obsidian/01-Projects/个人博客/个人博客-PRD.md`
- **需求讨论记录：** `Obsidian/01-Projects/个人博客/Prism项目管理工具-需求讨论.md`
- **博客设计探究：** `Obsidian/01-Projects/个人博客/个人博客设计探究.md`
- **参考网站收集：** `Obsidian/01-Projects/个人博客/博客网站参考.md`
- **Hermes Dashboard：** `dev.yason.tech/dashboard`
- **SSO 后端源码：** 不在本仓库，部署在服务器端口 3000

---

*最后更新：2026-06-08*
