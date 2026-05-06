# jd-frontend

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ 基于 [Nx](https://nx.dev) 和 [Next.js](https://nextjs.org) 的现代化电商 Web 应用 ✨

这是一个使用 Nx 21.3.11 和 Next.js 15 构建的跨境电商项目，采用 pnpm 作为包管理器。

## 🚀 快速开始

### 开发环境启动

启动开发服务器：

```sh
pnpm dev        # 启动 Next.js 开发服务器（http://localhost:3000）
```

### 构建生产版本

```sh
pnpm build      # 生产构建
```

### 查看项目信息

```sh
pnpm nx show project jd-frontend
```

## 🏗️ 项目结构

```
jd-frontend/
├── apps/
│   └── jd-frontend/              # Next.js 应用
│       ├── app/                  # [L3] 框架层 — Next.js 路由、页面入口、Route Handler
│       │   ├── (marketing)/      #   路由组：首页、Blog、Search、Recipes
│       │   ├── (shop)/           #   路由组：Products、Categories、Cart
│       │   ├── (account)/        #   路由组：账户相关页面
│       │   ├── api/             #   Route Handler（薄控制器）
│       │   ├── layout.tsx       #   根布局
│       │   ├── page.tsx         #   首页
│       │   └── globals.css      #   全局样式
│       ├── features/             # [L1] 领域层 — 按业务领域垂直切片
│       │   ├── product/         #   商品领域（api、services、components、hooks）
│       │   ├── blog/            #   博客领域
│       │   ├── search/          #   搜索领域
│       │   ├── cart/            #   购物车领域
│       │   ├── auth/            #   认证领域
│       │   ├── recipe/          #   食谱领域
│       │   └── ...              #   其他领域
│       ├── core/                 # 基础设施层 — API 客户端、配置、观测
│       │   ├── api/clients/     #   各后端 HTTP 客户端
│       │   ├── api/pipeline/    #   请求/响应拦截链
│       │   ├── config/          #   环境变量、运行时配置
│       │   └── observability/   #   日志、指标
│       ├── shared/               # app 级共享 — 布局壳组件、工具函数
│       │   ├── ui/              #   全局 UI（Header、Footer、MobileNav、ErrorPage）
│       │   ├── utils/           #   工具函数
│       │   └── mapping/         #   数据映射
│       └── public/              #   静态资源
├── libs/
│   ├── shared/   @prism/shared  # [L0] 零依赖工具：cn()、debounce、类型守卫
│   ├── ui/       @prism/ui      # [L0] 原子 UI 组件：Button、Input、Skeleton、Dialog
│   └── tokens/   @prism/tokens  # 设计 Token：CSS 变量、Tailwind preset
├── tsconfig.base.json            # 基础 TypeScript 配置
├── eslint.config.mjs             # 基础 ESLint 配置
├── nx.json                       # Nx 工作区配置
└── package.json                  # 项目依赖
```

> 详细的文件组织规范、层级定义、决策流程见 [`docs/architecture/file-layout-spec.md`](docs/architecture/file-layout-spec.md)。

## 🛠️ 技术栈

- **构建工具**: [Nx](https://nx.dev) 21.3.11
- **前端框架**: [Next.js](https://nextjs.org) 15（RC，搭配 React 19 RC）
- **UI 框架**: [React](https://react.dev) 19
- **样式方案**: [Tailwind CSS](https://tailwindcss.com)
- **包管理器**: [pnpm](https://pnpm.io)
- **代码规范**: ESLint + Prettier
- **类型检查**: TypeScript

## 🎨 Design Tokens 工作流

- **定义 token**：在 `libs/tokens/src/tokens.css` 中新增/修改 CSS 变量（含 dark 值）。
- **映射 Tailwind**：在 `libs/tokens/src/tailwind-preset.js` 增加语义类映射。
- **Storybook 校验**：访问 `Design Tokens/Overview` 检查亮/暗模式展示与语义覆盖。
- **Lint 约束**：`apps/jd-frontend/eslint.config.mjs` 会拦截新增硬编码 HEX 颜色，要求改用 token 类。

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

```sh
pnpm nx graph
```

## 🚀 部署

### 构建生产版本

```sh
pnpm build
```

### 启动生产服务器

```sh
pnpm nx run jd-frontend:start
```

## 📋 常用命令

| 命令             | 描述                               |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | 启动开发服务器                     |
| `pnpm build`     | 构建生产版本                       |
| `pnpm lint`      | 代码检查                           |
| `pnpm lint:fix`  | 自动修复 Lint 问题                 |
| `pnpm typecheck` | TypeScript 类型检查                |
| `pnpm test`      | 运行 Vitest 单元测试               |
| `pnpm e2e`       | Playwright E2E（需安装浏览器依赖） |
| `pnpm storybook` | 启动 Storybook                     |
| `pnpm nx graph`  | 查看依赖图                         |

## 🧪 测试

- **单元 / 组件**：`pnpm test` 调用 Vitest + React Testing Library，配置位于 `apps/jd-frontend/vite.config.ts` 与 `tests/setup.ts`。
- **端到端**：`pnpm e2e` 调用 Playwright，配置在 `apps/jd-frontend/playwright.config.js`。第一次运行前请执行 `pnpm exec playwright install`。
- 如需 IDE 内运行 Vitest，可使用 `vitest.workspace.ts` 自动发现测试配置。

## 🧱 Next.js 应用底座特性

- **Typed Routes**：`apps/jd-frontend/next.config.js` 已启用 `typedRoutes`，避免手写路由字符串。
- **环境变量校验**：`apps/jd-frontend/core/config/env.ts` 使用 Zod 在构建期校验环境变量，详见《[环境变量配置](docs/env-config.md)》。
- **全局 Providers**：`app/providers.tsx` 提供 `AppConfig` 上下文并在客户端记录日志，可扩展主题、鉴权等全局状态。
- **标准 Loading / Error**：`app/loading.tsx`、`app/error.tsx` 提供统一体验，错误页自动记录日志并允许一键重试。

## 🛰️ 观测基线

- `core/observability/logger.ts` 暴露 `createLogger` 与默认 `logger`，支持 `NEXT_PUBLIC_LOG_LEVEL` 控制输出等级，可在服务端/客户端通用。
- `core/observability/metrics.ts` + `app/reportWebVitals.ts` 将 Next Web Vitals 记录进缓冲区，便于后续对接 Sentry/Datadog 等平台。
- 在客户端 Provider 中会自动埋点应用启动日志；也可在业务代码中通过 `logger.info()` / `recordMetric()` 扩展。

## ✅ CI 质量门槛

仓库根目录提供 `.github/workflows/ci.yml`，在 push / PR 时自动执行：

1. `pnpm lint`
2. `pnpm test`
3. `pnpm typecheck`

所有任务通过才可合入主干，避免不同环境下的"能跑/不能跑"分歧。

## 🔗 有用的链接

### 项目文档

- [文件分层架构规范](docs/architecture/file-layout-spec.md) - 项目文件组织的权威标准

### 外部文档

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
