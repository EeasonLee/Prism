# FSD 架构审计与迁移建议

> **范围**：`apps/jd-frontend/` > **基准方法论**：Feature-Sliced Design (FSD) v2
> **审计日期**：2026-05-07
> **定位**：本文档是现状审计与迁移路线图，目标结构确立后应回写到 `docs/architecture/file-layout-spec.md` 作为新的唯一权威标准。

---

## 一、审计结论速览

| 维度         | 现状评分    | 主要问题                                                                     |
| ------------ | ----------- | ---------------------------------------------------------------------------- |
| 层划分       | ⚠️ 不完整   | 缺 `entities` 和 `widgets` 层，`features` 承担了三层职责                     |
| Segment 命名 | ⚠️ 不统一   | `components/` `services/` `hooks/` 与 FSD 的 `ui/` `model/` `lib/` 不对齐    |
| 文件命名     | ❌ 混乱     | `PascalCase` / `kebab-case` / `camelCase` / `dot.case` 四种风格混用          |
| Dot-suffix   | ❌ 重叠     | 同时存在 `.api / .bff / .repo / .service`，语义模糊                          |
| Slice 边界   | ⚠️ 有泄漏   | `cms-page` 包含 category/product 组件；`account` / `navigation` 结构扁平混乱 |
| 依赖方向     | ✅ 基本正确 | `app → features → infrastructure → libs` 单向，`libs/*` 零业务耦合           |

---

## 二、当前架构与 FSD 对照

FSD 标准层级（自顶向下，箭头只能朝下依赖）：

```
app  →  pages  →  widgets  →  features  →  entities  →  shared
```

项目当前只落地了其中三层（概念映射，非 FSD 命名）：

| 项目现状                  | FSD 对应                                      | 差异                                                           |
| ------------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| `app/<route>/page.tsx`    | `app/` + `pages/`                             | Next.js 路由文件留 `app/`，页面私有组件应提升到 `pages/` slice |
| `app/_ui/`                | `widgets/`                                    | 命名不对齐，且混入了非全局组件（如 `HomeFirstHeroSection`）    |
| `features/*`              | `features/` + `entities/`                     | **没有 `entities` 层**，业务实体与用户动作混在一起             |
| `infrastructure/`         | `shared/api` + `shared/config` + `shared/lib` | FSD 把这些归到 `shared/`，当前单独成层                         |
| `shared/utils/seo.ts`     | `shared/lib/`                                 | 顶层 `shared/` 与 `infrastructure/` 并存，定位重复             |
| `libs/{ui,shared,tokens}` | 跨项目 `shared`                               | 合理保留，本次不调整                                           |

**核心结论**：需要新增 `pages/` 和 `widgets/` 两层，并把 `features/` 拆成 `entities/` + `features/`，最后把 `infrastructure/` 与顶层 `shared/` 合并为 FSD 的 `shared/`。

---

## 三、问题清单

### 问题 1：层划分缺 `entities` 和 `widgets`

当前 `features/` 里混了三类职责不同的文件。按 FSD 判断规则重新归类：

- **entity**：围绕"业务对象"的纯视图 / 类型 / CRUD（product、cart、order、user、article、recipe、category）
- **feature**：围绕"用户动作"（add-to-cart、login、toggle-wishlist、filter-by-price、submit-review）
- **widget**：多个 entities/features 组合成的独立 UI 块（header、cart-drawer、product-page-reviews）

| 当前位置                                              | 真实身份    | FSD 正确位置                                    |
| ----------------------------------------------------- | ----------- | ----------------------------------------------- |
| `features/product/components/ProductCard.tsx`         | 实体视图    | `entities/product/ui/product-card.tsx`          |
| `features/product/components/ProductCardSkeleton.tsx` | 实体视图    | `entities/product/ui/product-card-skeleton.tsx` |
| `features/product/components/AddToCartButton.tsx`     | 用户行为    | `features/add-to-cart/ui/`                      |
| `features/product/components/QuickAddModal.tsx`       | 用户行为    | `features/quick-add/ui/`                        |
| `features/cart/components/CartDrawer.tsx`             | 组合块      | `widgets/cart-drawer/ui/`                       |
| `features/auth/components/LoginModal.tsx`             | 组合块      | `widgets/login-modal/ui/`                       |
| `features/cms-page/components/HeroBanner.tsx`         | 组合块      | `widgets/hero-banner/ui/`                       |
| `features/cms-page/components/DealProductBlocks.tsx`  | 组合块      | `widgets/deal-product-block/`                   |
| `app/_ui/Header.tsx` / `Footer.tsx`                   | 全局 widget | `widgets/header/`、`widgets/footer/`            |
| `app/_ui/HomeFirstHeroSection.tsx`                    | 首页私有    | `pages/home/ui/`（**不是 widget**）             |

### 问题 2：Segment 命名不统一

FSD 标准 segment 四件套：

```
<slice>/
├── ui/        # 组件
├── api/       # 外部请求 / BFF
├── model/     # 业务规则、状态、types、hooks
├── lib/       # slice 内部工具
└── index.ts   # public API
```

当前项目的映射关系：

| 当前          | FSD              | 说明                                 |
| ------------- | ---------------- | ------------------------------------ |
| `components/` | `ui/`            | 改名                                 |
| `services/`   | `model/`         | 纯业务规则、数据转换、状态归属 model |
| `hooks/`      | `model/`         | hook 是 React 状态模型，合并到 model |
| `types.ts`    | `model/types.ts` | 领域类型归 model                     |
| `api/`        | `api/`           | 保留                                 |

### 问题 3：文件命名风格四种混用

同一仓库里存在四种命名风格：

| 风格             | 例子                                                  | 使用场景              |
| ---------------- | ----------------------------------------------------- | --------------------- |
| `PascalCase.tsx` | `ProductCard.tsx`、`LoginModal.tsx`                   | 绝大多数 React 组件   |
| `kebab-case.ts`  | `use-add-to-cart-action.ts`、`category-mapping.ts`    | 一部分 hook / service |
| `camelCase.ts`   | `useRecipesData.ts`、`blockMap.tsx`                   | 零散违规              |
| `dot.case.ts`    | `catalog.api.ts`、`detail.bff.ts`、`cart.context.tsx` | API、BFF、context     |

**`CLAUDE.md` 已经明确约定"文件用 kebab-case"**，但组件文件普遍违规。两种方案：

- **方案 A（推荐，符合 FSD 与 CLAUDE.md）**：全部 `kebab-case.tsx`，组件内部默认导出类名仍为 `PascalCase`
- **方案 B**：保持"组件 PascalCase、非组件 kebab-case"的现状，但必须清除 camelCase 零星违规（`useRecipesData.ts` → `use-recipes-data.ts`、`blockMap.tsx` → `block-map.tsx`）

### 问题 4：Dot-suffix 语义重叠

`features/product/api/` 下同时出现五种后缀：

```
catalog.api.ts            ← .api
content.api.ts            ← .api
detail.bff.ts             ← .bff
related.bff.ts            ← .bff
stock.bff.ts              ← .bff
enrichment.api.ts         ← .api
meilisearch.repo.ts       ← .repo
product-graphql.service.ts← .service（但放在 api/ 下）
query-facade.ts           ← 无后缀
unified.api.ts            ← .api
```

`.api / .bff / .repo / .service` 四种后缀语义模糊，难以建立一致的 mental model。建议只保留一种：

- **方案 A（FSD 风格，推荐）**：全部去掉后缀，文件名直接表达语义（`catalog.ts`、`reviews.ts`），由所在目录 `api/` 提供上下文
- **方案 B**：只保留 `.api.ts`，把 `.bff / .repo / .service` 全部归并

### 问题 5：Slice 边界混乱

#### 5.1 `category` 与 `cms-page` 重叠

```
features/cms-page/components/CategoryGrid.tsx         ← 应归 entities/category/ui
features/cms-page/components/CategoryProductCard.tsx  ← 应归 entities/product/ui
features/cms-page/components/CategoryTemplate.tsx     ← 应归 widgets/category-template
features/category/components/CategorySidebar.tsx      ← 应归 entities/category/ui 或 widgets
```

`cms-page` 的职责应该仅限于 CMS 区块渲染框架（`blockMap`、`CmsPageRichContent`），具体业务组件应归属对应 entity/widget。

#### 5.2 `account` slice 扁平混乱

```
features/account/
├── account.service.ts       ← 业务规则 → model/
├── countries-data.api.ts    ← HTTP 调用 → api/
├── http.api.ts              ← HTTP 调用 → api/
├── use-account.ts           ← hook → model/
├── countries.json           ← 数据资源 → lib/
├── types.ts                 ← types → model/types.ts
└── index.ts
```

虽然规范允许"< 8 文件扁平"，但此处语义已混淆，应建标准子目录。

#### 5.3 `navigation` slice 同问题

`header-menu.bff.ts` 放在 slice 根目录，BFF 应归 `api/`。

### 问题 6：`app/_ui/` 不全是 widget

```
app/_ui/
├── Header.tsx               ← 全局 widget ✓
├── Footer.tsx               ← 全局 widget ✓
├── HeaderClient.tsx         ← widget 内部 ✓
├── MobileTabbar.tsx         ← 全局 widget ✓
├── HeroCarousel.tsx         ← 需确认消费者
├── HomeFirstHeroSection.tsx ← 仅首页使用 → pages/home/
├── SignupPromoController.tsx← 全局行为，可能是 feature
├── SignupPromoModal.tsx     ← 模态 → widget 或 feature
└── share/                   ← 跨路由 widget，独立切分 OK
```

### 问题 7：`shared/utils/seo.ts` 位置尴尬

当前顶层同时存在 `shared/`（一个文件）和 `infrastructure/`（大量文件），定位重复。FSD 里应统一到 `shared/`：

```
shared/
├── api/       ← 原 infrastructure/api/
├── config/    ← 原 infrastructure/config/
├── lib/       ← 原 infrastructure/observability/ + shared/utils/
└── ui/        ← 可选，本项目由 libs/ui 承担
```

---

## 四、目标结构（FSD 对齐）

```
apps/jd-frontend/
├── app/                          # 只保留 Next.js 路由体系
│   ├── (marketing)/ (shop)/ (account)/
│   ├── **/page.tsx layout.tsx loading.tsx error.tsx
│   ├── api/*/route.ts            # 薄控制器 ≤ 30 行
│   ├── providers.tsx globals.css robots.ts sitemap.ts
│   └── layout.tsx
│
├── pages/                        # 页面私有组件（从 app/<route>/ 提升）
│   ├── home/ui/
│   ├── product-detail/
│   │   ├── ui/                   # ProductDetailContent、ProductDetailClient 等
│   │   ├── model/                # pdp-features、pdp-section-nav、product-detail-data
│   │   └── index.ts
│   ├── category/ui/              # CategoryPageContent、CategoryProductGrid
│   ├── account/ui/               # AccountScaffold、AccountSkeleton
│   └── search/ ...
│
├── widgets/                      # 组合块
│   ├── header/      ui/ model/   # 原 app/_ui/Header*
│   ├── footer/      ui/          # 原 app/_ui/Footer
│   ├── mobile-tabbar/            # 原 app/_ui/Mobile*
│   ├── promo-bar/                # 原 app/_ui/PromoBar
│   ├── signup-promo/             # 原 app/_ui/SignupPromo*
│   ├── cart-drawer/              # 原 features/cart/components/CartDrawer
│   ├── login-modal/              # 原 features/auth/components/LoginModal
│   ├── hero-banner/              # 原 features/cms-page/components/HeroBanner
│   ├── deal-product-block/       # 原 features/cms-page/components/Deal*
│   ├── cms-section-renderer/     # 原 features/cms-page/*（blockMap 核心）
│   └── share-menu/               # 原 app/_ui/share
│
├── features/                     # 用户动作
│   ├── add-to-cart/              # 原 features/cart 的 AddToCartButton + use-add-to-cart-action
│   ├── quick-add/                # 原 features/product 的 QuickAddModal
│   ├── auth-by-email/            # 原 features/auth 的 login/register
│   ├── auth-session/             # cookies、session-tokens、token
│   ├── global-search/            # 原 features/search 的 GlobalSearch
│   ├── filter-catalog/           # 原 features/search 的 FilterPanel/SortPanel
│   ├── filter-recipes/           # 原 features/recipe 的 FiltersPanel
│   ├── toggle-wishlist/
│   └── submit-review/
│
├── entities/                     # 业务实体
│   ├── product/
│   │   ├── api/      # catalog content enrichment reviews qa unified meilisearch
│   │   ├── model/    # product-mapper query-model types bff-types
│   │   ├── ui/       # ProductCard ProductCardSkeleton ProductCardSection
│   │   └── index.ts
│   ├── cart/
│   │   ├── api/      # cart-rest cart-bff cart-rest-handler
│   │   ├── model/    # cart-context types
│   │   └── index.ts
│   ├── category/
│   │   ├── api/      # category list
│   │   ├── model/    # category-mapper category-mapping types
│   │   ├── ui/       # CategorySidebar CategoryGrid（从 cms-page 收回）
│   │   └── index.ts
│   ├── user/                     # 原 features/account
│   │   ├── api/      # account http countries-data
│   │   ├── model/    # use-account types account-service
│   │   └── index.ts
│   ├── article/                  # 原 features/blog
│   │   ├── api/
│   │   ├── ui/       # ArticleDetail ArticleSearchBox ArticleSidebar Breadcrumb
│   │   └── index.ts
│   ├── recipe/
│   │   ├── api/
│   │   ├── model/
│   │   ├── ui/       # RecipeCard RecipeGrid RecipeDetail RecipeHeader
│   │   └── index.ts
│   └── cms-page/                 # 仅保留 blockMap CmsPageRichContent types
│       ├── api/      # carousel cms-page-layout cms-pages
│       ├── model/    # types block-map
│       └── index.ts
│
└── shared/                       # 合并 infrastructure + 顶层 shared
    ├── api/                      # 原 infrastructure/api/
    ├── config/                   # 原 infrastructure/config/
    ├── lib/                      # 原 infrastructure/observability/ + shared/utils/
    └── ui/                       # 可选，目前由 libs/ui 承担
```

---

## 五、命名规范

落地到可执行的规则：

1. **目录名**：`kebab-case`（`cms-page`、`add-to-cart`、`mobile-tabbar`）
2. **slice segment 只能是**：`api/` `model/` `ui/` `lib/` `config/` —— 删除 `services/` `components/` `hooks/`
3. **文件名**：全部 `kebab-case`，包括 React 组件文件（`product-card.tsx` 默认导出 `ProductCard`）
4. **删除所有 dot-suffix**：
   - `*.bff.ts` `*.api.ts` `*.repo.ts` `*.service.ts` 均去后缀（由 `api/` 目录提供上下文）
   - `*.mapper.ts` 去后缀，移入 `model/`（如 `product.mapper.ts` → `model/mapper.ts`）
   - `*.context.tsx` 保留 `.context` 或改为 `model/<slice>-context.tsx`，**全局二选一**
5. **hook 文件名**：`use-xxx.ts`（kebab），禁止 `useXxx.ts`
6. **public API**：每个 slice 必须有 `index.ts`，外部**只能**通过 `index.ts` import
7. **层间依赖**：`app → pages → widgets → features → entities → shared`，禁止反向

---

## 六、迁移路线图

按风险从低到高排列，每一步都可独立验证、独立合并。

### 第 1 步：统一文件命名大小写（最低风险）

纯机械改动，不影响语义。

- `useRecipesData.ts` → `use-recipes-data.ts`
- `blockMap.tsx` → `block-map.tsx`
- 所有 `hooks/useXxx.ts` → `use-xxx.ts`
- 如采用方案 A：所有组件 `PascalCase.tsx` → `kebab-case.tsx`（默认导出类名不变）

**验证**：`pnpm typecheck && pnpm lint && pnpm build`

### 第 2 步：合并 dot-suffix

- `detail.bff.ts / catalog.api.ts / ...` → 去后缀或统一 `.api.ts`
- 同步更新所有 import 路径

**验证**：`pnpm typecheck && pnpm build`

### 第 3 步：segment 改名

- `services/` → `model/`
- `components/` → `ui/`
- `hooks/*` → 并入 `model/`
- `types.ts` → `model/types.ts`

**验证**：`pnpm typecheck && pnpm build`

### 第 4 步：合并 `infrastructure/` 与顶层 `shared/`

- `infrastructure/api/` → `shared/api/`
- `infrastructure/config/` → `shared/config/`
- `infrastructure/observability/` → `shared/lib/`
- `shared/utils/` → `shared/lib/`

**验证**：`pnpm typecheck && pnpm build`

### 第 5 步：新建 `entities/` 层（有影响）

把 `features/{product,cart,category,recipe,blog,account,cms-page}` 中的纯实体部分迁移到 `entities/`。

核心判定：如果这个东西是"业务对象"本身（有 CRUD、有纯视图、有类型），就是 entity。

**验证**：逐个 slice 迁移，每迁一个跑一次 `pnpm check`。

### 第 6 步：新建 `widgets/` 层

- `app/_ui/*`（除 `HomeFirstHeroSection` 外）→ `widgets/*`
- `features/*/ui/*` 中属于组合块的 → `widgets/*`

**验证**：`pnpm check && pnpm build`

### 第 7 步：新建 `pages/` 层（可选）

- `app/<route>/*.tsx`（非 `page.tsx/layout.tsx` 的私有组件） → `pages/<slice>/ui/`
- 这一步也可以不做，继续保留在 `app/<route>/` 同目录，等页面私有组件 > 5 个时再提升

**验证**：`pnpm build && pnpm e2e`（验证路由渲染无回归）

### 第 8 步：回写规范

本文档目标结构确立后，更新 `docs/architecture/file-layout-spec.md` 作为新的唯一权威标准，并更新 `CLAUDE.md` 的相关段落。

---

## 七、Code Review 检查清单（迁移后）

审查者检查以下 7 个问题即可覆盖 90% 的架构违规：

| #   | 检查项                        | 违规示例                               | 正确做法                             |
| --- | ----------------------------- | -------------------------------------- | ------------------------------------ |
| 1   | 文件位置对了吗？              | `ProductCard` 放在 `features/product/` | 实体视图 → `entities/product/ui/`    |
| 2   | 层间依赖方向对了吗？          | `entities/` 引用 `features/`           | 只能 `features → entities`，不能反向 |
| 3   | 跨 slice 走 `index.ts` 了吗？ | `from '@/entities/cart/ui/cart-item'`  | `from '@/entities/cart'`             |
| 4   | segment 职责对了吗？          | `ui/` 里直接调 HTTP                    | 数据访问放 `api/`，UI 只消费 props   |
| 5   | `shared/` 没被污染吗？        | `shared/ui/` 里有 `product: Product`   | 原子组件不能引入业务类型             |
| 6   | 文件命名一致吗？              | `useFoo.ts`、`FooBar.tsx` 混用         | 统一 `kebab-case`                    |
| 7   | dot-suffix 清理了吗？         | 还出现 `.bff / .repo / .service`       | 只由所在目录提供上下文               |

---

## 八、附录：完整文件迁移映射表（示例片段）

以下给出 `product` slice 的完整迁移映射，其他 slice 按同样规则处理。

### `features/product/` → `entities/product/` + `features/*` + `widgets/*`

| 原路径                                                       | 目标路径                                                 | 所属层   |
| ------------------------------------------------------------ | -------------------------------------------------------- | -------- |
| `features/product/api/catalog.api.ts`                        | `entities/product/api/catalog.ts`                        | entities |
| `features/product/api/content.api.ts`                        | `entities/product/api/content.ts`                        | entities |
| `features/product/api/detail.bff.ts`                         | `entities/product/api/detail.ts`                         | entities |
| `features/product/api/enrichment.api.ts`                     | `entities/product/api/enrichment.ts`                     | entities |
| `features/product/api/meilisearch.repo.ts`                   | `entities/product/api/meilisearch.ts`                    | entities |
| `features/product/api/product-graphql.service.ts`            | `entities/product/api/graphql.ts`                        | entities |
| `features/product/api/product-params.ts`                     | `entities/product/api/params.ts`                         | entities |
| `features/product/api/qa.api.ts`                             | `entities/product/api/qa.ts`                             | entities |
| `features/product/api/query-facade.ts`                       | `entities/product/api/query-facade.ts`                   | entities |
| `features/product/api/related.bff.ts`                        | `entities/product/api/related.ts`                        | entities |
| `features/product/api/reviews.api.ts`                        | `entities/product/api/reviews.ts`                        | entities |
| `features/product/api/stock.bff.ts`                          | `entities/product/api/stock.ts`                          | entities |
| `features/product/api/unified.api.ts`                        | `entities/product/api/unified.ts`                        | entities |
| `features/product/api/upsell.bff.ts`                         | `entities/product/api/upsell.ts`                         | entities |
| `features/product/api/variants.bff.ts`                       | `entities/product/api/variants.ts`                       | entities |
| `features/product/services/product.mapper.ts`                | `entities/product/model/mapper.ts`                       | entities |
| `features/product/services/query.model.ts`                   | `entities/product/model/query.ts`                        | entities |
| `features/product/services/unified-utils.ts`                 | `entities/product/lib/unified-utils.ts`                  | entities |
| `features/product/bff-types.ts`                              | `entities/product/model/bff-types.ts`                    | entities |
| `features/product/components/ProductCard.tsx`                | `entities/product/ui/product-card.tsx`                   | entities |
| `features/product/components/ProductCardSkeleton.tsx`        | `entities/product/ui/product-card-skeleton.tsx`          | entities |
| `features/product/components/ProductCardSection.tsx`         | `entities/product/ui/product-card-compact.tsx`           | entities |
| `features/product/components/AddToCartButton.tsx`            | `features/add-to-cart/ui/add-to-cart-button.tsx`         | features |
| `features/product/components/QuickAddModal.tsx`              | `features/quick-add/ui/quick-add-modal.tsx`              | features |
| `features/product/components/CustomizableOptionsSection.tsx` | `features/quick-add/ui/customizable-options-section.tsx` | features |

---

## 九、变更历史

| 日期       | 版本 | 变更                                                                 |
| ---------- | ---- | -------------------------------------------------------------------- |
| 2026-05-07 | v1.0 | 初始版本。基于 FSD v2 审计现状、给出问题清单、目标结构、迁移路线图。 |
