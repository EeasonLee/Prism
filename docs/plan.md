## Prism 框架建设任务清单

| 优先级 | 任务                                                                                     | 当前状态  | 撑腰理由 & 下一步                                                                                                                                |
| ------ | ---------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| P0     | 基础技术栈定版（Next/React/TS/ESLint/Prettier、移除多余依赖）                            | ✅ 已完成 | 已在根 `package.json` 固定版本并启用 `engines/volta`。后续如需升级，请在此文档记录影响与回退方案。                                               |
| P0     | Nx 项目定义与依赖边界（`project.json`、`targetDefaults`、`tsconfig paths`、`libs` 预留） | ✅ 已完成 | `apps/prism/project.json`、`libs/` 占位、`tsconfig.base.json` paths 及 `nx.json targetDefaults` 均已就位，可直接按标签/路径扩展新的 app 或 lib。 |
| P0     | 统一命令入口与 CI 基线（脚本、Lint/Test/Typecheck、GitHub Actions）                      | ✅ 已完成 | 根脚本 + lint-staged + `.github/workflows/ci.yml`（lint/test/typecheck）已落地，并在 README 说明；未来新增任务时同步更新脚本与 workflow。        |
| P1     | Next.js 应用底座强化（typed routes、env 校验、Providers、error/loading）                 | ✅ 已完成 | `next.config` 切换为 ESM 并开启 typed routes、`env.ts` 提供 Zod 校验、`AppProviders`/`loading`/`error` 已就绪，可直接承载业务。                  |
| P1     | 测试与可观测性（Vitest/RTL/Playwright + 示例测试 + 日志/指标基线）                       | ✅ 已完成 | Vitest + RTL 示例、Playwright e2e、`logger/metrics` 观测基线与 `reportWebVitals` 均已落地；README/框架文档同步说明使用方式。                     |
| P1     | Tailwind/设计系统规范（content 覆盖、主题 token、UI 库）                                 | 待办      | 依赖 `libs` 结构，建议与 shared UI 库一起推进。                                                                                                  |
| P0     | 架构重构与优化（目录结构、类型体系、规范强化）                                           | ⏳ 进行中 | 详见 `docs/development-plan.md`，包含完整的重构计划和优先级。当前处于 Phase 1 准备阶段。                                                         |
| P1     | 请求/错误/权限统一收口（API 类型体系、错误处理、权限系统）                               | 待办      | 依赖 Phase 1 完成，详见 `docs/development-plan.md` Phase 2 Week 3。                                                                              |
| P1     | 数据 & 状态架构（状态管理、数据获取、缓存策略）                                          | 待办      | 依赖 Phase 1 完成，详见 `docs/development-plan.md` Phase 2 Week 4。                                                                              |
| P1     | UI 与业务逻辑解耦（组件分层、逻辑提取、组件库）                                          | 待办      | 依赖 Phase 1 完成，详见 `docs/development-plan.md` Phase 2 Week 5。                                                                              |
| P1     | Strapi 集成（SDK 封装、类型映射、媒体处理）                                              | 待办      | 依赖 Phase 1 完成，详见 `docs/development-plan.md` Phase 2 Week 6。                                                                              |
| P2     | 脚手架与生成器（Nx Generator、自定义 CLI）                                               | 待办      | 待前述能力稳定并积累实践后再抽象，避免过度设计。                                                                                                 |

> 约定：状态可取 `✅ 已完成` / `⏳ 进行中` / `待办`。每次重大调整请更新本表，保证团队对路线图有共同认知。
>
> **重要：** 详细的开发计划请参考 `docs/development-plan.md`，包含完整的任务清单、时间线、依赖关系和验收标准。
