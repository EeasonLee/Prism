# ESLint 架构级 Import 规则配置计划

> **目标**：将 [`docs/architecture/file-layout-spec.md`](../../architecture/file-layout-spec.md) 第四章的依赖方向矩阵转换为 ESLint 可自动拦截的规则。
>
> **配置对象**：根目录 `eslint.config.mjs`（`@nx/enforce-module-boundaries`）+ `no-restricted-imports`

---

## 一、当前 ESLint 基线

根 `eslint.config.mjs` 已有 `@nx/enforce-module-boundaries` 规则，定义了以下 depConstraints：

```js
{ sourceTag: 'type:app',   onlyDependOnLibsWithTags: ['scope:shared', 'type:ui', 'type:lib'] },
{ sourceTag: 'type:lib',   onlyDependOnLibsWithTags: ['type:lib', 'scope:shared'] },
{ sourceTag: 'scope:frontend', onlyDependOnLibsWithTags: ['scope:frontend', 'scope:shared', 'scope:ui', 'scope:blog', 'type:lib', 'type:ui'] },
{ sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
```

**问题**：现有约束基于 `libs/` 之间的边界（`type:lib`、`scope:shared`），但 `features/`、`app/`、`infrastructure/` 都在同一个 `type:app scope:frontend` 标签下，**内部边界完全不受控**。

---

## 二、需要新增的规则

### 规则 1：L0 原子层禁止引用上层

```
libs/ui/  ❌→  features/
libs/ui/  ❌→  app/
```

**实施方案**：`@nx/enforce-module-boundaries` 已有 `type:lib` → 只能引 `type:lib` + `scope:shared`，已覆盖。确认生效即可。

---

### 规则 2：基础设施层禁止引用业务层

```
infrastructure/  ❌→  features/
infrastructure/  ❌→  app/
```

**实施方案**：`no-restricted-imports` 规则，在 `infrastructure/` 目录下的文件中拦截：

```js
// 追加到 eslint.config.mjs 的 overrides 中
{
  files: ['apps/jd-frontend/infrastructure/**/*.ts', 'apps/jd-frontend/infrastructure/**/*.tsx'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/features/*'],
          message: 'infrastructure/ 不能引用 features/，违反架构层级方向',
        },
        {
          group: ['@/app/*'],
          message: 'infrastructure/ 不能引用 app/',
        },
      ],
    }],
  },
}
```

---

### 规则 3：禁止 features 间深层路径 import

**允许**：

```ts
import { ProductCard } from '@/features/product';
```

**禁止**：

```ts
import { ProductCard } from '@/features/product/components/ProductCard';
import { getDetail } from '@/features/product/api/product-detail.api';
import { useCart } from '@/features/cart/hooks/useCart';
```

**注意**：同一个 feature 内部的文件互相引用（如 `api/` → `services/`）应该用相对路径，不应受此规则限制。

**实施方案**：

```js
{
  files: ['apps/jd-frontend/features/**/*.ts', 'apps/jd-frontend/features/**/*.tsx'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/features/*/components/*', '@/features/*/api/*', '@/features/*/services/*', '@/features/*/hooks/*'],
          message: '跨 feature 引用必须通过 index.ts 出口，请使用 import { X } from \'@/features/<name>\'',
        },
      ],
    }],
  },
}
```

---

### 规则 4：Feature 内部边界

```
features/*/services/  ❌→  features/*/components/   # 纯逻辑不能依赖 UI
features/*/services/  ❌→  features/*/hooks/         # 纯逻辑不能依赖 React hooks
features/*/api/       ❌→  features/*/components/    # 数据聚合不能依赖 UI
```

**实施方案**：对 services 和 api 子目录分别加 `no-restricted-imports`：

```js
// services/ 内部文件
{
  files: ['apps/jd-frontend/features/*/services/**/*.ts'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['../components/*', '*/components/*'], message: 'services/ 不能引用 components/（UI 层）' },
        { group: ['../hooks/*', '*/hooks/*'], message: 'services/ 不能引用 hooks/（React 层）' },
      ],
    }],
  },
},

// api/ 内部文件
{
  files: ['apps/jd-frontend/features/*/api/**/*.ts'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['../components/*', '*/components/*'], message: 'api/ 不能引用 components/（UI 层）' },
      ],
    }],
  },
}
```

---

### 规则 5：`app/_ui/` 边界

```
app/_ui/  ❌→  features/*/api/
app/_ui/  ❌→  features/*/services/
```

**允许** `app/_ui/` 引用 `features/*/components/`（通过 index.ts）—— 例如 Header 里的 MiniCart。

```js
{
  files: ['apps/jd-frontend/app/_ui/**/*.ts', 'apps/jd-frontend/app/_ui/**/*.tsx'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/features/*/api/*', '@/features/*/services/*'],
          message: 'app/_ui/ 不能引用 features 的 api/ 或 services/，布局壳只能引用领域组件',
        },
        {
          group: ['*/api/*', '*/services/*'],
          message: 'app/_ui/ 不能直接引用 features 的 api/ 或 services/',
        },
      ],
    }],
  },
}
```

---

## 三、实施步骤

| 步骤 | 动作                                  | 预期                                                   |
| ---- | ------------------------------------- | ------------------------------------------------------ |
| 1    | 在 `eslint.config.mjs` 中添加规则 2-5 | 新增 ~60 行配置                                        |
| 2    | 跑 `pnpm lint`，查看违规数量          | 预期会有现存违规（历史代码未遵守）                     |
| 3    | 逐条修复历史违规                      | 每修复一批提交一次                                     |
| 4    | 跑 `pnpm lint` 确认 0 error           |                                                        |
| 5    | 确认 CI 中 ESLint 阻断这些规则        | `eslint.ignoreDuringBuilds: false` 已在 next.config 中 |

---

## 四、注意事项

- `no-restricted-imports` 的 `group` 支持 glob 模式，但 **eslint-plugin-import 需要安装**（`eslint-plugin-import` 或使用 ESLint 内置的 `no-restricted-imports`）
- 如果项目使用 ESLint 9 flat config，`no-restricted-imports` 是 ESLint 内置规则，无需额外插件
- 规则 3 和规则 4 的 `files` glob 需要验证 `*` 在 `files` 中是否匹配 feature 名称（可能需要 `**` 或逐 feature 列出）
