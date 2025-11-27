## 1. 框架的最终目标 / 期望

1. 建立一个 **高质量、通用、健壮** 的 Next.js + Nx 全栈工程底座，确保团队能在同一套标准下快速启动应用或封装脚手架。
2. 在此基础上沉淀 **可复用的代码规范、测试套件、CI 流程与文档体系**，降低新成员上手成本，同时保证长期演进可控。
3. 形成“先搭骨架、再抽象脚手架”的节奏：先让业务在稳定底座上运行，再把通用能力沉淀为生成器，持续迭代为团队产品力。

## 2. 设计理念

| 关键词             | 说明                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------- |
| **工程化为先**     | 任何功能都要放在 Nx/Pnpm 工程约束下实施，确保依赖、命令、缓存一致，可在 CI 环境直接复现。     |
| **渐进式增强**     | P0 先打牢（版本、命令、CI、项目边界），P1/P2 由业务反馈驱动，避免过度设计。                   |
| **可观测与可维护** | 每个新增能力都需要配套测试、文档、监控/日志方案，保证产品生命周期内可追踪、可回溯。           |
| **文档与代码同频** | 所有框架决策必须记录在 `docs/` 下，保证“看文档就能复刻配置”，避免只存在口口相传的“隐性约定”。 |

## 3. 技术选型与落地

| 领域              | 选型                                             | 落地现状                                                                                                                        |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 包管理 / Monorepo | `pnpm + Nx 21.3.11`                              | 根 `package.json` + `pnpm-workspace.yaml` 管理，`apps/prism` 已配 `project.json`、`targetDefaults`。                            |
| 前端框架          | `Next.js 15 (App Router) + React 19`             | `apps/prism` 采用 App Router，`next config` 由 `@nx/next` 包装并启用 typed routes、图片格式优化等特性。                         |
| 样式体系          | `Tailwind CSS 3.4`                               | `apps/prism/tailwind.config.js` 与 Nx 的 `createGlobPatternsForDependencies` 集成，后续将扩展 Design Token。                    |
| 语言 & 规范       | `TypeScript 5.8` + ESLint Flat Config + Prettier | 根 `eslint.config.mjs` + 子项目继承 + lint-staged；CI 强制执行。                                                                |
| 测试              | `Vitest 3 + RTL + Playwright`                    | Vitest + React Testing Library（`tests/setup.ts`）、Playwright e2e（`apps/prism/playwright.config.js`、`e2e` 目录）均已接入。   |
| Runtime 配置      | `zod`                                            | `apps/prism/lib/env.ts` 在构建期校验 `NODE_ENV` / `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_LOG_LEVEL`，并由 `layout.tsx` 统一消费。 |
| State / Provider  | React Context + 自定义 `AppProviders`            | `app/providers.tsx` 提供 AppConfig、日志、后续可接 Theme/Auth；面向 UI 层无侵入扩展。                                           |
| 观测体系          | 自研 `logger` + `metrics` + Web Vitals           | `lib/observability/logger.ts`、`metrics.ts`、`app/reportWebVitals.ts` 形成默认日志/性能路径；未来易接三方服务。                 |
| CI/CD             | GitHub Actions + Husky + lint-staged             | `.github/workflows/ci.yml` 在 push / PR 执行 lint/test/typecheck；Husky 保证提交前格式/质量一致。                               |
| 文档 / 工具       | Markdown + Nx Console + Volta                    | `docs/plan.md`、`docs/dev-env.md`、`docs/framework.md` 形成协作手册；Volta 锁定 Node/pnpm；推荐使用 Nx Console 图形界面。       |

## 4. 技术特性一览

### 4.1 工程约束

- **依赖与版本统一**：`engines` + `volta` + `docs/dev-env.md` 锁定 Node 20.11.x / pnpm 9.12.x，防止“环境漂移”。
- **Targets / 缓存策略**：`nx.json` 中的 `targetDefaults` 统一 build/lint/test/typecheck 行为，便于将来引入 Nx Cloud 或远端缓存。
- **路径规范**：`tsconfig.base.json` 设置 `@prism/*` alias，配合 `libs/` 目录，为 Domain/Shared 库的拆分打好基础。

### 4.2 Next.js 应用层

- App Router 结构（`app/layout.tsx`、`app/page.tsx`）已整合 `AppProviders`、metadata、`typedRoutes`，可快速扩展 Providers、Error Boundary、Route Handler。
- `next-env.d.ts` + `next.config.js` 保证 typed routes 自动生成；`layout` 依据 `env` 设置 `metadataBase`。
- `app/error.tsx`、`app/loading.tsx` 提供统一的全局体验，后续可继续扩展国际化、缓存策略等。
- `app/page.tsx` 演示如何结合 Tailwind、Link、文案模块化，既是首页模板，也是组件/测试/e2e 的样本。

### 4.3 测试与质量

- Vitest + React Testing Library：`tests/setup.ts` 统一注入 `jest-dom`、自动 cleanup，可在 `apps/prism/tests` 新增组件/Hook 测试。
- Playwright：`apps/prism/e2e` 提供 smoke case（验证 hero 内容），`pnpm e2e` 会自动拉起 Next dev server；CI 可按需接管。
- `app/page.tsx`、`tests/page.spec.tsx`、`e2e/example.spec.ts` 三者联动，确保 UI/UX 变更必有单元 + 端到端回归。
- CI 保证 `lint/test/typecheck` 全部通过才能合并，后续可将 Playwright 加入 workflow 或独立 job。
- lint-staged + Husky：提交前自动运行 ESLint/Prettier，避免“脏代码”进入版本库。

### 4.4 观测与日志

- `lib/observability/logger.ts` 定义 `createLogger`，支持日志级别和作用域，客户端 Provider、错误边界等已经示范用法。
- `lib/observability/metrics.ts` + `app/reportWebVitals.ts` 将 Web Vitals 写入缓冲区，可扩展到上报系统。
- `AppProviders`、`app/error.tsx` 内置默认埋点，后续扩展指标/日志只需调用 `logger` 或 `recordMetric`。

### 4.5 文档与协作

- `docs/plan.md` 记录所有任务优先级，任何设计变更都必须在此更新状态。
- `docs/dev-env.md` 用生活化步骤说明如何安装 Volta/nvm/插件，降低环境差异。
- 本文件提供“框架知识地图”，新成员只要读完即可理解目标、理念、技术栈和特性。
- `README.md` 面向开发者，提供命令对照表、测试/观测说明；新同学只要照 README 操作，就能跑通 dev/build/lint/test/e2e。

---

若需扩展，请在本文件增加新的章节（如“性能指标”“安全策略”），并在 `docs/plan.md` 记录对应任务，确保文档与代码同步演进。
