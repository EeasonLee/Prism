# 快速开始指南

本文档帮助新成员快速上手 Prism 项目开发。

## 📋 前置要求

### 环境要求

- **Node.js**: >= 20.11.0（推荐使用 Volta 管理版本）
- **pnpm**: >= 9.12.0 < 10
- **Git**: 最新版本

### 推荐工具

- **IDE**: VS Code / Cursor
- **扩展**:
  - ESLint
  - Prettier
  - TypeScript
  - Nx Console（可选，但推荐）

## 🚀 初始设置

### 1. 克隆仓库

```bash
git clone <repository-url>
cd Prism
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

创建 `.env.local` 文件（参考 `.env.example`）：

```bash
cp .env.example .env.local
# 编辑 .env.local 填入必要的环境变量
```

### 4. 启动开发服务器

```bash
pnpm dev
```

应用将在 `http://localhost:3000` 启动。

## 📚 项目结构速览

```
Prism/
├── apps/prism/          # Next.js 应用
├── libs/                # 共享库
│   ├── shared/         # 基础库
│   ├── ui/             # UI 组件
│   └── blog/           # Blog 业务域
├── docs/               # 文档
└── tools/              # 工具脚本
```

详细结构请参考 [目录结构规范](../architecture/directory-structure.md)。

## 🛠️ 常用命令

### 开发

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
```

### 代码质量

```bash
pnpm lint             # 运行 ESLint 检查
pnpm lint:fix         # 自动修复 ESLint 问题
pnpm typecheck        # 运行 TypeScript 类型检查
pnpm check            # 运行类型检查和 lint
```

### 测试

```bash
pnpm test             # 运行单元测试
pnpm e2e              # 运行 E2E 测试
```

### Nx 命令

```bash
pnpm nx graph         # 查看项目依赖图
pnpm nx show project prism  # 查看项目信息
```

## 📝 开发流程

### 1. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

### 2. 开发

- 遵循 [代码组织规范](./code-organization.md)
- 使用 [导入规范](../architecture/import-rules.md)
- 遵循 [TypeScript 规范](../architecture/typescript-standards.md)

### 3. 提交代码

```bash
# 代码会自动格式化（通过 lint-staged）
git add .
git commit -m "feat: your feature description"
```

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 4. 推送和创建 PR

```bash
git push origin feature/your-feature-name
```

在 GitHub 上创建 Pull Request。

## 🎯 下一步

- 阅读 [代码组织规范](./code-organization.md) 了解如何组织代码
- 阅读 [API 集成指南](./api-integration.md) 了解如何集成 API
- 查看 [开发检查清单](./checklist.md) 确保代码质量

## ❓ 常见问题

### Q: 如何添加新的业务域？

A: 参考 `libs/blog` 的结构，创建新的业务域库。详见 [目录结构规范](../architecture/directory-structure.md)。

### Q: 如何添加新的 UI 组件？

A: 在 `libs/ui/src/components/` 下创建组件，参考现有组件的结构。

### Q: 如何调试？

A: 使用浏览器开发者工具和 VS Code 调试器。Next.js 支持断点调试。

### Q: 遇到类型错误怎么办？

A: 运行 `pnpm typecheck` 查看详细错误信息，根据提示修复。

---

**最后更新：** 2024-12-19  
**维护者：** 开发团队
