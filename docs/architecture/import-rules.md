# 导入规范

本文档定义了 Prism 项目中 Import 路径的使用规范和最佳实践。

## 🎯 核心原则

1. **优先使用路径别名**，避免相对路径超过 2 层（`../../`）
2. **根据代码位置选择合适的别名**
3. **保持导入路径清晰、可读**

---

## 📦 路径别名体系

### 共享库别名（`tsconfig.base.json`）

这些别名在所有项目中可用：

| 别名              | 路径            | 使用场景                               |
| ----------------- | --------------- | -------------------------------------- |
| `@prism/shared/*` | `libs/shared/*` | 共享基础库（API 类型、工具函数、常量） |
| `@prism/ui/*`     | `libs/ui/*`     | UI 组件库                              |
| `@prism/blog/*`   | `libs/blog/*`   | Blog 业务域库                          |
| `@prism/recipe/*` | `libs/recipe/*` | Recipe 业务域库                        |

### 应用层别名（`apps/prism/tsconfig.app.json`）

这些别名仅在 `apps/prism/` 内部使用：

| 别名             | 路径                      | 使用场景                      |
| ---------------- | ------------------------- | ----------------------------- |
| `@/app/*`        | `apps/prism/app/*`        | Next.js App Router 路由和页面 |
| `@/components/*` | `apps/prism/components/*` | 应用级组件                    |
| `@/lib/*`        | `apps/prism/lib/*`        | 应用级工具函数                |

> **注意：** `@/*` 作为兼容别名保留，但新代码应使用更具体的别名（`@/app/*`、`@/components/*`、`@/lib/*`）。

---

## ✅ 正确示例

### 示例 1：从应用层导入共享库

```typescript
// apps/prism/app/page.tsx
import { ApiResponse } from '@prism/shared/api/types';
import { Button } from '@prism/ui/components/button';
import { useBlogPosts } from '@prism/blog/hooks/useBlogPosts';
```

### 示例 2：从业务域库导入共享库

```typescript
// libs/blog/api/queries.ts
import { ApiResponse } from '@prism/shared/api/types';
import { formatDate } from '@prism/shared/utils/format-date';
```

### 示例 3：应用层内部导入

```typescript
// apps/prism/app/blog/page.tsx
import { BlogList } from '@/components/BlogList';
import { getBlogPosts } from '@/lib/api/blog';
```

### 示例 4：业务域库内部导入

```typescript
// libs/blog/components/BlogCard.tsx
import { useBlogPost } from '@prism/blog/hooks/useBlogPost';
import { BlogPost } from '@prism/blog/api/types';
```

---

## ❌ 错误示例

### 错误 1：使用相对路径超过 2 层

```typescript
// ❌ 错误
import { Button } from '../../../libs/ui/components/button';
import { formatDate } from '../../../../libs/shared/utils/format-date';

// ✅ 正确
import { Button } from '@prism/ui/components/button';
import { formatDate } from '@prism/shared/utils/format-date';
```

### 错误 2：跨层级的相对路径

```typescript
// ❌ 错误：从应用层直接相对路径到 libs
import { Button } from '../../libs/ui/components/button';

// ✅ 正确：使用路径别名
import { Button } from '@prism/ui/components/button';
```

### 错误 3：使用错误的别名

```typescript
// ❌ 错误：在 libs/blog 中使用应用层别名
import { BlogList } from '@/components/BlogList';

// ✅ 正确：在 libs/blog 中使用业务域别名
import { BlogCard } from '@prism/blog/components/BlogCard';
```

### 错误 4：反向依赖

```typescript
// ❌ 错误：共享库不能依赖业务域库
// libs/shared/utils/format.ts
import { BlogPost } from '@prism/blog/api/types'; // 禁止！

// ✅ 正确：业务域库依赖共享库
// libs/blog/api/queries.ts
import { ApiResponse } from '@prism/shared/api/types';
```

---

## 🔍 导入路径决策树

### 判断应该使用哪个别名？

```
开始
  │
  ├─ 导入共享基础库（API 类型、工具、常量）？
  │   └─ 是 → @prism/shared/*
  │   └─ 否 ↓
  │
  ├─ 导入 UI 组件库？
  │   └─ 是 → @prism/ui/*
  │   └─ 否 ↓
  │
  ├─ 导入业务域库？
  │   └─ 是 → @prism/[domain]/*
  │   └─ 否 ↓
  │
  └─ 在 apps/prism 内部导入？
      ├─ 导入 app/ → @/app/*
      ├─ 导入 components/ → @/components/*
      └─ 导入 lib/ → @/lib/*
```

---

## 📋 导入顺序规范

按照以下顺序组织 import 语句：

1. **外部依赖**（React、Next.js 等）
2. **共享库**（`@prism/shared/*`）
3. **UI 组件库**（`@prism/ui/*`）
4. **业务域库**（`@prism/blog/*`、`@prism/recipe/*`）
5. **应用层**（`@/app/*`、`@/components/*`、`@/lib/*`）
6. **相对路径**（仅限同目录或相邻目录）

### 示例

```typescript
// 1. 外部依赖
import { useState } from 'react';
import { NextPage } from 'next';

// 2. 共享库
import { ApiResponse } from '@prism/shared/api/types';
import { formatDate } from '@prism/shared/utils/format-date';

// 3. UI 组件库
import { Button } from '@prism/ui/components/button';
import { Card } from '@prism/ui/components/card';

// 4. 业务域库
import { useBlogPosts } from '@prism/blog/hooks/useBlogPosts';
import { BlogPost } from '@prism/blog/api/types';

// 5. 应用层
import { BlogLayout } from '@/components/BlogLayout';
import { getBlogMetadata } from '@/lib/api/blog';

// 6. 相对路径（仅限同目录或相邻目录）
import { BlogCard } from './BlogCard';
import { styles } from '../styles';
```

---

## 🛠️ 路径别名配置

### TypeScript 配置

路径别名在以下文件中配置：

- **`tsconfig.base.json`**：共享库别名（所有项目可用）
- **`apps/prism/tsconfig.app.json`**：应用层别名（仅限 apps/prism）

### Next.js 配置

在 Nx 工作区中，`@nx/next/plugins/with-nx` 插件会自动处理路径别名，**无需在 `next.config.js` 中额外配置**。

---

## 🔄 迁移指南

### 从相对路径迁移到路径别名

#### 步骤 1：识别需要迁移的导入

查找所有超过 2 层的相对路径：

```bash
# 查找所有超过 2 层的相对路径
grep -r "\.\./\.\./\.\./" apps/ libs/
```

#### 步骤 2：确定正确的别名

根据文件位置和导入目标，确定应使用的别名（参考上面的决策树）。

#### 步骤 3：批量替换

可以使用 IDE 的查找替换功能，或编写脚本批量替换。

#### 步骤 4：验证

替换后运行类型检查：

```bash
nx typecheck prism
```

---

## 📚 最佳实践

### 1. 统一使用路径别名

- ✅ 优先使用路径别名
- ❌ 避免相对路径超过 2 层

### 2. 保持导入路径清晰

- ✅ 使用完整的别名路径，如 `@prism/shared/api/types`
- ❌ 避免过度简化，如 `@prism/shared`（除非有统一的 `index.ts` 导出）

### 3. 使用 `index.ts` 统一导出

在库的根目录创建 `index.ts`，统一导出公共 API：

```typescript
// libs/shared/index.ts
export * from './api/types';
export * from './utils/format-date';
export * from './constants';
```

然后可以简化导入：

```typescript
// 简化前
import { ApiResponse } from '@prism/shared/api/types';
import { formatDate } from '@prism/shared/utils/format-date';

// 简化后（如果使用 index.ts）
import { ApiResponse, formatDate } from '@prism/shared';
```

### 4. 避免循环依赖

- 共享库不能依赖业务域库
- 业务域库之间应避免相互依赖
- 应用层可以依赖所有库

---

## 🚫 常见错误

### 错误 1：在共享库中使用应用层别名

```typescript
// ❌ libs/shared/utils/format.ts
import { getConfig } from '@/lib/config'; // 错误！共享库不能使用应用层别名

// ✅ 如果确实需要配置，应该通过参数传入
export function formatDate(date: Date, locale: string) {
  // ...
}
```

### 错误 2：路径别名拼写错误

```typescript
// ❌ 拼写错误
import { Button } from '@prism/ui/component/button'; // component 应该是 components

// ✅ 正确
import { Button } from '@prism/ui/components/button';
```

### 错误 3：使用不存在的别名

```typescript
// ❌ 使用未定义的别名
import { Something } from '@prism/unknown/something';

// ✅ 检查 tsconfig.base.json 中是否定义了该别名
```

---

## 📖 相关文档

- [目录结构规范](./directory-structure.md) - 了解代码应该放在哪里
- [模块边界规则](./module-boundaries.md) - 了解模块之间的依赖关系
- [TypeScript 规范](./typescript-standards.md) - 了解类型定义规范

---

## 🔍 验证工具

### 检查导入路径

运行 ESLint 检查（如果配置了相关规则）：

```bash
nx lint prism
```

### 检查类型

运行 TypeScript 类型检查：

```bash
nx typecheck prism
```

### 检查模块边界

运行 Nx 依赖图检查：

```bash
nx graph
```

---

**最后更新：** 2024-12-19  
**维护者：** 架构团队
