# 面包屑统一实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将全站 4 种面包屑实现统一为单一 `Breadcrumb` 组件（`app/_ui/Breadcrumb.tsx`），桌面端完整路径 + 移动端折叠/横向滚动，全设计 Token 化，补充分类页与商品详情页的 BreadcrumbList Schema。

**Architecture:** 组件层：创建 L2 布局壳组件 `app/_ui/Breadcrumb.tsx`（客户端组件）替代 `features/blog/components/Breadcrumb.tsx`。数据层：Breadcrumb 组件挂载时自动将 items 写入 Zustand store，后续页面渲染时合并 store 历史与 props（保留筛选参数的 href）。SEO Schema 纯服务端数据驱动。逐页面替换内联 HTML 和旧组件引用。

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Zustand, `@prism/ui` PageContainer

---

## 文件结构

```
apps/jd-frontend/app/_ui/
├── Breadcrumb.tsx              # [NEW] 统一面包屑 UI 组件（客户端组件）
└── useBreadcrumbStore.ts       # [NEW] Zustand store — 导航历史栈

apps/jd-frontend/features/blog/components/
├── Breadcrumb.tsx              # [DELETE] 旧组件
└── index.ts                    # [MODIFY] 移除 Breadcrumb 导出

apps/jd-frontend/features/blog/
└── index.ts                    # [MODIFY] 移除 Breadcrumb 导出

# 6 个页面替换面包屑实现：
apps/jd-frontend/app/blog/[category]/[slug]/page.tsx       # [MODIFY] 替换导入 + 调整 items 构建
apps/jd-frontend/app/blog/[category]/page.tsx               # [MODIFY] 替换导入
apps/jd-frontend/features/recipe/components/RecipeDetail.tsx # [MODIFY] 替换内联 HTML
apps/jd-frontend/app/recipes/[category]/[slug]/page.tsx     # [MODIFY] 传入 items prop
apps/jd-frontend/app/categories/[slug]/CategoryPageContent.tsx # [MODIFY] 替换内联 HTML + 接收 items prop
apps/jd-frontend/app/categories/[slug]/page.tsx             # [MODIFY] 补充 Schema + 传递 items
apps/jd-frontend/app/products/[slug]/page.tsx               # [MODIFY] 替换内联 HTML + 补充 Schema
```

---

### Task 1: 安装 Zustand 依赖

**Files:**

- Modify: `apps/jd-frontend/package.json`

- [ ] **Step 1: 在 jd-frontend 应用中安装 zustand**

```bash
cd D:/work/jd-frontend/.worktrees/breadcrumb && pnpm --filter @./jd-frontend add zustand
```

- [ ] **Step 2: 验证安装**

```bash
cd D:/work/jd-frontend/.worktrees/breadcrumb && cat apps/jd-frontend/package.json | grep zustand
```

预期：`package.json` 的 `dependencies` 中出现 `"zustand": "^5.x.x"`

---

### Task 2: 创建导航历史 Zustand Store

**Files:**

- Create: `apps/jd-frontend/app/_ui/useBreadcrumbStore.ts`

- [ ] **Step 1: 编写 store**

```typescript
// apps/jd-frontend/app/_ui/useBreadcrumbStore.ts
import { create } from 'zustand';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbStoreState {
  /** 导航历史，每项含完整 URL（含 search params） */
  history: BreadcrumbItem[];
  /** 将当前页面 items + currentUrl 合并到历史 */
  track: (items: BreadcrumbItem[], currentUrl: string) => void;
}

export const useBreadcrumbStore = create<BreadcrumbStoreState>((set, get) => ({
  history: [],

  track: (items, currentUrl) => {
    const { history } = get();
    const newHistory = mergeHistory(history, items, currentUrl);
    set({ history: newHistory });
  },
}));

/**
 * 以「最长公共前缀」策略合并新旧面包屑路径。
 *
 * 公共前缀命中 → 保留历史的 href（已在历史中的链接不覆盖，防止丢失筛选参数）。
 * 超出公共前缀的历史项 → 丢弃（用户通过面包屑跳回或导航到不同分支）。
 * 当前页（最后一项）→ 使用 currentUrl 作为 href（含 search params，供后续页面的 resolveItems 回填）。
 */
function mergeHistory(
  history: BreadcrumbItem[],
  items: BreadcrumbItem[],
  currentUrl: string
): BreadcrumbItem[] {
  if (history.length === 0) {
    // 首访：把 currentUrl 赋给最后一项（当前页），以便后续页面复用
    return items.map((item, i) =>
      i === items.length - 1 ? { ...item, href: currentUrl } : item
    );
  }

  // 最长公共前缀
  let commonLen = 0;
  while (
    commonLen < history.length &&
    commonLen < items.length &&
    history[commonLen].label === items[commonLen].label
  ) {
    commonLen++;
  }

  // 公共前缀保持历史项（保留已存储的 href）
  const result: BreadcrumbItem[] = history
    .slice(0, commonLen)
    .map(h => ({ ...h }));

  // 新项追加
  for (let i = commonLen; i < items.length; i++) {
    const isLast = i === items.length - 1;
    result.push({
      label: items[i].label,
      href: isLast ? currentUrl : items[i].href,
    });
  }

  return result;
}
```

---

### Task 3: 创建统一 Breadcrumb 组件

**Files:**

- Create: `apps/jd-frontend/app/_ui/Breadcrumb.tsx`

**Props API:**

```typescript
interface BreadcrumbItem {
  label: string;
  href?: string; // 最后一项（当前页）不传 href
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]; // 服务端传入的默认面包屑
  className?: string;
}
```

**行为：**

- 客户端组件，使用 `useBreadcrumbStore` store
- 挂载时自动将 `items` 写入 store（`useEffect` 中调用 `track(items)`）
- 渲染时：如果 store 中有历史 → 用历史数据渲染（保留筛选参数的 href）；否则用 props `items`
- `items` 空数组 → `return null`
- 最后一项无 href，渲染为 `aria-current="page"` + `font-medium`
- 使用 `/` 分隔符，`text-ink-faint` 颜色
- 链接：`text-ink-muted`，hover → `text-ink`
- 移动端折叠：items ≥ 3 时显示 `首项 / … / 当前项`，`…` 点击展开横向滚动
- 横向滚动容器使用 `no-scrollbar`（项目中已有的全局类）

- [ ] **Step 1: 编写 Breadcrumb 组件**

```typescript
// apps/jd-frontend/app/_ui/Breadcrumb.tsx
'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { cn } from '@prism/shared';
import { useBreadcrumbStore, type BreadcrumbItem } from './useBreadcrumbStore';

export type { BreadcrumbItem };

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const history = useBreadcrumbStore(s => s.history);
  const track = useBreadcrumbStore(s => s.track);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLOListElement>(null);

  // 挂载时将当前页面 items + URL 写入 store
  useEffect(() => {
    if (items.length > 0) {
      const currentUrl = window.location.pathname + window.location.search;
      track(items, currentUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅在挂载时执行一次

  // 合并：优先使用 history 中同名 label 的 href
  const resolvedItems = resolveItems(items, history);

  if (!resolvedItems || resolvedItems.length === 0) {
    return null;
  }

  const isCollapsible = resolvedItems.length >= 3;

  // 展开时自动滚动到末尾
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  }, [expanded]);

  return (
    <nav className={cn('min-w-0 text-sm', className)} aria-label="Breadcrumb">
      {/* ---- 桌面端：完整路径 ---- */}
      <ol className="hidden items-center gap-2 md:flex">
        {resolvedItems.map((item, index) => (
          <li key={item.label + index} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-ink-faint" aria-hidden="true">
                /
              </span>
            )}
            {index === resolvedItems.length - 1 ? (
              <span className="text-ink font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href as Route}
                className="text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {/* ---- 移动端 ---- */}
      {isCollapsible ? (
        <div className="flex md:hidden">
          {expanded ? (
            /* 展开态：横向滚动完整路径 */
            <ol
              ref={scrollRef}
              className="no-scrollbar flex items-center gap-2 overflow-x-auto whitespace-nowrap"
              role="list"
            >
              {resolvedItems.map((item, index) => (
                <li
                  key={item.label + index}
                  className="flex items-center gap-2"
                >
                  {index > 0 && (
                    <span className="text-ink-faint" aria-hidden="true">
                      /
                    </span>
                  )}
                  {index === resolvedItems.length - 1 ? (
                    <span className="text-ink font-medium" aria-current="page">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href as Route}
                      className="text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            /* 折叠态：首项 / ... / 当前项 */
            <ol className="flex items-center gap-2">
              <li>
                <Link
                  href={resolvedItems[0].href as Route}
                  className="text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {resolvedItems[0].label}
                </Link>
              </li>
              <li>
                <span className="text-ink-faint" aria-hidden="true">
                  /
                </span>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  aria-label="Show full breadcrumb path"
                >
                  …
                </button>
              </li>
              <li>
                <span className="text-ink-faint" aria-hidden="true">
                  /
                </span>
              </li>
              <li>
                <span className="text-ink font-medium" aria-current="page">
                  {resolvedItems[resolvedItems.length - 1].label}
                </span>
              </li>
            </ol>
          )}
        </div>
      ) : (
        /* items ≤ 2：移动端同桌面 */
        <ol className="flex items-center gap-2 md:hidden">
          {resolvedItems.map((item, index) => (
            <li key={item.label + index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-ink-faint" aria-hidden="true">
                  /
                </span>
              )}
              {index === resolvedItems.length - 1 ? (
                <span className="text-ink font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href as Route}
                  className="text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}

/**
 * 合并策略：history 中有相同 label 的项 → 用 history 的 href（保留筛选参数），
 * history 中没有的 → 用 props 的值。
 * 如果 history 为空（直接访问），全部用 props。
 */
function resolveItems(
  propsItems: BreadcrumbItem[],
  history: BreadcrumbItem[]
): BreadcrumbItem[] {
  if (history.length === 0) return propsItems;

  return propsItems.map(item => {
    const historyMatch = history.find(h => h.label === item.label);
    if (historyMatch?.href) {
      return { ...item, href: historyMatch.href };
    }
    return item;
  });
}
```

- [ ] **Step 2: 验证组件 TypeScript 编译**

```bash
cd D:/work/jd-frontend/.worktrees/breadcrumb && pnpm nx typecheck jd-frontend
```

---

### Task 4: 替换 Blog 详情页面包屑

**Files:**

- Modify: `apps/jd-frontend/app/blog/[category]/[slug]/page.tsx`

当前（第 11 行）：`import { Breadcrumb } from '@/features/blog/components/Breadcrumb';`
替换为：`import { Breadcrumb } from '@/app/_ui/Breadcrumb';`

当前（第 106-109 行）创建 `breadcrumbItems` 时，最后一项用 `href: '#'`，需改为不传 `href`。

- [ ] **Step 1: 修改 blog/[category]/[slug]/page.tsx**

  将 `import { Breadcrumb } from '@/features/blog/components/Breadcrumb';` 替换为 `import { Breadcrumb } from '@/app/_ui/Breadcrumb';`

  `breadcrumbItems` 调整：最后一项不传 `href`（之前传 `href: '#'`）：

  ```typescript
  const breadcrumbItems = breadcrumbSource.map((item, index) => ({
    label: item.name,
    ...(index < breadcrumbSource.length - 1 ? { href: item.path } : {}),
  }));
  ```

---

### Task 5: 替换 Blog 分类页面包屑

**Files:**

- Modify: `apps/jd-frontend/app/blog/[category]/page.tsx`

当前（第 16 行）：`import { Breadcrumb } from '@/features/blog/components/Breadcrumb';`
替换为：`import { Breadcrumb } from '@/app/_ui/Breadcrumb';`

- [ ] **Step 1: 修改 blog/[category]/page.tsx**

  替换导入语句，breadcrumbItems 构建逻辑不变。

---

### Task 6: 替换 Recipe 详情页面包屑

**Files:**

- Modify: `apps/jd-frontend/features/recipe/components/RecipeDetail.tsx`
- Modify: `apps/jd-frontend/app/recipes/[category]/[slug]/page.tsx`

当前 RecipeDetail 内联了完整的面包屑 HTML（第 62-114 行）。改为接收 `breadcrumbItems: BreadcrumbItem[]` prop 并渲染 `<Breadcrumb>`。

- [ ] **Step 1: 修改 RecipeDetail.tsx**

  1. 移除内联面包屑 HTML（第 62-114 行：`<div className="border-b border-gray-200">...` 整个区块）
  2. 移除未使用的面包屑计算变量：`parentHref`、`parentLabel`、`category`、`categoryId`、`categoryName`
  3. 在 props 中添加 `breadcrumbItems: BreadcrumbItem[]`
  4. 在同样位置渲染：

  ```tsx
  import { Breadcrumb, type BreadcrumbItem } from '@/app/_ui/Breadcrumb';

  // 在组件中
  <div className="border-b border-line bg-white">
    <PageContainer className="py-4">
      <Breadcrumb items={breadcrumbItems} />
    </PageContainer>
  </div>;
  ```

  注意：`border-gray-200` → `border-line`（设计 Token 化）

- [ ] **Step 2: 修改 recipes/[category]/[slug]/page.tsx**

  构建 `breadcrumbItems` 并传入：

  ```typescript
  import { type BreadcrumbItem } from '@/app/_ui/Breadcrumb';

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Recipes', href: '/recipes' },
    ...(primaryCategory
      ? [
          {
            label: primaryCategory.name,
            href: `/recipes/${primaryCategory.slug}`,
          },
        ]
      : []),
    { label: recipe.title },
  ];
  ```

  传递给 `<RecipeDetail recipe={recipe} breadcrumbItems={breadcrumbItems} />`

  Schema 部分已有 `buildBreadcrumbSchema` 调用，无需改动。

---

### Task 7: 替换分类页面包屑 + 补充 Schema

**Files:**

- Modify: `apps/jd-frontend/app/categories/[slug]/CategoryPageContent.tsx`
- Modify: `apps/jd-frontend/app/categories/[slug]/page.tsx`

- [ ] **Step 1: 修改 CategoryPageContent.tsx**

  移除第 182-201 行的内联 `<nav aria-label="Breadcrumb">` 块。在 `CategoryPageContentProps` 中添加 `breadcrumbItems: BreadcrumbItem[]`。

  渲染：

  ```tsx
  import { Breadcrumb, type BreadcrumbItem } from '@/app/_ui/Breadcrumb';

  <Breadcrumb items={breadcrumbItems} className="mb-4" />;
  ```

- [ ] **Step 2: 修改分类页 page.tsx 构建 items + 补充 Schema**

  在 `apps/jd-frontend/app/categories/[slug]/page.tsx` 中：

  ```typescript
  import { buildBreadcrumbSchema } from '@/shared/utils/seo';
  import { type BreadcrumbItem } from '@/app/_ui/Breadcrumb';

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: category.name },
  ];

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: category.name, path: `/categories/${slug}` },
  ]);
  ```

  传递 `breadcrumbItems` 给 `CategoryPageContent`。

  在 JSX 中输出 Schema：

  ```tsx
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
  />
  ```

---

### Task 8: 替换商品详情页面包屑 + 补充 Schema

**Files:**

- Modify: `apps/jd-frontend/app/products/[slug]/page.tsx`

当前（第 252-271 行）：内联 `<nav aria-label="Breadcrumb">`，无 Schema。

- [ ] **Step 1: 替换面包屑 UI**

  移除第 252-271 行内联面包屑，替换为：

  ```tsx
  import { Breadcrumb, type BreadcrumbItem } from '@/app/_ui/Breadcrumb';

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    ...(product.categories?.[0]
      ? [
          {
            label: product.categories[0].name,
            href: `/categories/${
              product.categories[0].url_key ?? product.categories[0].id
            }`,
          },
        ]
      : []),
    { label: product.display_name },
  ];

  // 渲染
  <Breadcrumb items={breadcrumbItems} className="mb-5" />;
  ```

- [ ] **Step 2: 补充 BreadcrumbList Schema**

  ```typescript
  import { buildBreadcrumbSchema } from '@/shared/utils/seo';

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
    ...(product.categories?.[0]
      ? [
          {
            name: product.categories[0].name,
            path: `/categories/${
              product.categories[0].url_key ?? product.categories[0].id
            }`,
          },
        ]
      : []),
    { name: product.display_name, path: `/products/${product.sku}` },
  ]);
  ```

  在 JSX 中输出（当前页面尚无 Schema，新增一个 `<script>` 标签）：

  ```tsx
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(breadcrumbSchema),
    }}
  />
  ```

---

### Task 9: 删除旧 Breadcrumb 组件 + 清理导出

**Files:**

- Delete: `apps/jd-frontend/features/blog/components/Breadcrumb.tsx`
- Modify: `apps/jd-frontend/features/blog/components/index.ts`
- Modify: `apps/jd-frontend/features/blog/index.ts`

- [ ] **Step 1: 移除 components/index.ts 中的 Breadcrumb 导出**

  删除第 11 行：`export * from './Breadcrumb';`

- [ ] **Step 2: 移除 features/blog/index.ts 中的 Breadcrumb 导出**

  删除第 18 行：`export * from './components/Breadcrumb';`

- [ ] **Step 3: 删除旧组件文件**

```bash
rm D:/work/jd-frontend/.worktrees/breadcrumb/apps/jd-frontend/features/blog/components/Breadcrumb.tsx
```

- [ ] **Step 4: 验证无残留引用**

```bash
cd D:/work/jd-frontend/.worktrees/breadcrumb && grep -r "features/blog/components/Breadcrumb" apps/jd-frontend --include="*.ts" --include="*.tsx"
```

预期：无输出

---

### Task 10: TypeScript 类型检查 + Lint 验证

- [ ] **Step 1: 运行 TypeScript 类型检查**

```bash
cd D:/work/jd-frontend/.worktrees/breadcrumb && pnpm nx typecheck jd-frontend
```

预期：PASS，无类型错误

- [ ] **Step 2: 运行 ESLint**

```bash
cd D:/work/jd-frontend/.worktrees/breadcrumb && pnpm nx lint jd-frontend
```

预期：PASS，无 lint 错误

- [ ] **Step 3: check:fix（如需）**

```bash
cd D:/work/jd-frontend/.worktrees/breadcrumb && pnpm nx check:fix jd-frontend
```

---

### Task 11: 提交

- [ ] **Step 1: 暂存变更**

```bash
cd D:/work/jd-frontend/.worktrees/breadcrumb && git add \
  apps/jd-frontend/package.json \
  pnpm-lock.yaml \
  apps/jd-frontend/app/_ui/Breadcrumb.tsx \
  apps/jd-frontend/app/_ui/useBreadcrumbStore.ts \
  apps/jd-frontend/app/blog/\[category\]/\[slug\]/page.tsx \
  apps/jd-frontend/app/blog/\[category\]/page.tsx \
  apps/jd-frontend/features/recipe/components/RecipeDetail.tsx \
  apps/jd-frontend/app/recipes/\[category\]/\[slug\]/page.tsx \
  apps/jd-frontend/app/categories/\[slug\]/CategoryPageContent.tsx \
  apps/jd-frontend/app/categories/\[slug\]/page.tsx \
  apps/jd-frontend/app/products/\[slug\]/page.tsx \
  apps/jd-frontend/features/blog/components/index.ts \
  apps/jd-frontend/features/blog/index.ts
```

- [ ] **Step 2: 删除旧文件**

```bash
cd D:/work/jd-frontend/.worktrees/breadcrumb && git rm apps/jd-frontend/features/blog/components/Breadcrumb.tsx
```

- [ ] **Step 3: 提交**

```bash
cd D:/work/jd-frontend/.worktrees/breadcrumb && git commit -m "$(cat <<'EOF'
feat: 统一全站面包屑组件，补充 Schema 缺失

- 创建 app/_ui/Breadcrumb.tsx 统一组件（L2 布局壳）
  - 桌面端完整路径 / 移动端折叠+横向滚动
  - 全设计 Token（text-ink-muted / text-ink / text-ink-faint）
  - 挂载时自动写入 Zustand store 导航历史
- 创建 app/_ui/useBreadcrumbStore.ts（Zustand store）
- 替换 Blog/Recipe/分类/商品详情的面包屑实现
- 补充分类页和商品详情页的 BreadcrumbList JSON-LD
- 删除 features/blog/components/Breadcrumb.tsx 旧组件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 关键设计决策

| 决策       | 选择                                 | 理由                                              |
| ---------- | ------------------------------------ | ------------------------------------------------- |
| 组件位置   | `app/_ui/Breadcrumb.tsx`             | L2 布局壳，符合架构规范                           |
| 组件类型   | 客户端组件 (`'use client'`)          | 需要访问 Zustand store                            |
| 历史写入   | Breadcrumb 挂载时自动 `track(items)` | 各页面无需手动调 visit，减少侵入                  |
| 历史合并   | 同名 label 保留历史 href             | 从分类页带筛选参数进 PDP 时，回退链接保留筛选参数 |
| 分隔符     | `/`                                  | 统一规范，替代旧有的 `>`                          |
| 滚动 CSS   | `no-scrollbar`（项目已有全局类）     | 不引入新 CSS                                      |
| 回退策略   | 历史空时用 props items               | 直接访问/新标签页时面包屑不丢失                   |
| SEO Schema | 服务端 `buildBreadcrumbSchema()`     | SEO 必须服务端生成，爬虫不执行 JS                 |
