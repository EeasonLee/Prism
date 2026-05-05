# 目录重构审计报告

> 生成日期：2026-05-05 | 范围：`apps/jd-frontend/` 全量审计

## 执行摘要

目录重构达成了核心目标：特征域（`features/`）、基础设施（`core/`）、跨域共享（`shared/`）三层分离。但迁移**未完成**，存在多个阻断构建的问题，且新旧模式并存造成混乱。

**问题统计**：Critical 4 个（全部已修复）/ High 12 个 / Medium 12 个 / Low 6 个
**修复进度**：Import 修复 Agent 已修复 22 个文件中的 41 个错误 import，构建通过

---

## 一、Critical — 阻断性问题

> **状态更新**：C1-C4 已被 import 修复 Agent 修复（2026-05-05），构建通过。以下记录问题详情供参考。

### C1. ✅ 已修复 — `app/search/page.tsx` 从空目录导入

```typescript
// 修复前：import { fetchProductSearchResult } from './lib/service';
// 修复后：import { fetchProductSearchResult } from '@/features/search/search-service';
```

### C2. ✅ 已修复 — `app/shop/page.tsx` 和 `app/shop/[slug]/page.tsx` 从空目录导入

```typescript
// 修复前：from './components/ProductCard', './components/FilterPanel', etc.
// 修复后：from '@/features/search/...'
```

### C3. ✅ 已修复 — `lib/api/adapters/` 内部 import 指向不存在的文件

```typescript
// 修复前：import { getApiBaseUrl } from '../config'  (文件不存在)
// 修复后：import { getApiBaseUrl } from '@/core/config/api-config'
// 修复前：import { env } from '../../env'  (文件不存在)
// 修复后：import { env } from '@/core/config/env'
```

### C4. ✅ 已修复 — `features/search/GlobalSearch.tsx` 导入不存在的类型

```typescript
// 修复前：import type { SearchRecipeItem } from '../../app/recipes/types';
// 修复后：import type { SearchRecipeItem } from '@/features/recipe/types';
```

---

## 二、High — 严重影响可维护性

### H1. `app/components/` 下 7 个组件未迁移

| 文件                             | 应迁移到                        |
| -------------------------------- | ------------------------------- |
| `AddToCartButton.tsx`            | `features/product/`（已有副本） |
| `CartDrawer.tsx`                 | `features/cart/`                |
| `CmsPageRichContent.tsx`         | `features/cms-page/`            |
| `CustomizableOptionsSection.tsx` | `features/product/`（已有副本） |
| `HeaderClient.tsx`               | `shared/ui/`                    |
| `LoginModal.tsx`                 | `features/auth/`                |
| `templates/CategoryTemplate.tsx` | `features/category/`            |

其中 `AddToCartButton.tsx` 和 `CustomizableOptionsSection.tsx` 与 `features/product/` 中的版本**逐字节相同**。

### H2. `@/lib/` 路径仍有 33 处活跃引用

分布在 16 个文件中：

- `app/cart/page.tsx`、`app/components/CartDrawer.tsx`、`app/components/CustomizableOptionsSection.tsx`
- `app/api/v1/cart/items/add/route.ts`、`app/api/admin/catalog-inspect/route.ts`、`app/api/admin/sync/magento-to-strapi/route.ts`
- `features/cart/cart.context.tsx`、`features/cart/cart-rest.service.ts`、`features/cart/use-add-to-cart-action.ts`
- `features/auth/types.ts`、`features/auth/require-auth.ts`
- `features/navigation/header-menu.bff.ts`、`features/category/category.service.ts`
- `features/product/catalog.api.ts`、`features/product/unified.api.ts`、`features/product/CustomizableOptionsSection.tsx`

核心原因是 `lib/api/magento/types.ts`（424 行类型定义）和 `lib/api/magento/cart.ts` 从未迁移。

### H3. app/api/ 路由混乱

- **6 个 auth 路由完全重复**：`/api/auth/login` 与 `/api/v1/auth/login`（以及 guest/logout/refresh/register/session）——文件内容逐字节相同
- **版本策略不一致**：products/reviews/categories 只有 v0；cart/checkout/account 只有 v1；auth 两个都有
- **v1 是什么**没有定义——没有 changelog，没有 deprecation 标记

### H4. 反向依赖：features/ 从 app/ 导入

```
features/product/content.api.ts  → @/app/products/[slug]/product-page-types
features/product/detail.bff.ts   → @/app/products/[slug]/product-page-types
features/auth/auth-modal.context.tsx → ../../app/components/LoginModal
features/cms-page/DealProductCard.tsx → ../../app/components/AddToCartButton
features/cms-page/FeaturedProducts.tsx → ../../app/components/AddToCartButton
features/search/search-service.ts → ../../app/search/types
features/search/GlobalSearch.tsx  → ../../app/search/types
```

`features/` → `app/` 方向是错的，app/ 是最外层，features 不该依赖它。

### H5. `shared/ui/` 从 `@/app/components/` 导入

```typescript
// shared/ui/Header.tsx
import { HeaderClient } from '@/app/components/HeaderClient';

// shared/ui/HomeFirstHeroSection.tsx
import { AddToCartButton } from '@/app/components/AddToCartButton';
```

shared 是最内层，不应该依赖 app。

### H6. `lib/` 目录存在且仍被活跃依赖

`lib/` 里有 7 个活跃文件，重构目标是删掉 `lib/`，但现在它仍然是 production 依赖。

### H7. `features/product/` 是 31 文件的"神模块"

包含：catalog API、reviews API、QA API、content API、enrichment API、unified API、blog bridge API、Meilisearch repo/query、BFF 层、GraphQL service、variant/stock/upsell/related 子 BFF、product mapper、5 个 UI 组件。被几乎所有其他 feature 依赖。这不是 feature，是整个 product 域。

### H8. 字节级重复文件

| 文件                             | 副本位置                                                           |
| -------------------------------- | ------------------------------------------------------------------ |
| `ProductCardSection.tsx`         | `features/product/` 和 `features/cms-page/`                        |
| `FeaturedProducts.tsx`           | `features/product/` 和 `features/cms-page/`（仅 2 行 import 不同） |
| `DealProductCard.tsx`            | `features/product/` 和 `features/cms-page/`（仅 1 行 import 不同） |
| `AddToCartButton.tsx`            | `features/product/` 和 `app/components/`                           |
| `CustomizableOptionsSection.tsx` | `features/product/` 和 `app/components/`                           |

---

## 三、Medium — 混乱但能工作

### M1. 冲突的类型定义

- `ProductCardItem` 在两个地方有**不兼容**的定义：
  - `app/search/types.ts`：`{ sku, name, subtitle?, thumbnail?, price, ... }`
  - `features/product/bff-types.ts`：`{ sku, name, displayName, shortName?, ..., price: { value, currency }, variantData? }`
- `Recipe` 在两个地方有**不兼容**的定义：
  - `features/recipe/types.ts`：完整结构含 author/publishedAt
  - `app/products/[slug]/product-page-types.ts`：缩略版含 time/servings/difficulty/tags

### M2. 所有 feature 目录都没有 barrel export（index.ts）

9 个 feature 目录、`core/config/`、`core/observability/`、`shared/ui/` 都没有 `index.ts`。消费方可以随意 import 任何内部文件，feature 边界无法约束。

### M3. 双向特征依赖（product ↔ category）

```
features/product/category.repo.ts  → @/features/category/category.service
features/category/...              → @/features/product/...（大量引用）
```

不是严格的循环依赖，但两个域互相感知，不能独立理解或拆走。

### M4. 文件命名不一致

- `category/`：PascalCase（`CategoryPageContent.tsx`）
- `product/`：PascalCase（`ProductCard.tsx`）+ 点号（`catalog.api.ts`, `list.bff.ts`）+ 短横线（`query-facade.ts`）
- `search/`：PascalCase（`FilterPanel.tsx`）+ 短横线（`shop-search.ts`, `search-service.ts`）
- `auth/`：~10 个无后缀文件（`cookies.ts`, `token.ts`, `get-session.ts`...）

没有统一标准。

### M5. 跨 feature 直接导入（22 处）

features 之间大量直接导入，`product` 和 `auth` 被几乎所有其他 feature 引用，实际充当了 shared 层。

### M6. `shared/utils/debounce.ts` 与 `libs/shared/src/utils/debounce.ts` 逐字节相同

两个位置有完全一样的 debounce 函数。

### M7. `shared/` vs `libs/shared/` 命名冲突

前者是 app 级共享代码（`@/shared/`），后者是 Nx 通用库（`@prism/shared`），命名极易混淆。

### M8. `app/search/types.ts` 和 `app/products/[slug]/product-page-types.ts`

类型定义放在 app/ 下违反原则——app/ 应该只有路由文件。

### M9. `shared/utils/index.ts` 只 re-export 了 `cn`

实际工具函数（debounce, alert, format-price 等）都被直接 import，barrel 形同虚设。

### M10. 空目录未清理

`features/review/`、`lib/services/magento/`、`lib/services/search/`、`app/search/lib/`、`app/shop/lib/`、`app/shop/components/`、`scripts/`——7 个空目录。

### M11. `ProductCardSection.tsx` 文件名叫 Section 但导出叫 ProductCard

名实不符。

### M12. `components/ui/searchable-select.tsx`

项目根目录的 standalone 文件，应该属于 `libs/ui/` 或 `shared/ui/`。

---

## 四、app/api/ 路由专项分析

对 `apps/jd-frontend/app/api/` 下 **57 个 route 文件** 逐一审查。

### 分类统计

| 类型            | 数量 | 说明                                                                                        |
| --------------- | ---- | ------------------------------------------------------------------------------------------- |
| **BFF**         | 48   | 聚合/转换/业务逻辑（含 auth/cart/checkout/account/reviews/QA 等）                           |
| **API Proxy**   | 4    | 直接透传 Magento/Strapi（forgot-password, reset-password, reviews/helpful, reviews/upload） |
| **Utility/Dev** | 5    | revalidate, revalidate/nav, admin/sync, admin/catalog-inspect, dev/request-log              |

### 核心问题

#### A1. 6 个 auth 路由完全重复（High）

`/api/auth/*` 与 `/api/v1/auth/*` 6 个端点内容逐字节相同：

| Non-v1              | v1 副本                | 导入 | 代码     |
| ------------------- | ---------------------- | ---- | -------- |
| `api/auth/guest`    | `api/v1/auth/guest`    | 相同 | 完全相同 |
| `api/auth/login`    | `api/v1/auth/login`    | 相同 | 完全相同 |
| `api/auth/logout`   | `api/v1/auth/logout`   | 相同 | 完全相同 |
| `api/auth/refresh`  | `api/v1/auth/refresh`  | 相同 | 完全相同 |
| `api/auth/register` | `api/v1/auth/register` | 相同 | 完全相同 |
| `api/auth/session`  | `api/v1/auth/session`  | 相同 | 完全相同 |

这不是版本管理，这是纯代码重复。保留一组，另一组加 redirect 即可。

#### A2. 版本策略不一致（High）

| 资源       | v0  | v1  | 两者都有 |
| ---------- | --- | --- | -------- |
| products   | ✅  | ❌  |          |
| reviews    | ✅  | ❌  |          |
| categories | ✅  | ❌  |          |
| recipes    | ✅  | ❌  |          |
| cart       | ❌  | ✅  |          |
| checkout   | ❌  | ✅  |          |
| account    | ❌  | ✅  |          |
| auth       | ✅  | ✅  | ⚠️ 重复  |

没有文档说明 v1 是什么、为什么存在、迁移路径是什么。

#### A3. `api/v1/cart` 和 `api/v1/cart/items` 功能重复

两个 GET 路由 handler body 完全一致，都返回完整购物车。有一个是冗余的。

#### A4. 脆弱相对 import（Medium）

```typescript
// app/api/categories/[slug]/route.ts:2
import { ShopSortOption } from '../../../shop/lib/meilisearch';
```

这是唯一跨 app 目录的相对引用。 ✅ 已修复为 `@/features/search/shop-search`。

#### A5. forgot-password / reset-password 绕过 auth service

这两个路由直接调用 `magentoClient.put/post`，绕过 `@/features/auth/auth.service`。其他 auth 路由都走 service 层。不一致。

#### A6. reviews/upload 用裸 `fetch()` 而非 strapiClient

因为是 multipart FormData 上传，Strapi client 抽象层不支持。可以视为合理例外。

---

## 五、Low — 锦上添花

### L1. 测试文件扁平存放

20 个测试文件都在 `tests/` 平铺，没有与 feature 代码就近放置。

### L2. `app/products/[slug]/` 下 15+ 个文件

页面专属组件（ReviewForm, BlogSection 等）应该考虑是否属于 `features/product/`。

### L3. `shared/ui/` vs `libs/ui/` 边界无文档说明

实际区分是：`libs/ui/` = 设计系统原语（Button, Select, Sheet）；`shared/ui/` = 应用组合组件（Header, Footer, PromoBar）。但没有 README 记录。

### L4. app/api/ 深层嵌套

最深达 6-7 层（`api/v1/account/addresses/[id]/route.ts`）。

### L5. 测试文件 import 路径过时

部分测试仍用 `../lib/api/magento/types`、`../app/products/[slug]/...` 等旧路径。

### L6. `features/product/query-facade.ts`、`unified-utils.ts`、`features/search/search-service.ts` 等未遵循后缀约定

---

## 五、Import 依赖全景图

```
app/ (页面、路由)
  ├── features/product/      ← 重度依赖（BFF、types、API）
  ├── features/category/     ← list BFF、types
  ├── features/cart/         ← context、hooks
  ├── features/auth/         ← context、service
  ├── features/account/      ← service、hooks
  ├── features/search/       ← 搜索组件
  ├── features/cms-page/     ← CMS 页面 API
  ├── features/navigation/   ← header-menu BFF
  ├── features/recipe/       ← recipes API
  ├── core/                  ← API 客户端、配置、错误
  ├── lib/                   ← ⚠️ 仍活跃（magento types/cart/adapters）
  ├── shared/                ← UI 壳组件、工具函数
  └── @prism/*               ← Nx 库

features/search/  ──→ app/search/types        ← ⚠️ 反向依赖（待修复）
features/cms-page/ ──→ app/components/        ← ⚠️ 反向依赖（待修复）
features/product/  ──→ app/products/.../types ← ⚠️ 反向依赖（待修复）
shared/ui/         ──→ app/components/        ← ⚠️ 反向依赖（待修复）
lib/api/adapters/  ──→ 不存在的 ../config    ← ✅ 已修复
```

---

## 六、优先修复路线

### ✅ 已完成（P0）—— 阻断构建

1. ✅ 修 `app/search/page.tsx`：`./lib/service` → `@/features/search/search-service`
2. ✅ 修 `app/shop/page.tsx`、`app/shop/[slug]/page.tsx`：所有 `./components/`、`./lib/` → `@/features/search/`
3. ✅ 修 `lib/api/adapters/` 内部的 `../config` / `../../env` → `@/core/config/`
4. ✅ 修 `features/search/GlobalSearch.tsx`：`../../app/recipes/types` → `@/features/recipe/types`

### 短期（P1）—— 完成迁移

5. 迁移 `lib/api/magento/types.ts` → `features/cart/types.ts` 或 `core/api/types.ts`，更新全部 33 处 `@/lib/` 引用
6. 迁移 `lib/api/adapters/` → `core/api/adapters/`
7. 迁移 `lib/api/bff/refresh-lock.ts` → `core/api/`
8. 迁移 `lib/api/interceptors/` → `core/api/`
9. 删除 `lib/` 目录
10. 迁移 `app/components/` 下 7 个文件到对应 features 或 shared
11. 删除重复的 6 个 `/api/v1/auth/*` 路由（保留 `/api/auth/*`），或反之

### 中期（P2）—— 清理

12. 删除 7 个空目录
13. 移动 `app/search/types.ts` → `features/search/types.ts`
14. 移动 `app/products/[slug]/product-page-types.ts` → `features/product/`
15. 消除 features → app 的 8 处反向导入
16. 消除 shared/ui → app 的 2 处反向导入
17. 删除 `shared/utils/debounce.ts`，统一用 `@prism/shared`
18. 删除 5 组重复文件
19. 决定保留 `/api/auth/*` 还是 `/api/v1/auth/*`，删除冗余组
20. 统一 app/api/ 版本策略：所有资源要么 v0 要么 v1，不要混用
21. 评估 `api/v1/cart` 和 `api/v1/cart/items` 是否合并

### 长期（P3）—— 规范化

22. 所有 feature 目录添加 `index.ts` barrel export
23. 统一文件命名约定
24. 拆分 `features/product/` 31 文件神模块
25. 统一冲突的类型定义（ProductCardItem, Recipe）
26. 重命名 `shared/` → `common/` 或 `app-shared/`
27. forgot-password/reset-password 路由改为走 auth service 层
28. 测试文件与 feature 代码就近放置
