# 重构审计报告（更新）

> 更新日期：2026-05-06 | 范围：`apps/jd-frontend/` 全量 | 基于 2026-05-05 初步审计的深度复审

---

## 执行摘要

重构从 Old（`app/` 为中心 + `lib/` API 层）迁移到了 New（`features/` / `core/` / `shared/` 三层分离）架构。**核心目标已达成**：构建通过、关键组件已迁移、`app/components/` 目录已删除、7 个空目录已清理、大部分反向依赖已修复。

但迁移**未完成**，存在三大遗留问题：

1. **`lib/` 目录未完全迁移**（18 处活跃引用），新旧模式并存
2. **`features/product/` 是 30 文件神模块**，承担了过多职责
3. **类型定义散落且有冲突**，`ProductCardItem` 和 `Recipe` 有两套不兼容定义

**本次复审确认的进度**：初步审计中 4 个 Critical 已全部修复、H1/H5 已修复、H4 中 4/6 反向依赖已修复、M10 全部空目录已清理、M12 孤立的 `searchable-select.tsx` 已删除。

---

## 一、修复确认（已解决的问题）

| 原编号 | 问题                                                                 | 状态                |
| ------ | -------------------------------------------------------------------- | ------------------- |
| C1-C4  | 4 个阻断构建的 import 错误                                           | ✅ 已修复           |
| H1     | `app/components/` 下 7 个组件未迁移                                  | ✅ 已迁移并删除目录 |
| H4-a   | `features/search/` → `app/search/types`                              | ✅ 已修复           |
| H4-b   | `features/cms-page/` → `app/components/`                             | ✅ 已修复           |
| H4-c   | `features/auth/auth-modal.context.tsx` → `app/components/LoginModal` | ✅ 已修复           |
| H5     | `shared/ui/` → `app/components/`                                     | ✅ 已修复           |
| M10    | 7 个空目录                                                           | ✅ 已清理           |
| M12    | `components/ui/searchable-select.tsx`                                | ✅ 已删除           |
| A4     | `categories/[slug]/route.ts` 脆弱相对 paths                          | ✅ 已修复           |

---

## 二、当前架构全景

```
apps/jd-frontend/
├── app/                    # Next.js 页面 & API 路由（shell 层）
│   ├── api/                # 57 route 文件，BFF 模式
│   ├── products/[slug]/    # PDP 页面（22 文件，过度膨胀）
│   ├── search/types.ts     # ⚠️ 类型定义不应在 app/
│   └── ...
├── features/               # 业务领域（9 个 feature，108 文件）
│   ├── product/   (30)     # 🔴 神模块，需拆分
│   ├── cms-page/  (21)     # CMS 页面组件 & BFF
│   ├── auth/      (14)     # 认证
│   ├── recipe/    (11)     # 菜谱
│   ├── category/  (10)     # 分类
│   ├── search/    (7)      # 搜索
│   ├── account/   (6)      # 账户
│   ├── cart/      (5)      # 购物车
│   └── navigation/(4)      # 导航
├── core/                   # 基础设施（15 文件）
│   ├── api/                # 统一 HTTP pipeline + 各服务客户端
│   ├── config/             # 配置 & 环境变量
│   └── observability/      # 日志 & 指标
├── shared/                 # 应用级跨域 UI & 工具（19 文件）
│   ├── ui/                 # Header/Footer/PromoBar/Share
│   └── utils/              # format-price/seo/debounce/...
└── lib/                    # ⚠️ 遗留层（8 文件，18 处引用）
    └── api/
        ├── adapters/       # server-adapter.ts（2 处引用）
        ├── bff/            # refresh-lock.ts（1 处引用）
        ├── interceptors/   # request-logger.ts
        └── magento/        # types.ts（424 行）+ cart.ts（核心依赖）
```

### 层间依赖方向

```
app/ ──→ features/ ──→ core/ ──→ @prism/shared
  │          │            │
  │          ├──→ shared/ │
  │          │            │
  └──→ shared/            │
  │          │            │
  └──→ @prism/ui          │
  │                       │
  └──→ lib/ ⚠️（应消除）   │
                          │
features/product/ ──→ app/products/[slug]/ ⚠️（应消除）
```

---

## 三、严重问题（High）

### H1. `lib/` 迁移未完成 — 18 处 `@/lib/` 引用

`lib/` 仍有 8 个文件，从 18 处被引用。核心瓶颈是 `lib/api/magento/types.ts`（424 行类型定义）和 `lib/api/magento/cart.ts`（购物车 actions）。

**引用分布**：

| 文件                               | 数量 | 说明                                                                |
| ---------------------------------- | ---- | ------------------------------------------------------------------- |
| `features/cart/` 下 5 个文件       | 7 处 | cart-rest.service, cart.context, CartDrawer, use-add-to-cart-action |
| `features/auth/` 下 2 个文件       | 3 处 | types.ts (AuthTokens/AuthUser), require-auth.ts (refresh-lock)      |
| `features/product/` 下 3 个文件    | 3 处 | catalog.api, CustomizableOptionsSection, unified.api                |
| `features/category/` 下 1 个文件   | 2 处 | category.service.ts (serverRequest 双引用)                          |
| `features/navigation/` 下 1 个文件 | 1 处 | header-menu.bff.ts (serverRequest)                                  |
| `app/cart/page.tsx`                | 2 处 | cart actions + CartTotals                                           |
| `app/api/` 下 3 个文件             | 3 处 | cart/items/add, admin/\*                                            |

**关键发现**：当前处于"双轨期"——`features/category/category.service.ts` 同时使用 `@/core/api/clients/magento-graphql` 和 `@/lib/api/adapters/server-adapter`。必须完成迁移，不能长期共存。

`server-adapter.ts` 实际上是对 `core/api/` 的薄封装——它已从 `@/core/config/env` 和 `@/core/config/api-config` 导入。它应该搬进 `core/api/clients/strapi-server.ts`。

### H2. `features/product/` — 30 文件神模块

这是整个代码库中最大的单一 feature。它的职责清单：

| 子域            | 文件                                                                                                                                                                        | 说明                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Catalog API     | `catalog.api.ts`                                                                                                                                                            | Magento 商品查询                           |
| Reviews API     | `reviews.api.ts`                                                                                                                                                            | 评价 CRUD                                  |
| QA API          | `qa.api.ts`                                                                                                                                                                 | 问答                                       |
| Content API     | `content.api.ts`                                                                                                                                                            | Strapi CMS 内容（articles/videos/recipes） |
| Enrichment API  | `enrichment.api.ts`                                                                                                                                                         | 商品增强数据                               |
| Blog Bridge API | `blog-bridge.api.ts`                                                                                                                                                        | Blog 聚合                                  |
| Unified API     | `unified.api.ts`, `unified-utils.ts`                                                                                                                                        | 统一商品模型                               |
| Meilisearch     | `meilisearch.repo.ts`, `meilisearch.bff.ts`                                                                                                                                 | 搜索引擎                                   |
| GraphQL Service | `product-graphql.service.ts`                                                                                                                                                | Magento GQL                                |
| Query           | `query-facade.ts`, `query.model.ts`                                                                                                                                         | 查询抽象                                   |
| BFF 层          | `detail.bff.ts`, `list.bff.ts`, `related.bff.ts`, `stock.bff.ts`, `upsell.bff.ts`, `variants.bff.ts`                                                                        | 6 个 BFF handler                           |
| Mapper          | `product.mapper.ts`                                                                                                                                                         | 数据转换                                   |
| Category        | `category.repo.ts`                                                                                                                                                          | 分类桥接（依赖 category feature）          |
| UI 组件         | `ProductCard.tsx`, `ProductCardSection.tsx`, `ProductCardSkeleton.tsx`, `ProductCarousel.tsx`, `AddToCartButton.tsx`, `CustomizableOptionsSection.tsx`, `QuickAddModal.tsx` | 7 个                                       |
| 类型            | `bff-types.ts`                                                                                                                                                              |                                            |

被 **5 个其他 feature** 直接导入：category, cms-page, search, cart, recipe。

**建议拆分方案**（详见第六章）。

### H3. 6 个 auth 路由逐字节重复

`app/api/auth/{login,guest,logout,refresh,register,session}/route.ts` 与 `app/api/v1/auth/{...}/route.ts` 文件内容**逐字节相同**（diff 确认 exit code 0）。

这不是版本管理，是纯代码复制。应保留一组，另一组改为 301 redirect。

### H4. `api/v1/cart` 和 `api/v1/cart/items` GET handler 逐字节相同

两个路由的 handler body 完全相同（diff 确认 exit code 0）。其中一个冗余。

### H5. API 路由版本策略不一致

| 资源       | v0（`/api/`） | v1（`/api/v1/`） | 问题     |
| ---------- | :-----------: | :--------------: | -------- |
| auth       |      ✅       |        ✅        | 完全重复 |
| products   |      ✅       |        ❌        |          |
| reviews    |      ✅       |        ❌        |          |
| categories |      ✅       |        ❌        |          |
| recipes    |      ✅       |        ❌        |          |
| cart       |      ❌       |        ✅        |          |
| checkout   |      ❌       |        ✅        |          |
| account    |      ❌       |        ✅        |          |

没有文档定义 v0/v1 的区别、迁移路径或弃用策略。新功能不知道该放在哪个版本。

### H6. features/product → app/products/[slug] 反向依赖

```typescript
// features/product/content.api.ts:6
import {
  BlogPost,
  ProductVideoCard,
} from '@/app/products/[slug]/product-page-types';

// features/product/detail.bff.ts:28
import type { ProductPageCms } from '@/app/products/[slug]/product-page-types';
```

`product-page-types.ts` 定义了 `ProductVideoCard`、`BlogPost`、`Recipe`（PDP 简化版）、`CrossSellAddon`、`BundleDeal` 等 CMS 区块类型。这些类型实际上被 `features/product/` 消费，属于 feature 层的类型，不应放在 `app/` 目录下。

另外，`app/products/[slug]/product-page-types.ts` 中的 `Recipe` 类型与 `features/recipe/types.ts` 中的 `Recipe` 类型冲突（见 M1）。

---

## 四、中等问题（Medium）

### M1. 冲突的类型定义（ProductCardItem & Recipe 各有两套不兼容定义）

#### ProductCardItem

| 字段           | `app/search/types.ts`      | `features/product/bff-types.ts`                       |
| -------------- | -------------------------- | ----------------------------------------------------- |
| 用途           | 搜索/分类列表页的展示模型  | Meilisearch → feature 的内部模型                      |
| sku            | `string`                   | `string`                                              |
| name           | `string`                   | `string`                                              |
| displayName    | —                          | `string`                                              |
| price          | `number \| null`           | `{ value: number \| null; currency: string \| null }` |
| image          | `thumbnail?: string`       | `image: string \| null`                               |
| urlKey         | —                          | `string \| null`                                      |
| variantData    | —                          | 完整 variant/customizable_options                     |
| promotionLabel | `promotion_label?: string` | `promotionLabel: string \| null`                      |

两个 `ProductCardItem` 互不兼容但语义相近。`app/search/types.ts` 的版本是搜索/分类页的展示契约，`bff-types.ts` 是 Meilisearch 内部返回模型。

#### Recipe

| 位置                                        | 用途                    | 规模                                                               |
| ------------------------------------------- | ----------------------- | ------------------------------------------------------------------ |
| `features/recipe/types.ts`                  | Strapi 完整 Recipe 实体 | 118 行，含 author/ingredients/instructions/nutrition/products      |
| `app/products/[slug]/product-page-types.ts` | PDP 缩略展示            | 10 行，仅 id/title/description/image/time/servings/difficulty/tags |

两套定义语义不同但会导致 import 混淆。

### M2. 所有 feature 目录都没有 barrel export（index.ts）

9 个 feature 无任何 `index.ts`。消费方直接 import 内部文件：

```typescript
// 当前模式（普遍使用）
import { ProductCard } from '@/features/product/ProductCard';
import type { ProductCardItem } from '@/features/product/bff-types';

// 应有模式
import { ProductCard, type ProductCardItem } from '@/features/product';
```

没有 barrel 意味着：

- Feature 边界无法约束——任何消费方可以 import 任何内部实现细节
- 重构成本高——移动文件需要更新所有消费方
- 公共 API vs 内部实现无法区分

**例外**：`core/api/` 有完善的 barrel export，是其他模块的参考模板。

### M3. 双向 feature 依赖（product ↔ category）

```
features/product/category.repo.ts  ──→ @/features/category/category.service
features/category/CategoryProductGrid.tsx ──→ @/features/product/ProductCard
features/category/CategoryProductGrid.tsx ──→ @/features/product/ProductCardSkeleton
features/category/list.bff.ts  ──→ @/features/product/list.bff
features/category/types.ts     ──→ @/features/product/bff-types
```

两个 domain 互相感知，无法独立理解或拆到独立 package。

**本质原因**：`category.repo.ts` 是 product feature 中用于解析 category mapping 的桥接文件，它天然处于两个 domain 的交界处。应移到 shared 层或独立的 mapping feature。

### M4. 文件命名约定不统一

| Feature  | 命名风格                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------- |
| category | PascalCase 组件 + dot.case 非组件（`category.service.ts`）                                     |
| product  | PascalCase + dot.case（`catalog.api.ts`）+ 短横线（`query-facade.ts`）+ 混合（`bff-types.ts`） |
| search   | PascalCase + 短横线（`search-service.ts`）                                                     |
| auth     | 最多样：`cookies.ts`, `token.ts`, `get-session.ts`, `auth.service.ts`                          |
| cms-page | PascalCase + dot.case + 短横线                                                                 |

建议统一为：

- **组件**：PascalCase（`ProductCard.tsx`）
- **Service/API/BFF/hook/util**：kebab-case（`catalog-api.ts`, `detail-bff.ts`, `use-add-to-cart.ts`）
- **类型**：`types.ts`（单文件）

### M5. 跨 feature 直接导入无约束

所有 9 个 feature 中，8 个存在跨 feature 直接导入（仅 `navigation` 和 `recipe` 被其他 feature 零引用）。`product` 被 5 个 feature 引用，`auth` 被 2 个 feature 引用。这在没有 barrel export 的情况下意味着 feature 内部文件路径变更会直接破坏消费方。

### M6. `shared/utils/debounce.ts` 与 `libs/shared/src/utils/debounce.ts` 完全相同

两个文件逐字节相同。应删除其中一个，统一使用 `@prism/shared`。

### M7. `shared/` vs `libs/shared/` 命名冲突

- `@/shared/` = app 级 cross-cutting UI + utils（19 文件）
- `@prism/shared` = monorepo Nx 通用库（`libs/shared/`）

命名极易混淆。建议重命名 `@/shared/` → `@/common/` 或明确约定为 `@/app-shared/`。

### M8. 类型定义仍放在 `app/` 目录下

- `app/search/types.ts`（111 行，`ProductSearchQuery`/`ProductSearchResult`/`ProductCardItem` 等）——属于 `features/search/`
- `app/products/[slug]/product-page-types.ts`（126 行，`ProductPageCms`/`ProductVideoCard`/`BlogPost` 等）——属于 `features/product/`

app/ 应该只有路由文件和页面组件，不应包含可被其他层消费的类型定义。

### M9. `shared/utils/index.ts` barrel 形同虚设

当前只 re-export 了 `cn` from `@prism/shared`，实际高频使用的 `formatPrice`、`debounce`、`seo` 函数都被直接 deep import。

### M10. `features/product/ProductCardSection.tsx` 名实不符

文件名叫 `ProductCardSection`，但导出的是 `ProductCard` 组件——与同目录下的 `ProductCard.tsx`（也导出 `ProductCard`）重名，造成混淆。

### M11. `features/category/category.service.ts` 使用类单例模式

通过 `export const categoryService = new CategoryService()` 导出类实例。这是整个代码库中唯一使用 class/service 实例模式的文件，其他 feature 都是纯函数导出。不一致。

### M12. `forgot-password` / `reset-password` 绕过 auth service

```typescript
// app/api/auth/forgot-password/route.ts → 直接调用 magentoClient.put()
// app/api/auth/reset-password/route.ts  → 直接调用 magentoClient.post()
// 所有其他 auth 路由 → 走 auth.service
```

错误处理不一致：service 层有自己的 error 标准化，这两个路由各自内联 error handling。

---

## 五、API 路由详细审计

### 5.1 路由全景（57 个 route 文件）

| 分类              | 数量 | 路径                                                                                                              |
| ----------------- | :--: | ----------------------------------------------------------------------------------------------------------------- |
| BFF               |  48  | auth/account/cart/checkout/products/reviews/categories/recipes/global-search/deal-products/product-qa/header-menu |
| API Proxy（透传） |  4   | auth/forgot-password, auth/reset-password, reviews/helpful, reviews/upload                                        |
| Utility/Dev       |  5   | revalidate, admin/sync, admin/catalog-inspect, dev/request-log                                                    |

### 5.2 重复与冗余

| 问题                                                | 详情                                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **6 个 auth 路由重复**                              | `api/auth/{login,guest,logout,refresh,register,session}` ≡ `api/v1/auth/{...}` — diff 确认为 0 |
| **cart GET 重复**                                   | `api/v1/cart/route.ts` GET handler ≡ `api/v1/cart/items/route.ts` GET handler — diff 确认为 0  |
| **两个菜谱搜索路由功能相近**                        | `api/recipes/search`（多维筛选）和 `api/search/recipes`（关键词搜索）用同一数据源，可合并      |
| **`categories/[slug]` 与 `deal-products` 功能相近** | 都按分类查商品，都用 `query-facade`，`deal-products` 是简化版                                  |

### 5.3 Import 依赖分析

所有 route 文件的 import 来源：

| Import 前缀   | 使用文件数 | 状态                                  |
| ------------- | :--------: | ------------------------------------- |
| `@/features/` |    ~53     | ✅ 规范                               |
| `@/core/`     |    ~12     | ✅ 规范                               |
| `@/shared/`   |     ~2     | ✅ 规范                               |
| `@/lib/`      |     3      | ⚠️ 待迁移（cart/items/add, admin/\*） |

### 5.4 版本策略建议

推荐：**统一使用 v1 作为唯一版本**。原因：

- account/cart/checkout 从一开始就是 v1
- v1 的名字暗示了 "API 版本管理" 的意图，未来需要 v2 时有明确的迁移路径
- 将当前 v0 路由（products/reviews/categories/recipes/auth）迁移到 v1，原路径做 301 redirect

---

## 六、`features/product/` 拆分方案

将 30 文件的 product feature 拆为 4 个子域：

```
features/product/          # 核心：类型 + 统一模型 + UI 组件（~12 文件）
  ├── index.ts             # barrel
  ├── types.ts             # 统一类型（合并 bff-types + product-page-types）
  ├── unified.api.ts       # UnifiedProduct 模型
  ├── unified-utils.ts
  ├── product.mapper.ts
  ├── detail.bff.ts        # PDP BFF
  ├── list.bff.ts          # 列表 BFF
  ├── product-graphql.service.ts
  ├── AddToCartButton.tsx
  ├── ProductCard.tsx
  ├── ProductCardSkeleton.tsx
  ├── QuickAddModal.tsx
  └── CustomizableOptionsSection.tsx

features/product/catalog/  # Catalog & 搜索（~8 文件）
  ├── catalog.api.ts
  ├── enrichment.api.ts
  ├── query-facade.ts
  ├── query.model.ts
  ├── meilisearch.repo.ts
  ├── meilisearch.bff.ts
  ├── category.repo.ts     # 移至 shared/mapping/ 或保留在此
  └── index.ts

features/product/social/   # 评价 & QA（~4 文件）
  ├── reviews.api.ts
  ├── qa.api.ts
  ├── content.api.ts       # CMS 关联内容
  ├── blog-bridge.api.ts
  └── index.ts

features/product/related/  # 关联商品 BFF（~4 文件）
  ├── related.bff.ts
  ├── upsell.bff.ts
  ├── stock.bff.ts
  ├── variants.bff.ts
  └── index.ts
```

### 类型迁移路线

1. `app/search/types.ts` 的 `ProductCardItem` → 合并到 `features/product/types.ts`（搜索/列表用轻量版）
2. `features/product/bff-types.ts` 的 `ProductCardItem` → 合并到 `features/product/types.ts`（Meilisearch 版）
3. `app/products/[slug]/product-page-types.ts` → 打散：
   - `ProductVideoCard`/`BlogPost`/`Recipe(PDP版)`/`CrossSellAddon`/`BundleDeal` → `features/product/types.ts`
   - `ProductPageCms`/`ProductPageExtras` → `features/product/types.ts`
4. `lib/api/magento/types.ts` → 打散到各消费 feature：
   - Auth 相关 → `features/auth/types.ts`
   - Cart 相关 → `features/cart/types.ts`
   - Product catalog 相关 → `features/product/types.ts`

---

## 七、优先修复路线

### P0 — 立即（消除代码重复）

| #   | 任务                                                                        | 影响范围       |
| --- | --------------------------------------------------------------------------- | -------------- |
| 1   | 删除 6 个重复的 `/api/v1/auth/*` 路由，原路径 301 redirect 到 `/api/auth/*` | 6 文件删除     |
| 2   | 合并或删除 `api/v1/cart` 和 `api/v1/cart/items` GET handler 中的一个        | 1 文件         |
| 3   | 删除 `shared/utils/debounce.ts`，统一使用 `@prism/shared`                   | 更新 ~3 处引用 |

### P1 — 短期（完成 lib/ 迁移 + 修复反向依赖）

| #   | 任务                                                                            | 影响范围                     |
| --- | ------------------------------------------------------------------------------- | ---------------------------- |
| 4   | 拆分 `lib/api/magento/types.ts`（424 行）→ 各 feature 的 `types.ts`             | 更新全部 18 处 `@/lib/` 引用 |
| 5   | 迁移 `lib/api/magento/cart.ts` → `features/cart/cart-rest.service.ts` 合并      | 更新 5 处引用                |
| 6   | 迁移 `lib/api/adapters/server-adapter.ts` → `core/api/clients/strapi-server.ts` | 更新 4 处引用                |
| 7   | 迁移 `lib/api/bff/refresh-lock.ts` → `core/api/refresh-lock.ts`                 | 更新 1 处引用                |
| 8   | 迁移 `lib/api/interceptors/request-logger.ts` → `core/api/interceptors/`        | 更新 1 处引用                |
| 9   | 移动 `app/search/types.ts` → `features/search/types.ts`                         | 更新 ~3 处引用               |
| 10  | 移动 `app/products/[slug]/product-page-types.ts` 到 `features/product/`         | 更新 2 处反向引用            |
| 11  | 删除 `lib/` 目录                                                                | —                            |
| 12  | `forgot-password` / `reset-password` 改为走 auth service                        | 2 文件                       |

### P2 — 中期（规范化 + 神模块拆分）

| #   | 任务                                                     | 影响范围     |
| --- | -------------------------------------------------------- | ------------ |
| 13  | 拆分 `features/product/` 为 4 个子域（见第六章）         | ~30 文件     |
| 14  | 统一 API 路由版本策略：全部 v1                           | ~20 文件     |
| 15  | 所有 feature 添加 `index.ts` barrel export               | 9 个新文件   |
| 16  | 统一文件命名约定（见 M4）                                | 渐进式       |
| 17  | 消除 `features/product/` ↔ `features/category/` 双向依赖 | 2 文件       |
| 18  | 重命名 `shared/` → `common/`（或 `app-shared/`）         | 全局引用更新 |
| 19  | 评估 `api/recipes/search` 和 `api/search/recipes` 合并   | 1 文件       |

### P3 — 长期（细节优化）

| #   | 任务                                                                              |
| --- | --------------------------------------------------------------------------------- |
| 20  | 统一冲突的 `ProductCardItem` 和 `Recipe` 类型定义                                 |
| 21  | 补全 `shared/utils/index.ts` barrel export                                        |
| 22  | `features/product/ProductCardSection.tsx` 导出的函数重命名为 `ProductCardCompact` |
| 23  | `features/category/category.service.ts` 改为纯函数导出风格                        |
| 24  | 测试文件与 feature 代码就近放置                                                   |
| 25  | 为 API 路由分类添加 JSDoc 注释                                                    |
| 26  | 评估统一的 route handler wrapper 模式                                             |

---

## 八、架构约定建议

### 8.1 Feature 目录规范

```
features/<name>/
  ├── index.ts           # barrel — 只 export 公共 API
  ├── types.ts           # 该 feature 的所有类型定义
  ├── <name>.service.ts  # 核心业务逻辑（纯函数导出）
  ├── <name>.api.ts      # API 调用封装
  ├── <name>.bff.ts      # BFF 聚合层
  ├── use-*.ts           # React hooks
  └── ComponentName.tsx  # UI 组件
```

### 8.2 Barrel Export 规范

- 只 export 公共 API（service、类型、组件），不 export 内部实现
- 禁止外部直接 deep import（ESLint 规则可选）

### 8.3 层间依赖规则

```
core/ → 不依赖任何 feature 或 app 层
shared/ → 可依赖 core/，不依赖 feature 或 app
features/ → 可依赖 core/ 和 shared/，不依赖 app/ 和其他 feature/（通过 barrel）
app/ → 可依赖所有层
```

### 8.4 API 路由规范

- 所有路由使用统一版本前缀 `api/v1/...`
- 直接透传的 Proxy 路由在文件顶部标注 `// API Proxy`
- BFF 路由统一走 feature service 层，不直接调 `magentoClient`

---

## 九、指标总结

| 指标                           |     重构前      |            当前            |     目标      |
| ------------------------------ | :-------------: | :------------------------: | :-----------: |
| `@/lib/` 活跃引用              |       33        |             18             |       0       |
| `features/` → `app/` 反向依赖  |        8        |             2              |       0       |
| `shared/ui/` → `app/` 反向依赖 |        2        |             0              |       0       |
| 空目录                         |        7        |             0              |       0       |
| `features/product/` 文件数     |       31        |             30             | ~12（拆分后） |
| 重复路由文件                   | 6 auth + 1 cart |      6 auth + 1 cart       |       0       |
| 重复类型定义                   |      2 组       |            2 组            |       0       |
| Feature barrel export          |        0        |             0              |       9       |
| 逐字节相同文件对               |      5 组       | 2 组(both debounce 和路由) |       0       |
