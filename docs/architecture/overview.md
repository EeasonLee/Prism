# 架构概览

本文档提供 Prism 项目的整体架构概览，帮助新成员快速理解项目结构。

## 🏗️ 架构层次

```
┌─────────────────────────────────────────────────────────┐
│                   应用层 (apps/prism)                    │
│  - Next.js App Router                                   │
│  - 页面组件和路由                                        │
│  - 应用特定逻辑                                          │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│  业务域库       │   │   UI 组件库      │
│  (libs/blog)   │   │  (libs/ui)       │
│  (libs/recipe) │   │                  │
└───────┬────────┘   └────────┬────────┘
        │                     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │   共享基础库         │
        │  (libs/shared)      │
        │  - API 类型和客户端 │
        │  - 工具函数         │
        │  - 类型定义         │
        └─────────────────────┘
```

## 📦 核心模块

### 1. 应用层 (`apps/prism`)

**职责：**

- 路由和页面组织
- 应用级别的配置和初始化
- 连接业务域和 UI 组件

**特点：**

- 使用 Next.js App Router
- 支持服务端渲染（SSR）和静态生成（SSG）
- 应用特定的业务逻辑

### 2. 业务域库 (`libs/{domain}`)

**职责：**

- 封装特定业务域的逻辑
- 提供业务相关的 API 接口
- 业务组件和 Hooks

**当前业务域：**

- `libs/blog` - 博客相关功能
- `libs/recipe` - 食谱相关功能（待迁移）

**特点：**

- 独立可测试
- 可被多个应用复用
- 清晰的业务边界

### 3. UI 组件库 (`libs/ui`)

**职责：**

- 提供可复用的 UI 组件
- 基础组件（Button、Input、Select 等）
- 布局组件（PageContainer 等）

**特点：**

- 无业务逻辑
- 纯展示组件
- 可被所有业务域使用

### 4. 共享基础库 (`libs/shared`)

**职责：**

- API 类型定义和客户端
- 通用工具函数
- 类型定义（工具类型、状态类型、类型守卫）

**特点：**

- 跨业务域共享
- 不依赖其他库
- 提供基础能力

## 🔄 依赖关系

### 依赖方向

```
apps/prism
  ↓
libs/blog, libs/recipe, libs/ui
  ↓
libs/shared
```

### 依赖规则

1. **应用层** 可以依赖所有库
2. **业务域库** 可以依赖 `libs/shared` 和 `libs/ui`
3. **UI 组件库** 只能依赖 `libs/shared`
4. **共享库** 不能依赖任何其他库

### 模块边界检查

通过 ESLint 规则 `@nx/enforce-module-boundaries` 自动检查：

- 禁止循环依赖
- 强制依赖方向
- 标签约束

## 🛠️ 技术栈

### 核心框架

- **Next.js 15** - React 框架，App Router
- **React 19** - UI 库
- **TypeScript 5.8** - 类型系统

### 构建工具

- **Nx 21.3.11** - Monorepo 管理
- **pnpm** - 包管理器

### 样式

- **Tailwind CSS 3.4** - 原子化 CSS

### 代码质量

- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **TypeScript** - 类型检查

## 📁 目录结构

```
Prism/
├── apps/
│   └── prism/              # Next.js 应用
│       ├── app/            # App Router 页面
│       ├── lib/            # 应用层工具和 API 包装
│       └── components/     # 应用特定组件
├── libs/
│   ├── shared/             # 共享基础库
│   │   ├── api/           # API 类型和客户端
│   │   ├── types/         # 类型定义
│   │   └── utils/         # 工具函数
│   ├── ui/                 # UI 组件库
│   │   └── components/     # UI 组件
│   ├── blog/               # Blog 业务域
│   │   ├── api/           # Blog API
│   │   ├── components/     # Blog 组件
│   │   └── hooks/         # Blog Hooks
│   └── recipe/             # Recipe 业务域（待迁移）
├── docs/                   # 文档
│   ├── architecture/       # 架构文档
│   └── development/        # 开发指南
└── tools/                  # 工具脚本
```

## 🎯 设计原则

### 1. 分层架构

- 清晰的层次划分
- 单向依赖关系
- 职责明确

### 2. 模块化

- 业务域独立
- 可复用组件
- 易于测试

### 3. 类型安全

- 完整的 TypeScript 类型
- 类型工具和守卫
- 编译时错误检查

### 4. 工具强制

- ESLint 规则检查
- Git Hooks 验证
- CI 自动检查

## 📚 相关文档

- [目录结构规范](./directory-structure.md) - 详细的目录组织规则
- [模块边界规则](./module-boundaries.md) - 依赖关系约束
- [导入规范](./import-rules.md) - Import 路径使用
- [TypeScript 规范](./typescript-standards.md) - 类型定义规范

---

**最后更新：** 2024-12-19  
**维护者：** 架构团队
