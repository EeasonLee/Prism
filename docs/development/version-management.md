# 版本号管理规范

本文档说明 Prism 项目的版本号来源、展示方式以及发布流程。

## 版本号单一来源

- **唯一来源**：`apps/prism/package.json` 的 `version` 字段
- **展示位置**：页脚 Copyright 区域、dev/build 启动时的终端输出
- **原因**：Prism 是实际部署的应用，版本应与部署产物保持一致

## 版本规范（SemVer）

采用 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)：`MAJOR.MINOR.PATCH`

| 部分  | 何时递增           | 示例          |
| ----- | ------------------ | ------------- |
| MAJOR | 不兼容的 API 变更  | 1.0.0 → 2.0.0 |
| MINOR | 向后兼容的功能新增 | 1.0.0 → 1.1.0 |
| PATCH | 向后兼容的问题修复 | 1.0.0 → 1.0.1 |

## 版本号如何生效

1. **页脚展示**：`next.config.js` 在构建时读取 `package.json` 的 version，注入为 `NEXT_PUBLIC_APP_VERSION`，Footer 组件读取后展示
2. **终端输出**：执行 `nx dev prism` 或 `nx build prism` 时，会先运行 `print-build-info` 任务，在终端打印版本、构建时间、Node 版本等信息
3. **部署可见**：发布脚本执行 `nx build prism` 时，构建输出中会包含版本信息，无需修改部署脚本

## 发布流程

1. **更新版本**：在 `apps/prism` 目录执行 `pnpm version patch`（或 `minor` / `major`）
2. **提交**：`git add apps/prism/package.json && git commit -m "chore: bump version to x.y.z"`
3. **打 Tag**（可选）：`git tag v1.0.1`
4. **部署**：执行部署流程，构建时会自动输出新版本信息

## 常用命令

`pnpm version` 不支持 `--cwd`，需先进入包目录：

```bash
cd apps/prism
pnpm version patch   # 1.0.0 → 1.0.1
pnpm version minor   # 1.0.0 → 1.1.0
pnpm version major   # 1.0.0 → 2.0.0
```

或使用根目录便捷脚本：

```bash
pnpm version:patch   # 等同于 cd apps/prism && pnpm version patch
pnpm version:minor
pnpm version:major
```

仅修改 package.json、不自动打 git tag：

```bash
cd apps/prism
pnpm version patch --no-git-tag-version
```

## 与 Conventional Commits 的配合

项目已配置 commitizen 和 commitlint，建议提交信息遵循规范：

- `feat:` → 通常 bump MINOR
- `fix:` → 通常 bump PATCH
- `BREAKING CHANGE:` → 通常 bump MAJOR

当前采用手动 bump 版本；后续可引入 `standard-version` 或 `changesets` 实现基于 commit 的自动版本与 CHANGELOG 生成。

## 相关文件

| 文件                                   | 作用                                 |
| -------------------------------------- | ------------------------------------ |
| `apps/prism/package.json`              | 版本号唯一来源                       |
| `apps/prism/next.config.js`            | 构建时注入 NEXT_PUBLIC_APP_VERSION   |
| `apps/prism/app/components/Footer.tsx` | 页脚展示版本                         |
| `scripts/print-build-info.mjs`         | dev/build 时终端输出                 |
| `apps/prism/project.json`              | dev/build 依赖 print-build-info 任务 |
