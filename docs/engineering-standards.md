# 工程标准与最佳实践

本文档记录了项目的完整工程体系配置，确保符合 Nx + Next.js 的最佳实践。

## ✅ 配置检查清单

### 1. TypeScript 配置 ✓

#### 基础配置 (`tsconfig.base.json`)

- ✅ 启用严格模式 (`strict: true`)
- ✅ 检测未使用的局部变量 (`noUnusedLocals: true`)
- ✅ 检测未使用的函数参数 (`noUnusedParameters: true`)
- ✅ 强制文件名大小写一致 (`forceConsistentCasingInFileNames: true`)
- ✅ 启用增量编译 (`incremental: true`)

#### Next.js 应用配置 (`apps/prism/tsconfig.app.json`)

- ✅ 支持 JavaScript 文件 (`allowJs: true`)
- ✅ 不输出文件 (`noEmit: true`)
- ✅ 包含 Next.js 类型定义

### 2. ESLint 配置 ✓

#### 基础配置 (`eslint.config.mjs`)

- ✅ 集成 Nx ESLint 插件
- ✅ 集成 TypeScript ESLint 规则
- ✅ 集成 React Hooks 规则
- ✅ 集成 Prettier（避免格式化冲突）
- ✅ 检测未使用的变量和导入
- ✅ 模块边界约束（Nx 工作区规则）

#### Next.js 应用配置 (`apps/prism/eslint.config.mjs`)

- ✅ Next.js 特定规则
- ✅ React Hooks 规则
- ✅ TypeScript 严格检查
- ✅ 异步客户端组件检查

### 3. Prettier 配置 ✓

- ✅ 配置文件 (`.prettierrc`)
- ✅ 忽略文件 (`.prettierignore`)
- ✅ 与 ESLint 集成（通过 `eslint-config-prettier`）
- ✅ VSCode 自动格式化

### 4. Git Hooks 配置 ✓

#### Pre-commit Hook (`.husky/pre-commit`)

- ✅ 运行 lint-staged（自动修复暂存文件）
- ✅ 运行完整 lint 检查
- ✅ 运行类型检查

#### Commit Message Hook (`.husky/commit-msg`)

- ✅ Commitlint 验证提交信息格式

#### Lint-staged 配置

- ✅ TypeScript/JavaScript 文件：ESLint 修复 + Prettier 格式化
- ✅ 其他文件：Prettier 格式化

### 5. 编辑器集成 ✓

#### VSCode 设置 (`.vscode/settings.json`)

- ✅ TypeScript 实时检查
- ✅ ESLint 输入时检查（`onType`）
- ✅ 保存时自动修复和格式化
- ✅ 显示未使用的代码
- ✅ 状态栏显示问题数

### 6. 构建配置 ✓

#### Next.js 配置 (`apps/prism/next.config.js`)

- ✅ 构建时进行 ESLint 检查 (`eslint.ignoreDuringBuilds: false`)
- ✅ 构建时进行 TypeScript 检查 (`typescript.ignoreBuildErrors: false`)

#### Nx 项目配置 (`apps/prism/project.json`)

- ✅ 类型检查任务 (`typecheck`)
- ✅ Lint 任务
- ✅ 构建任务

### 7. 开发脚本 ✓

#### Package.json 脚本

- ✅ `pnpm dev` - 开发服务器
- ✅ `pnpm build` - 生产构建
- ✅ `pnpm lint` - 代码检查
- ✅ `pnpm lint:fix` - 自动修复 ESLint 问题
- ✅ `pnpm typecheck` - 类型检查
- ✅ `pnpm typecheck:watch` - 监听模式类型检查
- ✅ `pnpm check` - 同时运行类型检查和 lint
- ✅ `pnpm check:fix` - 自动修复所有问题

### 8. CI/CD 配置 ✓

#### GitHub Actions (`.github/workflows/ci.yml`)

- ✅ Lint 和类型检查任务
- ✅ 构建任务
- ✅ 测试任务
- ✅ 使用正确的 Node.js 和 pnpm 版本

## 🔧 使用指南

### 开发时

1. **编辑器实时检查**：打开文件后，错误会自动显示
2. **保存时自动修复**：保存文件时自动运行 ESLint 修复和 Prettier 格式化
3. **手动检查**：运行 `pnpm check` 进行完整检查

### 提交代码前

1. **自动检查**：Git hooks 会自动运行

   - lint-staged 修复暂存文件
   - 完整 lint 检查
   - 类型检查

2. **提交信息**：使用 `pnpm commit` 或遵循 Conventional Commits 格式

### 构建前

运行 `pnpm build` 会自动进行：

- ESLint 检查
- TypeScript 类型检查
- Next.js 构建

## 📝 规则说明

### 未使用变量规则

未使用的变量必须以 `_` 开头，否则会报错：

```typescript
// ✅ 正确
const _unused = getValue();

// ❌ 错误
const unused = getValue();
```

### 提交信息格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

示例：

```
feat(blog): add article search functionality

fix(api): resolve type error in articles endpoint
```

## 🚀 最佳实践

1. **开发时**：保持编辑器打开，实时查看错误
2. **提交前**：运行 `pnpm check` 确保没有错误
3. **构建前**：确保所有检查通过
4. **CI/CD**：所有检查都会在 CI 中自动运行

## 🔍 故障排查

### 编辑器不显示错误

1. 重启 TypeScript 服务器：`Ctrl+Shift+P` → `TypeScript: Restart TS Server`
2. 重启 ESLint 服务器：`Ctrl+Shift+P` → `ESLint: Restart ESLint Server`
3. 重新加载窗口：`Ctrl+Shift+P` → `Developer: Reload Window`

### 构建时出现错误但编辑器没有显示

1. 确保使用工作区 TypeScript 版本
2. 检查 `.vscode/settings.json` 配置
3. 确保安装了所有推荐的 VSCode 扩展

### Git hooks 不工作

1. 运行 `pnpm prepare` 重新初始化 husky
2. 检查 `.husky` 目录中的文件是否有执行权限
