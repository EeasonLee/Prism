# CLAUDE.md

**对话语言**：所有回复必须使用中文。代码注释、提交信息用中文。

## 项目概述

跨境电商多系统重构项目前端。Nx monorepo，Next.js 15 App Router，多后端协同（Magento 商务、Strapi 内容、SSO 认证、Meilisearch 搜索）。Tailwind CSS + shadcn/ui 模式。

详见 @docs/architecture/file-layout-spec.md

## 常用命令

```bash
pnpm dev                 # 启动开发服务器 (localhost:3000)
pnpm build               # 生产构建
pnpm lint                # ESLint 检查
pnpm lint:fix            # ESLint 自动修复
pnpm typecheck           # TypeScript 类型检查
pnpm check               # typecheck + lint
pnpm check:fix           # 自动修复所有问题
pnpm test                # Vitest 单元测试
pnpm nx test jd-frontend -- --run  # 单次运行测试
pnpm e2e                 # Playwright E2E 测试
pnpm storybook           # Storybook 组件开发
pnpm commit              # 交互式 Conventional Commit（通过 Commitizen）
```

所有命令都通过 Nx 运行，支持构建缓存和受影响项目分析。

## 跨系统协作

商品富文本、discovery、SEO、blogs、recipes、category mapping 等需求**默认视为跨系统任务**，不是前端单仓任务。

跨系统协作时需同时检查 Strapi 后端（`D:\WORK\helpcenter\backend`）的对应内容类型、控制器、服务、生命周期钩子和响应格式。在分析中明确区分：Prism 改动 / Strapi 改动 / API 合约变更 / 验证步骤。

## 独有约束

- **图片**：必须用 `<Image>` from `next/image`，指定 `width`/`height`。禁止原生 `<img>`
- **链接**：内部用 `<Link>` from `next/link`，外部用 `<a target="_blank" rel="noopener noreferrer">`
- **用户可见文本**：必须是英文。代码注释可用中文
- **颜色**：用设计 token（`text-ink`、`bg-surface`、`bg-brand` 等），禁止硬编码色值
- **排版**：用语义类（`heading-1`、`body-text` 等），不用 `text-5xl font-bold`
- **布局**：用 `<PageContainer>` from `@prism/ui`，不用 `mx-auto max-w-[...]`
- **响应式**：mobile-first（`sm:` 在前，`max-`\* 禁止）
- **新 UI 组件**：用 CVA 做变体，`cn()` 合并 className
- **状态管理**：`useState` → `useReducer` → Context → Zustand，Zustand store 命名 `use[Feature]Store`
- **命名约定**：文件用 `kebab-case`（如 `use-product-filter.ts`），组件用 `PascalCase`

> 以上约束属于 AI 级别检查，不依赖 ESLint/TypeScript 配置作为唯一信源。

## 提交规范

Conventional Commits 格式，commitlint + husky 强制执行：

- `type-case`: 类型必须小写
- `type-empty`: 类型不能为空
- `subject-empty`: 主题不能为空
- `subject-full-stop`: 主题不能以 `.` 结尾
- `subject-max-length`: 主题最多 100 字符
- `body-max-line-length`: 正文每行最多 100 字符
- `footer-max-line-length`: 页脚每行最多 100 字符

> 主题行保持简短，细节写正文。大部分 Git 工具在 72–100 字符处截断主题。

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
