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

| 领域              | 选型                                             | 落地现状                                                                                                              |
| ----------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 包管理 / Monorepo | `pnpm + Nx 21.3.11`                              | 根 `package.json` + `pnpm-workspace.yaml` 管理，`apps/prism` 已配 `project.json`、`targetDefaults`。                  |
| 前端框架          | `Next.js 15 (App Router) + React 19`             | `apps/prism` 采用 App Router，`next config` 由 `@nx/next` 包装并启用 typed routes、图片格式优化等特性。               |
| 样式体系          | `Tailwind CSS 3.4`                               | `apps/prism/tailwind.config.js` 与 Nx 的 `createGlobPatternsForDependencies` 集成，后续将扩展 Design Token。          |
| 语言 & 规范       | `TypeScript 5.8` + ESLint Flat Config + Prettier | 根 `eslint.config.mjs` + 子项目继承 + lint-staged；CI 强制执行。                                                      |
| 测试              | `Vitest 3 + jsdom`                               | `apps/prism/vite.config.ts`、`tsconfig.spec.json`、示例测试 `tests/page.spec.tsx` 已上线，下一步接入 RTL/Playwright。 |
| Runtime 配置      | `zod`                                            | `apps/prism/lib/env.ts` 在构建期校验 `NODE_ENV` / `NEXT_PUBLIC_APP_URL`，并由 `layout.tsx` 统一消费。                 |
| CI/CD             | GitHub Actions                                   | `.github/workflows/ci.yml` 在 push / PR 执行 lint/test/typecheck，确保质量门槛统一。                                  |
| 文档              | Markdown + Nx Console                            | `docs/plan.md`、`docs/dev-env.md`、本文件作为学习和复盘入口，后续可配合 Nx Console/Graph 可视化。                     |

## 4. 技术特性一览

### 4.1 工程约束

- **依赖与版本统一**：`engines` + `volta` + `docs/dev-env.md` 锁定 Node 20.11.x / pnpm 9.12.x，防止“环境漂移”。
- **Targets / 缓存策略**：`nx.json` 中的 `targetDefaults` 统一 build/lint/test/typecheck 行为，便于将来引入 Nx Cloud 或远端缓存。
- **路径规范**：`tsconfig.base.json` 设置 `@prism/*` alias，配合 `libs/` 目录，为 Domain/Shared 库的拆分打好基础。

### 4.2 Next.js 应用层

- App Router 结构（`app/layout.tsx`、`app/page.tsx`）已整合 `AppProviders`、metadata、`typedRoutes`，可快速扩展 Providers、Error Boundary、Route Handler。
- `next-env.d.ts` + `next.config.js` 保证 typed routes 自动生成；`layout` 依据 `env` 设置 `metadataBase`。
- `app/error.tsx`、`app/loading.tsx` 提供统一的全局体验，后续可继续扩展国际化、缓存策略等。

### 4.3 测试与质量

- Vitest 作为单元/组件测试基石，已与 Nx 任务联动（`pnpm test` == `nx test prism`）。
- `tests/page.spec.tsx` 演示如何直接测试 App Router 组件，后续将引入 React Testing Library + Playwright，实现端到端覆盖。
- CI 保证 `lint/test/typecheck` 全部通过才能合并，避免“我机器能跑”的误判。

### 4.4 文档与协作

- `docs/plan.md` 记录所有任务优先级，任何设计变更都必须在此更新状态。
- `docs/dev-env.md` 用生活化步骤说明如何安装 Volta/nvm/插件，降低环境差异。
- 本文件提供“框架知识地图”，新成员只要读完即可理解目标、理念、技术栈和特性。

---

若需扩展，请在本文件增加新的章节（如“性能指标”“安全策略”），并在 `docs/plan.md` 记录对应任务，确保文档与代码同步演进。
