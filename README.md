# Prism

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ 基于 [Nx](https://nx.dev) 和 [Next.js](https://nextjs.org) 的现代化 Web 应用工作区 ✨

这是一个使用 Nx 21.3.11 和 Next.js 15 构建的现代化 Web 应用项目，采用 pnpm 作为包管理器。

## 🚀 快速开始

### 开发环境启动

在安装依赖前，请先阅读《[开发环境约定](docs/dev-env.md)》，确保 Node/pnpm 版本正确。

启动 prism 应用的开发服务器：

```sh
pnpm nx run prism:dev
```

或者使用简写：

```sh
pnpm nx dev prism
```

应用将在 `http://localhost:3000` 启动。

### 构建生产版本

构建 prism 应用的生产版本：

```sh
pnpm nx run prism:build
```

### 查看项目信息

查看 prism 项目的所有可用任务：

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

| 命令                  | 描述           |
| --------------------- | -------------- |
| `pnpm nx dev prism`   | 启动开发服务器 |
| `pnpm nx build prism` | 构建生产版本   |
| `pnpm nx lint prism`  | 代码检查       |
| `pnpm nx test prism`  | 运行测试       |
| `pnpm nx graph`       | 查看依赖图     |

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
