# 代码组织规范

本文档说明如何在 Prism 项目中组织和放置代码。

## 🎯 核心原则

1. **代码放在正确的位置** - 根据职责选择合适的位置
2. **遵循分层架构** - 应用层、业务域、UI、共享库
3. **保持模块独立** - 每个模块职责单一、边界清晰

## 📁 代码放置规则

### 应用层代码 (`apps/prism/`)

**放置位置：**

- `app/` - Next.js App Router 页面和路由
- `lib/` - 应用层工具函数和 API 包装
- `components/` - 应用特定的组件（不通用）

**何时使用：**

- 页面组件和路由
- 应用级别的配置
- 连接业务域和 UI 的适配层

**示例：**

```typescript
// apps/prism/app/blog/page.tsx - 页面组件
// apps/prism/lib/api/articles.ts - API 包装（注入 apiClient）
```

### 业务域代码 (`libs/{domain}/`)

**放置位置：**

- `api/` - 业务 API 类型和查询函数
- `components/` - 业务组件
- `hooks/` - 业务 Hooks

**何时使用：**

- 特定业务域的逻辑
- 可被多个应用复用的业务代码
- 业务相关的类型定义

**示例：**

```typescript
// libs/blog/src/api/types.ts - Blog 类型定义
// libs/blog/src/components/ArticleDetail.tsx - Blog 组件
```

### UI 组件 (`libs/ui/`)

**放置位置：**

- `components/` - 可复用的 UI 组件

**何时使用：**

- 无业务逻辑的纯展示组件
- 可被所有业务域使用的组件
- 基础 UI 组件（Button、Input 等）

**示例：**

```typescript
// libs/ui/src/components/button.tsx - 基础按钮组件
// libs/ui/src/components/PageContainer.tsx - 布局组件
```

### 共享代码 (`libs/shared/`)

**放置位置：**

- `api/` - API 类型和客户端
- `types/` - 类型定义
- `utils/` - 工具函数
- `constants/` - 常量

**何时使用：**

- 跨业务域共享的代码
- 不依赖任何其他库的代码
- 基础能力和工具

**示例：**

```typescript
// libs/shared/src/api/types/common.ts - 通用 API 类型
// libs/shared/src/utils/debounce.ts - 工具函数
```

## 🔍 决策流程

### 如何决定代码位置？

```
新代码
  ↓
是页面/路由？
  ├─ 是 → apps/prism/app/
  └─ 否 ↓
    是业务逻辑？
       ├─ 是 → libs/{domain}/
       └─ 否 ↓
         是 UI 组件？
            ├─ 是 → libs/ui/
            └─ 否 → libs/shared/
```

### 具体场景

#### 场景 1: 添加新的 Blog 功能

**问题：** 需要添加文章评论功能

**决策：**

- 评论类型定义 → `libs/blog/src/api/types.ts`
- 评论查询函数 → `libs/blog/src/api/queries.ts`
- 评论组件 → `libs/blog/src/components/CommentList.tsx`
- 评论页面 → `apps/prism/app/blog/[slug]/comments/page.tsx`

#### 场景 2: 添加新的 UI 组件

**问题：** 需要一个通用的 Modal 组件

**决策：**

- Modal 组件 → `libs/ui/src/components/modal.tsx`
- 如果 Modal 只在 Blog 使用且包含业务逻辑 → `libs/blog/src/components/ArticleModal.tsx`

#### 场景 3: 添加工具函数

**问题：** 需要一个日期格式化函数

**决策：**

- 如果只在一个业务域使用 → 放在该业务域
- 如果多个业务域使用 → `libs/shared/src/utils/date.ts`

## 📝 文件命名规范

### 组件文件

- 使用 PascalCase：`ArticleDetail.tsx`
- 文件名与组件名一致

### 工具文件

- 使用 camelCase：`debounce.ts`
- 导出函数名与文件名一致

### 类型文件

- 使用 camelCase：`types.ts`、`common.ts`
- 或使用描述性名称：`api-types.ts`

### 页面文件

- 遵循 Next.js 约定：`page.tsx`、`layout.tsx`、`error.tsx`

## ✅ 检查清单

在提交代码前，确认：

- [ ] 代码放在正确的位置（应用层/业务域/UI/共享）
- [ ] 没有违反模块边界规则
- [ ] 使用正确的路径别名导入
- [ ] 文件命名符合规范
- [ ] 类型定义完整

## 📚 相关文档

- [目录结构规范](../architecture/directory-structure.md) - 详细的目录组织规则
- [模块边界规则](../architecture/module-boundaries.md) - 依赖关系约束
- [导入规范](../architecture/import-rules.md) - Import 路径使用

---

**最后更新：** 2024-12-19  
**维护者：** 开发团队
