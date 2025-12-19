# Prism

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ 基于 [Nx](https://nx.dev) 和 [Next.js](https://nextjs.org) 的现代化 Web 应用工作区 ✨

这是一个使用 Nx 21.3.11 和 Next.js 15 构建的现代化 Web 应用项目，采用 pnpm 作为包管理器。

> ⚠️ 当前 Next 15 / React 19 仍属 RC 阶段，如需切换至稳定版，请同步更新 `package.json` 并在 `docs/plan.md` 记录回退策略。

## 🚀 快速开始

### 开发环境启动

在安装依赖前，请先阅读《[开发环境约定](docs/dev-env.md)》，确保 Node/pnpm 与 Volta 设置正确。

启动 prism 应用的开发服务器（所有命令均通过 Nx 运行，保证缓存与受影响分析可用）：

```sh
pnpm dev        # 等同于 nx dev prism
```

应用将在 `http://localhost:3000` 启动。

### 构建生产版本

构建 prism 应用的生产版本：

```sh
pnpm build      # 等同于 nx build prism
```

### 查看项目信息

常用命令均有脚本别名（`pnpm dev/build/lint/test/typecheck`），完整任务列表可通过以下命令查看：

```sh
pnpm nx show project prism
```

## 🏗️ 项目结构

```
Prism/
├── apps/
│   └── prism/                 # Next.js 应用
│       ├── app/              # Next.js App Router
│       │   ├── layout.tsx    # 根布局
│       │   ├── page.tsx      # 首页
│       │   └── globals.css   # 全局样式
│       ├── components/       # 可复用组件
│       ├── lib/             # 工具函数
│       ├── public/          # 静态资源
│       └── ...              # 配置文件
├── tsconfig.base.json       # 基础 TypeScript 配置
├── eslint.config.mjs        # 基础 ESLint 配置
├── nx.json                  # Nx 工作区配置
└── package.json             # 项目依赖
```

## 🛠️ 技术栈

- **构建工具**: [Nx](https://nx.dev) 21.3.11
- **前端框架**: [Next.js](https://nextjs.org) 15（RC，搭配 React 19 RC，已在可控依赖下完成自测，升级需全量回归）
- **UI 框架**: [React](https://react.dev) 19
- **样式方案**: [Tailwind CSS](https://tailwindcss.com)
- **包管理器**: [pnpm](https://pnpm.io)
- **代码规范**: ESLint + Prettier
- **类型检查**: TypeScript

## 📦 添加新项目

### 生成新的 Next.js 应用

```sh
pnpm nx g @nx/next:app my-app
```

### 生成新的 React 库

```sh
pnpm nx g @nx/react:lib my-lib
```

### 查看可用插件

```sh
pnpm nx list
```

## 🔧 开发工具

### 安装 Nx Console

Nx Console 是一个编辑器扩展，可以增强你的开发体验。它让你能够在 IDE 中运行任务、生成代码，并改善代码自动补全。

[安装 Nx Console &raquo;](https://nx.dev/getting-started/editor-setup)

### 可视化项目依赖

查看项目依赖图：

```sh
pnpm nx graph
```

## 🚀 部署

### 构建生产版本

```sh
pnpm nx run prism:build
```

### 启动生产服务器

```sh
pnpm nx run prism:start
```

## 📋 常用命令

| 命令                                 | 描述                               |
| ------------------------------------ | ---------------------------------- |
| `pnpm nx dev prism`                  | 启动开发服务器                     |
| `pnpm nx build prism`                | 构建生产版本                       |
| `pnpm nx lint prism`                 | 代码检查                           |
| `pnpm nx test prism`                 | 运行 Vitest + RTL                  |
| `pnpm nx run prism:e2e` / `pnpm e2e` | Playwright E2E（需安装浏览器依赖） |
| `pnpm nx graph`                      | 查看依赖图                         |

## 🧪 测试

- **单元 / 组件**：`pnpm test`（或 `pnpm nx test prism`）调用 Vitest + React Testing Library，配置位于 `apps/prism/vite.config.ts` 与 `tests/setup.ts`。
- **端到端**：`pnpm e2e`（或 `pnpm nx run prism:e2e`）调用 Playwright，配置在 `apps/prism/playwright.config.js`。第一次运行前请执行 `pnpm exec playwright install`，如在 Linux/WSL 需按提示安装 `playwright install-deps`。
- 如需 IDE 内运行 Vitest，可使用 `vitest.workspace.ts` 自动发现测试配置。

## 🧱 Next.js 应用底座特性

- **Typed Routes**：`apps/prism/next.config.js` 已启用 `typedRoutes`，避免手写路由字符串。
- **环境变量校验**：`apps/prism/lib/env.ts` 使用 Zod 在构建期校验环境变量，详见《[环境变量配置](docs/env-config.md)》。
- **全局 Providers**：`app/providers.tsx` 提供 `AppConfig` 上下文并在客户端记录日志，可扩展主题、鉴权等全局状态。
- **标准 Loading / Error**：`app/loading.tsx`、`app/error.tsx` 提供统一体验，错误页自动记录日志并允许一键重试。

## 🛰️ 观测基线

- `lib/observability/logger.ts` 暴露 `createLogger` 与默认 `logger`，支持 `NEXT_PUBLIC_LOG_LEVEL` 控制输出等级，可在服务端/客户端通用。
- `lib/observability/metrics.ts` + `app/reportWebVitals.ts` 将 Next Web Vitals 记录进缓冲区，便于后续对接 Sentry/Datadog 等平台。
- 在客户端 Provider 中会自动埋点应用启动日志；也可在业务代码中通过 `logger.info()` / `recordMetric()` 扩展。

## ✅ CI 质量门槛

仓库根目录提供 `.github/workflows/ci.yml`，在 push / PR 时自动执行：

1. `pnpm lint`
2. `pnpm test`
3. `pnpm typecheck`

所有任务通过才可合入主干，避免不同环境下的“能跑/不能跑”分歧。

## 🔗 有用的链接

了解更多：

- [Nx 文档](https://nx.dev)
- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [React 文档](https://react.dev)

加入社区：

- [Nx Discord](https://go.nx.dev/community)
- [Next.js Discord](https://discord.gg/nextjs)
- [React Discord](https://discord.gg/react)

## 📄 许可证

MIT
