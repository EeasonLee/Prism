# Prism 项目架构文档

> 版本：v1.0.0  
> 更新时间：2025-08-08  
> 项目状态：初始化完成

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [配置文件详解](#配置文件详解)
- [开发环境](#开发环境)
- [构建工具](#构建工具)
- [代码质量](#代码质量)
- [样式系统](#样式系统)
- [下一步计划](#下一步计划)

---

## 🎯 项目概述

### 项目定位

Prism 是一个基于 Nx Monorepo 的企业级中后台系统，采用现代化的技术栈和工程化实践。

### 核心特性

- 🏗️ **Monorepo 架构** - 使用 Nx 管理多个应用和库
- ⚡ **极速开发** - Vite 构建工具，热更新
- 🎨 **现代化 UI** - Tailwind CSS 原子化样式
- 🔒 **类型安全** - TypeScript 全面覆盖
- 📏 **代码规范** - ESLint + Prettier
- 📦 **高效包管理** - pnpm 工作空间

---

## 🛠️ 技术栈

### 核心技术

| 技术             | 版本    | 作用              |
| ---------------- | ------- | ----------------- |
| **Nx**           | 21.3.11 | Monorepo 管理工具 |
| **React**        | 19.0.0  | 前端框架          |
| **TypeScript**   | 5.8.2   | 类型系统          |
| **Vite**         | 6.0.0   | 构建工具          |
| **Tailwind CSS** | 3.4.3   | 样式框架          |
| **pnpm**         | 10.14.0 | 包管理器          |

### 开发工具

| 工具         | 版本   | 作用       |
| ------------ | ------ | ---------- |
| **ESLint**   | 9.8.0  | 代码检查   |
| **Prettier** | 2.6.2  | 代码格式化 |
| **SWC**      | 1.5.7  | 快速编译   |
| **PostCSS**  | 8.4.38 | CSS 处理   |

### 路由系统

| 技术             | 版本   | 作用       |
| ---------------- | ------ | ---------- |
| **React Router** | 6.29.0 | 客户端路由 |

---

## 📁 项目结构

```
/home/eason/projects/Prism/
├── .cursor/                    # Cursor编辑器配置
├── .git/                      # Git版本控制
├── .nx/                       # Nx缓存和元数据
├── .vscode/                   # VSCode配置
├── apps/                      # 应用目录
│   └── prism/                # 主应用
│       ├── public/           # 静态资源
│       ├── src/              # 源代码
│       │   ├── app/          # 应用组件
│       │   ├── assets/       # 资源文件
│       │   ├── main.tsx      # 入口文件
│       │   └── styles.css    # 全局样式
│       ├── index.html        # HTML模板
│       ├── package.json      # 应用配置
│       ├── vite.config.ts    # Vite配置
│       ├── tailwind.config.js # Tailwind配置
│       ├── tsconfig.json     # TypeScript配置
│       └── eslint.config.mjs # ESLint配置
├── node_modules/             # 依赖包
├── project-plan.md           # 项目计划文档
├── package.json              # 根项目配置
├── nx.json                   # Nx工作空间配置
├── tsconfig.base.json        # 基础TypeScript配置
├── eslint.config.mjs         # 根ESLint配置
├── pnpm-workspace.yaml       # pnpm工作空间配置
└── pnpm-lock.yaml           # 依赖锁定文件
```

---

## ⚙️ 配置文件详解

### 1. 根目录配置

#### package.json - 项目主配置

```json
{
  "name": "@./source",
  "version": "0.0.0",
  "license": "MIT",
  "private": true,
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "react-router-dom": "6.29.0"
  },
  "devDependencies": {
    "@nx/react": "21.3.11",
    "@nx/vite": "21.3.11",
    "vite": "^6.0.0",
    "typescript": "~5.8.2",
    "tailwindcss": "3.4.3",
    "eslint": "^9.8.0",
    "prettier": "^2.6.2"
  }
}
```

**作用：**

- 定义项目基本信息
- 管理全局依赖
- 配置 Nx 插件

#### nx.json - Nx 工作空间配置

```json
{
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)"]
  },
  "plugins": ["@nx/js/typescript", "@nx/react/router-plugin", "@nx/eslint/plugin", "@nx/vite/plugin"],
  "generators": {
    "@nx/react": {
      "application": {
        "style": "tailwind",
        "linter": "eslint",
        "bundler": "vite"
      }
    }
  }
}
```

**作用：**

- 配置 Nx 插件系统
- 定义构建输入输出
- 设置代码生成器默认值

#### tsconfig.base.json - 基础 TypeScript 配置

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "rootDir": ".",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "es2015",
    "module": "esnext",
    "lib": ["es2020", "dom"],
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "baseUrl": ".",
    "paths": {}
  }
}
```

**作用：**

- 定义 TypeScript 编译选项
- 配置模块解析策略
- 设置路径映射

### 2. 应用配置

#### apps/prism/vite.config.ts - Vite 构建配置

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/prism',
  server: {
    port: 4200,
    host: 'localhost',
  },
  plugins: [react()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
}));
```

**作用：**

- 配置开发服务器
- 设置构建输出
- 集成 React 插件

#### apps/prism/tailwind.config.js - Tailwind 配置

```javascript
const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');

module.exports = {
  content: [join(__dirname, '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'), ...createGlobPatternsForDependencies(__dirname)],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**作用：**

- 配置 Tailwind 扫描路径
- 自定义主题设置
- 集成 Nx 依赖分析

#### apps/prism/eslint.config.mjs - ESLint 配置

```javascript
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  ...compat.extends('@nx/react'),
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {},
  },
];
```

**作用：**

- 配置代码检查规则
- 集成 React 特定规则
- 设置 TypeScript 支持

---

## 🚀 开发环境

### 开发服务器

```bash
# 启动开发服务器
npx nx serve prism

# 访问地址
http://localhost:4200
```

### 构建项目

```bash
# 构建生产版本
npx nx build prism

# 预览构建结果
npx nx preview prism
```

### 代码检查

```bash
# 运行ESLint检查
npx nx lint prism

# 运行TypeScript类型检查
npx nx typecheck prism
```

---

## 🔧 构建工具

### Vite 特性

- ⚡ **极速启动** - 冷启动时间 < 100ms
- 🔥 **热更新** - 文件修改即时生效
- 📦 **智能打包** - 按需加载，优化体积
- 🛠️ **插件生态** - 丰富的插件支持

### SWC 编译器

- 🚀 **Rust 编写** - 性能极佳
- 🔄 **兼容 Babel** - 无缝迁移
- 📈 **增量编译** - 只编译变更文件

---

## 📏 代码质量

### ESLint 规则

- **React Hooks 规则** - 确保 Hooks 正确使用
- **JSX 可访问性** - 提升无障碍体验
- **导入排序** - 保持代码整洁
- **TypeScript 支持** - 类型安全检查

### Prettier 配置

```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true
}
```

---

## 🎨 样式系统

### Tailwind CSS

- **原子化 CSS** - 快速样式开发
- **响应式设计** - 移动优先
- **主题定制** - 灵活的颜色系统
- **JIT 模式** - 按需生成样式

### 样式文件结构

```
src/
├── styles.css          # 全局样式
└── app/
    └── app.tsx        # 组件样式
```

---

## 📋 下一步计划

### Phase 1: 工程化完善 (本周)

- [ ] 配置 Git Hooks (Husky)
- [ ] 设置 Conventional Commits
- [ ] 配置 CI/CD 流程
- [ ] 添加单元测试框架

### Phase 2: 核心功能 (下周)

- [ ] 集成状态管理 (Zustand)
- [ ] 配置数据请求 (TanStack Query)
- [ ] 创建 UI 组件库
- [ ] 实现路由系统

### Phase 3: 业务功能 (后续)

- [ ] 用户认证系统
- [ ] 权限管理模块
- [ ] 数据可视化
- [ ] 主题切换功能

---

## 📚 学习资源

### 官方文档

- [Nx 官方文档](https://nx.dev/getting-started/intro)
- [React 官方文档](https://react.dev/)
- [Vite 官方文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

### 最佳实践

- [React 最佳实践](https://react.dev/learn)
- [TypeScript 指南](https://www.typescriptlang.org/docs/)
- [ESLint 规则](https://eslint.org/docs/rules/)

---

## 🔍 项目状态

**当前版本：** v1.0.0  
**最后更新：** 2025-08-08  
**构建状态：** ✅ 正常  
**测试状态：** ⏳ 待配置  
**部署状态：** ⏳ 待配置

---

_本文档将随着项目发展持续更新_
