<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

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

# Prism AI 协作入口

本文件是本项目面向 AI 编程工具的统一规则入口。

适用范围：

- 适用于 Codex、Claude Code、Cursor 及其他会读取仓库说明文件的 AI 工具
- 如不同工具存在各自的本地配置或仓库配置，以本文件中的项目规则为准

维护原则：

- 能通过框架、编译器、Lint、测试、CI 约束的规则，优先放到工程配置中实现
- 本文件只保留 AI 在阅读代码和修改代码时仍然需要知道的项目约束
- 避免在多个 AI 工具目录中重复维护同一套规则

## 规则优先级

当规则冲突时，按以下顺序处理：

1. 真实代码与构建结果
2. `TypeScript`、`ESLint`、`Next.js`、`Nx`、测试、CI 等工程约束
3. 本文件
4. AI 工具自身的本地配置或个人偏好

## 项目规则

### 适合写在这里的内容

- 项目目录和模块边界约定
- 无法仅靠工程工具表达清楚的协作规则
- 需要 AI 在生成代码前主动遵守的项目约束

### 不适合写在这里的内容

- 本地绝对路径
- 个人模型偏好或个人操作习惯
- 过时的业务背景
- 已经由工程工具严格校验的长篇重复说明

## 编码约束

### Images

- 禁止使用 `<img>`
- 必须使用 `next/image` 的 `<Image>`
- 必须显式提供 `width` 和 `height`

### TypeScript

- 禁止使用非空断言 `!`
- 优先使用可选链 `?.` 和空值合并 `??`
- 禁止使用 `any`
- 未使用的变量或参数必须使用 `_` 前缀，例如 `_event`、`_unusedProp`

### Async

- 禁止留下 floating promises
- 异步调用必须 `await`
- 如果明确是 fire-and-forget，必须显式写 `void`

### Navigation

- 内部导航必须使用 `next/link` 的 `<Link>`
- 不要直接使用裸 `<a href="...">` 处理站内跳转

### Language

- 所有用户可见文本必须使用 English
- 包括按钮、标签、placeholder、错误信息、空状态文案、`aria-label`
- 代码注释可以使用中文

## 使用建议

- 新增或修改项目规则时，优先判断能否下沉到 `ESLint`、`TypeScript`、测试或 CI
- 如果某条规则只能依赖 AI 遵守，再补充到本文件
- 如需兼容其他 AI 工具，建议让其他工具的入口文件引用本文件，而不是复制一份规则正文
