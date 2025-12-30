# 模块边界规则

本文档详细说明了 Prism 项目中 Nx monorepo 的模块边界规则、项目标签体系以及依赖管理规范。

## 🎯 核心原则

1. **清晰的依赖方向**：应用层 → 业务域库 → 共享库
2. **禁止循环依赖**：任何两个模块之间不能相互依赖
3. **依赖统一管理**：所有 npm 依赖在根目录 `package.json` 中声明
4. **工具强制约束**：通过 ESLint 规则自动检查，不靠自觉

---

## 📋 项目标签体系

### 标签类型

项目通过 `tags` 来标识其类型和作用域，这些标签用于：

- **模块边界检查**：ESLint 规则根据标签限制依赖关系
- **项目分类**：快速识别项目类型和用途
- **构建优化**：Nx 可以根据标签优化构建顺序

### 标签定义

#### 类型标签（`type:*`）

| 标签       | 含义                   | 示例项目         |
| ---------- | ---------------------- | ---------------- |
| `type:app` | 应用（可独立运行）     | `apps/prism`     |
| `type:lib` | 库（可被其他项目依赖） | `libs/blog`      |
| `type:ui`  | UI 组件库              | `libs/ui`        |
| `type:e2e` | E2E 测试项目           | `apps/prism-e2e` |

#### 作用域标签（`scope:*`）

| 标签             | 含义               | 示例项目      |
| ---------------- | ------------------ | ------------- |
| `scope:frontend` | 前端应用           | `apps/prism`  |
| `scope:shared`   | 共享库（跨域通用） | `libs/shared` |
| `scope:blog`     | Blog 业务域        | `libs/blog`   |
| `scope:recipe`   | Recipe 业务域      | `libs/recipe` |
| `scope:ui`       | UI 组件库          | `libs/ui`     |

### 标签配置示例

```json
// apps/prism/project.json
{
  "tags": ["type:app", "scope:frontend"]
}

// libs/blog/project.json
{
  "tags": ["type:lib", "scope:blog"]
}

// libs/shared/project.json
{
  "tags": ["type:lib", "scope:shared"]
}

// libs/ui/project.json
{
  "tags": ["type:ui", "scope:ui"]
}
```

---

## 🔒 模块边界规则

### 规则定义

模块边界规则在 `eslint.config.mjs` 中通过 `@nx/enforce-module-boundaries` 规则定义：

```javascript
'@nx/enforce-module-boundaries': [
  'error',
  {
    enforceBuildableLibDependency: true,
    depConstraints: [
      {
        sourceTag: 'type:app',
        onlyDependOnLibsWithTags: ['scope:shared', 'type:ui', 'type:lib'],
      },
      {
        sourceTag: 'type:lib',
        onlyDependOnLibsWithTags: ['type:lib', 'scope:shared'],
      },
      {
        sourceTag: 'scope:frontend',
        onlyDependOnLibsWithTags: [
          'scope:frontend',
          'scope:shared',
          'scope:ui',
          'scope:blog',
          'type:lib',
          'type:ui',
        ],
      },
      {
        sourceTag: 'scope:shared',
        onlyDependOnLibsWithTags: ['scope:shared'],
      },
    ],
  },
],
```

### 依赖关系图

```
┌─────────────────┐
│   apps/prism    │  (type:app, scope:frontend)
│                 │
│  ┌───────────┐  │
│  │ 可以依赖  │  │
│  └───────────┘  │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┬──────────────┐
         │                 │                 │              │
         ▼                 ▼                 ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ libs/blog    │  │ libs/recipe  │  │ libs/ui      │  │ libs/shared  │
│              │  │              │  │              │  │              │
│ (type:lib,   │  │ (type:lib,   │  │ (type:ui,    │  │ (type:lib,   │
│  scope:blog) │  │  scope:...)  │  │  scope:ui)   │  │  scope:shared)│
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       └─────────────────┴─────────────────┴─────────────────┘
                                    │
                                    ▼
                           ┌──────────────┐
                           │ libs/shared  │
                           │              │
                           │ (只能依赖自己)│
                           └──────────────┘
```

### 规则详解

#### 1. 应用层（`type:app`）

**可以依赖：**

- ✅ `scope:shared` - 共享库
- ✅ `type:ui` - UI 组件库
- ✅ `type:lib` - 业务域库

**示例：**

```typescript
// ✅ 正确：应用可以依赖业务域库
import { ArticleDetail } from '@prism/blog/components';
import { Button } from '@prism/ui/components/button';
import { debounce } from '@prism/shared';

// ❌ 错误：应用不能依赖其他应用
import { something } from '@prism/other-app';
```

#### 2. 业务域库（`type:lib`）

**可以依赖：**

- ✅ `type:lib` - 其他业务域库（需谨慎，避免循环依赖）
- ✅ `scope:shared` - 共享库

**不能依赖：**

- ❌ `type:app` - 应用层
- ❌ `type:ui` - UI 组件库（业务逻辑不应依赖 UI）

**示例：**

```typescript
// ✅ 正确：业务域库可以依赖共享库
import { ApiResponse } from '@prism/shared';
import { ArticleDetail } from '@prism/blog/components'; // 如果允许跨域依赖

// ❌ 错误：业务域库不能依赖应用层
import { getConfig } from '@/lib/config';

// ❌ 错误：业务域库不能依赖 UI 组件库
import { Button } from '@prism/ui/components/button';
```

#### 3. 前端应用（`scope:frontend`）

**可以依赖：**

- ✅ `scope:frontend` - 其他前端应用（如需要）
- ✅ `scope:shared` - 共享库
- ✅ `scope:ui` - UI 组件库
- ✅ `scope:blog` - Blog 业务域
- ✅ `type:lib` - 所有业务域库
- ✅ `type:ui` - UI 组件库

**示例：**

```typescript
// ✅ 正确：前端应用可以依赖所有库
import { ArticleDetail } from '@prism/blog';
import { Button } from '@prism/ui';
import { debounce } from '@prism/shared';
```

#### 4. 共享库（`scope:shared`）

**只能依赖：**

- ✅ `scope:shared` - 其他共享库（如需要）

**不能依赖：**

- ❌ 任何业务域库
- ❌ 任何应用层代码
- ❌ UI 组件库

**示例：**

```typescript
// ✅ 正确：共享库可以依赖其他共享库
import { ApiResponse } from '@prism/shared/api/types';

// ❌ 错误：共享库不能依赖业务域库
import { ArticleDetail } from '@prism/blog';

// ❌ 错误：共享库不能依赖应用层
import { getConfig } from '@/lib/config';
```

---

## 📦 依赖管理规则

### 为什么依赖要在根目录？

在 Nx monorepo 中，**所有 npm 依赖必须在根目录的 `package.json` 中声明**，原因如下：

1. **统一版本管理**：避免不同项目使用不同版本的依赖
2. **减少重复安装**：pnpm workspace 会统一管理依赖
3. **简化构建**：Nx 可以更好地优化构建缓存
4. **避免冲突**：防止版本冲突和重复打包

### 规则说明

#### ✅ 正确做法

```json
// package.json (根目录)
{
  "dependencies": {
    "react": "19.0.0",
    "next": "15.5.7",
    "@radix-ui/react-accordion": "^1.2.12",
    "embla-carousel-react": "^8.6.0"
  }
}
```

```json
// apps/prism/package.json
{
  "name": "@./prism",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
  // ❌ 不要在这里声明 dependencies
}
```

#### ❌ 错误做法

```json
// apps/prism/package.json
{
  "dependencies": {
    "react": "19.0.0", // ❌ 错误：应该在根目录声明
    "next": "15.5.7" // ❌ 错误：应该在根目录声明
  }
}
```

### 特殊情况

如果某个依赖**仅被特定应用使用**，仍然应该在根目录声明，但可以通过注释说明：

```json
// package.json (根目录)
{
  "dependencies": {
    // 仅 prism 应用使用
    "next": "15.5.7",
    // 仅 e2e 测试使用
    "@playwright/test": "^1.40.0"
  }
}
```

---

## 🔍 常见错误和解决方案

### 错误 1：模块边界违规

**错误信息：**

```
A project tagged with "scope:frontend" can only depend on libs tagged with "scope:frontend", "scope:shared"
```

**原因：** 尝试导入的库没有正确的标签，或标签规则不允许此依赖关系。

**解决方案：**

1. 检查被导入库的 `project.json` 中的 `tags`
2. 检查 `eslint.config.mjs` 中的 `depConstraints` 规则
3. 如果确实需要此依赖，更新规则或调整项目结构

### 错误 2：循环依赖

**错误信息：**

```
Could not execute command because the task graph has a circular dependency
```

**原因：** 两个或多个项目相互依赖，形成循环。

**解决方案：**

1. 识别循环依赖链
2. 提取公共代码到共享库
3. 使用依赖注入（如 `apiClient` 通过参数传入）

**示例：**

```typescript
// ❌ 错误：循环依赖
// libs/blog/api/queries.ts
import { apiClient } from '@/lib/api/client'; // 依赖应用层

// ✅ 正确：通过参数注入
// libs/blog/api/queries.ts
export function searchArticles(apiClient: ApiClient, params: SearchParams) {
  return apiClient.get('/articles', { params });
}

// apps/prism/lib/api/articles.ts
import { apiClient } from '@/lib/api/client';
import { searchArticles } from '@prism/blog';
export const searchArticlesWithClient = (params: SearchParams) =>
  searchArticles(apiClient, params);
```

### 错误 3：相对路径导入

**错误信息：**

```
Projects should use relative imports to import from other files within the same project.
```

**原因：** 在同一个项目内使用了路径别名，应该使用相对路径。

**解决方案：**

```typescript
// ❌ 错误：同一项目内使用别名
// libs/blog/src/components/ArticleSearchBox.tsx
import { searchArticles } from '@prism/blog/api/queries';

// ✅ 正确：同一项目内使用相对路径
import { searchArticles } from '../api/queries';
```

---

## 🛠️ 工具和命令

### 检查模块边界

```bash
# 运行 ESLint 检查（会自动检查模块边界）
pnpm lint

# 查看项目依赖图
pnpm nx graph

# 查看特定项目的依赖
pnpm nx show project prism --json | jq '.implicitDependencies'
```

### 可视化依赖关系

```bash
# 打开依赖图可视化界面
pnpm nx graph
```

在可视化界面中，你可以：

- 查看所有项目的依赖关系
- 识别循环依赖
- 查看特定项目的依赖树

---

## 📚 最佳实践

### 1. 保持依赖方向清晰

- **应用层** → **业务域库** → **共享库**
- 永远不要反向依赖

### 2. 避免业务域库之间的依赖

如果两个业务域库需要共享代码，应该：

- 提取到 `libs/shared`
- 或创建新的共享库

### 3. 使用依赖注入

当业务域库需要应用层的服务时，使用依赖注入：

```typescript
// ✅ 正确：通过参数注入
export function fetchData(apiClient: ApiClient) {
  return apiClient.get('/data');
}

// ❌ 错误：直接导入应用层
import { apiClient } from '@/lib/api/client';
```

### 4. 定期检查依赖图

定期运行 `pnpm nx graph` 检查依赖关系，确保：

- 没有意外的循环依赖
- 依赖方向符合架构设计
- 没有过度耦合

---

## 🔄 更新规则

如果需要修改模块边界规则：

1. **更新 `eslint.config.mjs`** 中的 `depConstraints`
2. **更新本文档**，说明变更原因
3. **运行测试**，确保没有破坏现有代码
4. **通知团队**，确保所有人了解变更

---

**最后更新：** 2024-12-19  
**维护者：** 架构团队
