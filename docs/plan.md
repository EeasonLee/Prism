## Prism 框架建设任务清单

| 优先级 | 任务                                                                                     | 当前状态  | 撑腰理由 & 下一步                                                                                                                                |
| ------ | ---------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| P0     | 基础技术栈定版（Next/React/TS/ESLint/Prettier、移除多余依赖）                            | ✅ 已完成 | 已在根 `package.json` 固定版本并启用 `engines/volta`。后续如需升级，请在此文档记录影响与回退方案。                                               |
| P0     | Nx 项目定义与依赖边界（`project.json`、`targetDefaults`、`tsconfig paths`、`libs` 预留） | ✅ 已完成 | `apps/prism/project.json`、`libs/` 占位、`tsconfig.base.json` paths 及 `nx.json targetDefaults` 均已就位，可直接按标签/路径扩展新的 app 或 lib。 |
| P0     | 统一命令入口与 CI 基线（脚本、Lint/Test/Typecheck、GitHub Actions）                      | ✅ 已完成 | 根脚本 + lint-staged + `.github/workflows/ci.yml`（lint/test/typecheck）已落地，并在 README 说明；未来新增任务时同步更新脚本与 workflow。        |
| P1     | Next.js 应用底座强化（typed routes、env 校验、Providers、error/loading）                 | 待办      | 完成 P0 后立即启动，避免业务上线前需要大规模重构。                                                                                               |
| P1     | 测试与可观测性（Vitest/RTL/Playwright + 示例测试 + 日志/指标基线）                       | ⏳ 进行中 | Vitest + 示例测试（`apps/prism/tests`）已上线，接下来补 React Testing Library、Playwright 以及日志/指标规范。                                    |
| P1     | Tailwind/设计系统规范（content 覆盖、主题 token、UI 库）                                 | 待办      | 依赖 `libs` 结构，建议与 shared UI 库一起推进。                                                                                                  |
| P2     | 脚手架与生成器（Nx Generator、自定义 CLI）                                               | 待办      | 待前述能力稳定并积累实践后再抽象，避免过度设计。                                                                                                 |

> 约定：状态可取 `✅ 已完成` / `⏳ 进行中` / `待办`。每次重大调整请更新本表，保证团队对路线图有共同认知。
