# 目录分层改造方案

## 目标

把当前"六层 DDD 混合功能模块"的组织方式改为**按功能域拆分的三层结构**：

```
features/  ← 每个功能域：api + 组件 + hooks + 类型 放一起
shared/    ← 多个功能共用的：Header、Footer、工具函数
core/     ← 基础设施：API 客户端、配置、可观测性（部分已有）
```

改造后的标准：**改 Product 相关代码，进 `features/product/` 全部搞定，不用跨六个目录跳。**

---

## 一、目标目录结构

```
apps/jd-frontend/
├── app/                              # Next.js 专属：页面路由（不动）
│   ├── layout.tsx
│   ├── page.tsx
│   ├── products/[slug]/page.tsx
│   ├── categories/[slug]/page.tsx
│   ├── api/                          # API Route Handler（不动）
│   └── ...
│
├── core/                             # 基础设施
│   ├── api/                          # ✅ 已完成：统一 API 管道
│   │   ├── clients/                  # strapi, magento, meilisearch...
│   │   ├── pipeline/                 # createHttpClient 工厂
│   │   ├── errors.ts
│   │   ├── index.ts
│   │   └── route-helpers.ts
│   ├── config/                       # ← 新建：收口配置
│   │   ├── env.ts                    # 从 lib/env.ts 搬
│   │   ├── api-config.ts             # 从 lib/api/config.ts 搬
│   │   └── cache-policy.ts           # 从 lib/api/cache-policy.ts 搬
│   └── observability/                # ← 新建
│       ├── logger.ts                 # 从 lib/observability/logger.ts
│       └── metrics.ts                # 从 lib/observability/metrics.ts
│
├── features/                         # ← 新建：按功能域拆分
│   ├── product/                      # 商品
│   ├── cart/                         # 购物车
│   ├── auth/                         # 认证
│   ├── category/                     # 分类
│   ├── review/                       # 评价 & Q&A
│   ├── search/                       # 搜索
│   ├── recipe/                       # 食谱
│   ├── cms-page/                     # CMS 页面渲染
│   ├── account/                      # 账户 & 订单
│   └── navigation/                   # 导航菜单
│
├── shared/                           # ← 新建：App 内跨功能共享
│   ├── ui/                           # 布局级 UI（Header、Footer...）
│   │   └── share/                    # 分享组件
│   └── utils/                        # 纯工具函数
│
├── libs/                             # Nx Libs（不动）
│   ├── shared/    @prism/shared      # 纯类型 & 通用工具
│   ├── ui/        @prism/ui          # 原子 UI 组件
│   ├── blog/      @prism/blog        # Blog 域（待评估搬迁）
│   └── tokens/    @prism/tokens      # 设计 Token
│
├── tests/
├── e2e/
└── public/
```

---

## 二、每个 Feature 的内部结构

```
features/product/
├── api/                    # 数据获取层
│   ├── catalog.ts          # ← lib/api/magento/catalog.ts
│   ├── unified-product.ts  # ← lib/api/unified-product.ts
│   ├── enrichment.ts       # ← lib/api/strapi/product-enrichment.ts
│   ├── content.ts          # ← lib/api/strapi/product-content.ts
│   └── blog-bridge.ts      # ← lib/api/articles.ts
│
├── bff/                    # BFF handlers（服务端数据聚合）
│   ├── detail.ts           # ← lib/api/bff/product/detail.ts
│   ├── list.ts
│   ├── variants.ts
│   ├── stock.ts
│   ├── related.ts
│   ├── upsell.ts
│   └── types.ts
│
├── domain/                 # 纯领域模型
│   └── query.ts            # ← lib/domain/product/query.ts
│
├── infrastructure/         # Repository 实现
│   ├── meilisearch-repo.ts # ← lib/infrastructure/product/
│   └── category-repo.ts
│
├── application/            # 编排层
│   └── query-facade.ts     # ← lib/application/product/
│
├── mappers/
│   └── product.mapper.ts   # ← lib/mappers/product.mapper.ts
│
├── services/
│   ├── product-graphql.ts  # ← lib/services/magento/product.service.ts
│   └── related.ts          # ← lib/services/search/meilisearch.service.ts
│
├── components/             # 商品相关 UI 组件
│   ├── ProductCard.tsx     # ← app/shop/components/ProductCard.tsx
│   ├── ProductCardSection.tsx
│   ├── ProductCarouselSection.tsx
│   ├── FeaturedProductsSection.tsx
│   ├── DealProductCard.tsx
│   ├── AddToCartButton.tsx
│   ├── CustomizableOptionsSection.tsx
│   └── QuickAddModal.tsx   # ← app/shop/components/QuickAddModal.tsx
│
└── types.ts                # 商品域公共类型
```

### 其他 Feature 同理，按需包含子目录

- `api/` — 必须有
- `components/` — 有 UI 的才有
- `bff/` / `domain/` / `mappers/` — 有才建，不预先创建空目录

---

## 三、每个目录的职责说明

### `core/` — 基础设施

| 子目录                | 职责                                                   | 谁可以用     |
| --------------------- | ------------------------------------------------------ | ------------ |
| `core/api/`           | 统一 HTTP 管道（createHttpClient）、错误类型、请求追踪 | 所有 feature |
| `core/config/`        | 环境变量校验（Zod schema）、API 地址解析、缓存策略     | 所有 feature |
| `core/observability/` | 日志器、性能指标                                       | 所有 feature |

**规则**：`core/` 不依赖任何 `feature/`，不包含业务逻辑。

### `features/` — 业务功能

| Feature       | 职责                                    | 包含什么                                    |
| ------------- | --------------------------------------- | ------------------------------------------- |
| `product/`    | 商品详情、列表、变体、价格、富文本      | API + BFF + 领域模型 + Repository + UI 组件 |
| `cart/`       | 购物车状态、加购、Cart Drawer           | API + Context + Hooks + UI                  |
| `auth/`       | 登录、注册、Session、Token、Login Modal | API + Context + Cookie + UI                 |
| `category/`   | 分类树、分类映射、分类页                | API + BFF + Mapper + UI                     |
| `review/`     | 商品评价、评价摘要、Q&A                 | API（Strapi）                               |
| `search/`     | Meilisearch 搜索、全局搜索框、筛选面板  | API + UI                                    |
| `recipe/`     | 食谱列表、详情、筛选                    | API + Hooks + UI 组件                       |
| `cms-page/`   | CMS 页面渲染、Section 组件注册表        | API + 类型 + Section 组件                   |
| `account/`    | 账户信息、地址、订单、Wishlist          | API + BFF + Hooks                           |
| `navigation/` | 导航菜单、移动端导航                    | API + 配置 + 工具函数                       |

**规则**：

- Feature 之间可以互相引用（如 product 引用 cart 的 Context）
- Feature 可以依赖 `core/` 和 `shared/`
- Feature 不能依赖 `app/` 目录

### `shared/` — App 内跨功能共享

| 子目录             | 职责                       | 典型文件                                              |
| ------------------ | -------------------------- | ----------------------------------------------------- |
| `shared/ui/`       | 页面壳级组件（非业务组件） | Header, Footer, MobileNavBar, ErrorPage, PromoBar     |
| `shared/ui/share/` | 分享功能 UI                | ShareMenu, ShareSheet, ShareTrigger                   |
| `shared/utils/`    | 纯工具函数（无副作用）     | format-price, notify, seo, debounce, email-validation |

**规则**：`shared/` 不依赖任何 `feature/`，只能依赖 `core/` 和 `libs/`。

### `app/` — Next.js 路由层

只放：

- `page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx`
- `app/api/*/route.ts`（API Route Handler）
- `providers.tsx` / `globals.css` / `robots.ts` / `sitemap.ts`

**不放**：业务组件、业务逻辑、API 调用函数。

### `libs/` — Nx 跨 App 共享库

| Lib             | 用途                                | 是否多个 App 消费             |
| --------------- | ----------------------------------- | ----------------------------- |
| `@prism/shared` | 类型定义、`cn()`、类型守卫          | ✅ 未来可能有                 |
| `@prism/ui`     | 原子 UI：Button, Carousel, Skeleton | ✅ 未来可能有                 |
| `@prism/tokens` | 设计 Token：颜色、间距、字体        | ✅                            |
| `@prism/blog`   | Blog 域组件 & API                   | ❌ 仅当前 App 用 → 待评估搬回 |

---

## 四、依赖方向（严格单向）

```
app/ (路由)
  ↓ import
features/*/ (业务功能)
  ↓ import
shared/ (跨功能共享)  →  core/ (基础设施)  →  libs/ (Nx 库)
```

- `app/` 只能 import `features/`、`shared/`、`core/`、`libs/`
- `features/` 可以 import `shared/`、`core/`、`libs/`、其他 `features/`
- `shared/` 可以 import `core/`、`libs/`
- `core/` 可以 import `libs/`
- **不可反向**：`core/` 不能 import `features/`，`shared/` 不能 import `features/`

---

## 五、分步执行计划

### 第 1 步：建骨架目录

```bash
mkdir -p apps/jd-frontend/core/config
mkdir -p apps/jd-frontend/core/observability
mkdir -p apps/jd-frontend/features/{product,cart,auth,category,review,search,recipe,{cms-page},account,navigation}
mkdir -p apps/jd-frontend/shared/ui/share
mkdir -p apps/jd-frontend/shared/utils
```

### 第 2 步：搬 `core/`（基础设施，零业务依赖）

| 搬什么       | 从                             | 到                              |
| ------------ | ------------------------------ | ------------------------------- |
| env.ts       | `lib/env.ts`                   | `core/config/env.ts`            |
| api config   | `lib/api/config.ts`            | `core/config/api-config.ts`     |
| cache policy | `lib/api/cache-policy.ts`      | `core/config/cache-policy.ts`   |
| logger       | `lib/observability/logger.ts`  | `core/observability/logger.ts`  |
| metrics      | `lib/observability/metrics.ts` | `core/observability/metrics.ts` |

**验证**：`pnpm typecheck` 通过。

### 第 3 步：搬 `shared/`（工具函数 + 壳组件）

| 搬什么   | 从                                                                                                                                                                                                                      | 到                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 工具函数 | `lib/utils.ts`, `lib/utils/debounce.ts`, `lib/format-price.ts`, `lib/notify.ts`, `lib/alert.ts`, `lib/seo.ts`, `lib/validation/email.ts`, `lib/cloudflare-turnstile.ts`                                                 | `shared/utils/`    |
| 壳组件   | `app/components/Header.tsx`, `Footer.tsx`, `MobileNavBar.tsx`, `MobileTabbar.tsx`, `PromoBar.tsx`, `HeroCarousel.tsx`, `HomeFirstHeroSection.tsx`, `ErrorPage.tsx`, `SignupPromoController.tsx`, `SignupPromoModal.tsx` | `shared/ui/`       |
| 分享组件 | `app/components/share/*`                                                                                                                                                                                                | `shared/ui/share/` |

**验证**：`pnpm typecheck` 通过。

### 第 4 步：搬 `features/`（逐个功能域，从最简单到最复杂）

**顺序**：navigation → account → recipe → review → cms-page → search → category → auth → cart → product

理由：product 最复杂（33 个文件）、依赖最多，放最后搬。

每个 feature 的搬运步骤：

1. 建子目录（`api/`, `components/` 等）
2. 搬文件
3. 更新所有 import 路径
4. **单独验证**：`pnpm typecheck` 通过再继续下一个

### 第 5 步：清理空壳目录

搬运完成后删除：

- `lib/domain/`, `lib/application/`, `lib/infrastructure/`, `lib/services/`, `lib/mappers/`
- `lib/api/bff/`, `lib/api/magento/`, `lib/api/strapi/`, `lib/api/adapters/`
- `lib/auth/`, `lib/cart/`, `lib/account/`, `lib/magento/`, `lib/auth-modal/`
- `lib/navigation/`, `lib/observability/`, `lib/validation/`
- `app/components/sections/`, `app/components/templates/`, `app/components/share/`
- `app/shop/components/`, `app/shop/lib/`
- `app/search/lib/`
- `app/recipes/components/`, `app/recipes/hooks/`
- `app/categories/components/`

**保留**（有活代码需逐步迁移）：

- `lib/api/client.ts` — 旧 ApiClient，迁完后删
- `lib/api/magento/client.ts` — 旧 magentoClient
- `lib/api/bff/magento-rest-client.ts` — 旧 magentoRestFetch
- `lib/api/bff/magento-server.ts` — 旧 magentoServerFetch
- `lib/services/magento-graphql.client.ts` — 旧 GraphQL client

### 第 6 步：最终验证

```bash
pnpm typecheck && pnpm lint && pnpm nx test jd-frontend -- --run && pnpm build
```

---

## 六、改造完成后一眼能看懂的事

| 问题                        | 答案                                            |
| --------------------------- | ----------------------------------------------- |
| 改商品详情怎么找代码？      | 进 `features/product/`                          |
| 加一个新 CMS Section 组件？ | `features/cms-page/sections/`                   |
| 通用 Button/Carousel 在哪？ | `libs/ui/`（@prism/ui）                         |
| Header/Footer 在哪？        | `shared/ui/`                                    |
| API 客户端怎么调？          | `import { createHttpClient } from '@/core/api'` |
| 错误类型在哪？              | `@/core/api/errors`                             |
| 环境变量在哪定义？          | `core/config/env.ts`                            |
| 页面路由在哪？              | `app/`                                          |

---

## 七、待删除的冗余文件

| 文件                                | 原因                                         |
| ----------------------------------- | -------------------------------------------- |
| `lib/auth/clearSession.ts`          | 一行 re-export，合并到调用方                 |
| `lib/api/bff/cart-handler.ts`       | 一行 re-export requireAuth                   |
| `lib/api/bff/product/recipes.ts`    | 空壳占位，返回 []                            |
| `lib/api/bff/product/blog-posts.ts` | 空壳占位，返回 []                            |
| `lib/api/bff/cookies.ts`            | 与 `lib/auth/cookies.ts` 重复（仅 TTL 不同） |

---

## 八、不做的事

- ❌ 不重写每个 feature 的内部代码 — 只搬目录 + 改 import
- ❌ 不动 `app/api/*/route.ts` — API Route Handler 留在原位
- ❌ 不动 `libs/` — Nx Lib 维持现状（blog 后续单独评估）
- ❌ 不在这一步合并 domain / application / infrastructure 的三层 — 先搬到同一个 feature 下，后续再简化
