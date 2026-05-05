# 目录分层改造方案

## 目标

把当前"六层 DDD 混合功能模块"的组织方式改为**按功能域拆分的扁平结构**：

```
features/  ← 每个功能域：扁平文件，用后缀区分角色（.api.ts / .bff.ts / .model.ts）
shared/    ← 多页共用的壳级组件 + 纯工具函数（不 import 任何 feature）
core/     ← 基础设施：API 管道、配置、可观测性
```

改造后的标准：**改 Product 相关代码，进 `features/product/`，看文件后缀就知道角色，不用跨六个目录跳也不会在 7 层子目录里迷路。**

---

## 一、关键设计决策：用后缀代替子目录

旧方案在每个 feature 内部保留了 7 层 DDD 子目录（`api/`、`bff/`、`domain/`、`application/`、`infrastructure/`、`mappers/`、`services/`），这只是把横向切面嵌套成纵向切面，不解决根本问题。

### 文件命名规范

| 后缀/前缀       | 角色                                | 示例                     |
| --------------- | ----------------------------------- | ------------------------ |
| `*.api.ts`      | HTTP 调用、数据获取                 | `catalog.api.ts`         |
| `*.bff.ts`      | 服务端数据聚合（BFF handler）       | `detail.bff.ts`          |
| `*.model.ts`    | 纯领域模型、查询对象                | `query.model.ts`         |
| `*.repo.ts`     | Repository 实现、外部数据源封装     | `meilisearch.repo.ts`    |
| `*.mapper.ts`   | 数据转换、DTO 映射                  | `product.mapper.ts`      |
| `*.service.ts`  | 业务逻辑服务（无 HTTP 依赖）        | `price.service.ts`       |
| `*.types.ts`    | 该功能域的类型定义                  | `types.ts`（或按需拆分） |
| `*.tsx`         | UI 组件（默认就是组件，不额外标记） | `ProductCard.tsx`        |
| `use*.ts`       | React Hooks                         | `useProductDetail.ts`    |
| `*.context.tsx` | React Context Provider              | `cart.context.tsx`       |

### 示例：product/ 扁平结构

```
features/product/
├── catalog.api.ts               # ← lib/api/magento/catalog.ts
├── enrichment.api.ts            # ← lib/api/strapi/product-enrichment.ts
├── content.api.ts               # ← lib/api/strapi/product-content.ts
├── unified.api.ts               # ← lib/api/unified-product.ts
├── detail.bff.ts                # ← lib/api/bff/product/detail.ts
├── list.bff.ts                  # ← lib/api/bff/product/list.ts
├── variants.bff.ts
├── stock.bff.ts
├── related.bff.ts
├── upsell.bff.ts
├── query.model.ts               # ← lib/domain/product/query.ts
├── query-facade.ts              # ← lib/application/product/product-query-facade.ts
├── meilisearch.repo.ts          # ← lib/infrastructure/product/
├── product.mapper.ts            # ← lib/mappers/product.mapper.ts
├── product-graphql.service.ts   # ← lib/services/magento/product.service.ts
├── ProductCard.tsx              # ← app/shop/components/ProductCard.tsx
├── ProductCardSection.tsx
├── ProductCarouselSection.tsx
├── FeaturedProductsSection.tsx
├── DealProductCard.tsx
├── AddToCartButton.tsx
├── CustomizableOptionsSection.tsx
├── QuickAddModal.tsx
├── types.ts
└── blog-bridge.api.ts           # ← lib/api/articles.ts（仅 product 相关部分）
```

**文件数 ~24**，全部在一个目录下，无子目录嵌套。用编辑器/IDE 的模糊搜索秒定位。

### 判断要不要建子目录的唯一标准

**只有当一个功能域的文件数超过 50 时，才考虑拆分子目录。** 目前最大的 feature（product）也只有约 33 个文件，远没到阈值。

---

## 二、目标目录结构

```
apps/jd-frontend/
├── app/                              # Next.js 专属：页面路由（最小化，不放业务逻辑）
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── providers.tsx
│   ├── products/[slug]/
│   │   ├── page.tsx                  # 路由入口（薄层，调用 features/）
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── api/                          # API Route Handler（不动）
│   └── ...
│
├── core/                             # 基础设施
│   ├── api/                          # ✅ 已完成：统一 HTTP 管道
│   │   ├── clients/                  # strapi, magento, meilisearch...
│   │   ├── pipeline/                 # createHttpClient 工厂
│   │   ├── errors.ts
│   │   ├── index.ts
│   │   └── route-helpers.ts
│   ├── config/
│   │   ├── env.ts                    # 从 lib/env.ts 搬
│   │   ├── api-config.ts             # 从 lib/api/config.ts 搬
│   │   └── cache-policy.ts           # 从 lib/api/cache-policy.ts 搬
│   └── observability/
│       ├── logger.ts                 # 从 lib/observability/logger.ts
│       └── metrics.ts                # 从 lib/observability/metrics.ts
│
├── features/                         # 业务功能（扁平文件，后缀区分角色）
│   ├── product/                      # 商品（试点，第一个做）
│   ├── cart/
│   ├── auth/
│   ├── category/
│   ├── review/
│   ├── search/
│   ├── recipe/
│   ├── cms-page/
│   ├── account/
│   └── navigation/
│
├── shared/                           # App 内跨功能共享
│   ├── ui/                           # 壳级组件（Header, Footer, ErrorPage...）
│   └── utils/                        # 纯工具函数（format-price, debounce...）
│
├── libs/                             # Nx Libs（不动）
│   ├── shared/    @prism/shared      # 纯类型 & 通用工具
│   ├── ui/        @prism/ui          # 原子 UI 组件
│   ├── blog/      @prism/blog        # Blog 域（待评估搬回 features/）
│   └── tokens/    @prism/tokens      # 设计 Token
│
├── tests/
├── e2e/
└── public/
```

---

## 三、每个目录的职责与边界规则

### `core/` — 基础设施

| 子目录                | 职责                                                   | 谁可以用     |
| --------------------- | ------------------------------------------------------ | ------------ |
| `core/api/`           | 统一 HTTP 管道（createHttpClient）、错误类型、请求追踪 | 所有 feature |
| `core/config/`        | 环境变量校验（Zod schema）、API 地址解析、缓存策略     | 所有 feature |
| `core/observability/` | 日志器、性能指标                                       | 所有 feature |

- `core/` 不依赖任何 `feature/`，不包含业务逻辑
- `core/` 只依赖 `libs/`

### `features/` — 业务功能

每个 feature 目录**扁平存放**，文件用后缀区分角色（见第一节命名规范）。

| Feature       | 职责                                    | 预估文件数 |
| ------------- | --------------------------------------- | ---------- |
| `product/`    | 商品详情、列表、变体、价格、富文本      | ~24        |
| `cart/`       | 购物车状态、加购、Cart Drawer           | ~8         |
| `auth/`       | 登录、注册、Session、Token、Login Modal | ~12        |
| `category/`   | 分类树、分类映射、分类页                | ~6         |
| `review/`     | 商品评价、评价摘要、Q&A                 | ~4         |
| `search/`     | Meilisearch 搜索、全局搜索框、筛选面板  | ~5         |
| `recipe/`     | 食谱列表、详情、筛选                    | ~6         |
| `cms-page/`   | CMS 页面渲染、Section 组件注册表        | ~10        |
| `account/`    | 账户信息、地址、订单、Wishlist          | ~8         |
| `navigation/` | 导航菜单、移动端导航                    | ~3         |

**规则**：

- Feature 自包含：与一个功能域相关的 API + 状态 + UI 全部在一个目录
- Feature 之间允许互相引用（如 product 用 cart Context）
- Feature 只依赖 `core/`、`shared/`、`libs/`
- Feature **不能** import `app/` 目录下的任何东西
- 文件数不足 50 时，不允许建子目录

### `shared/` — App 内跨功能共享

| 子目录          | 职责                     | 放入条件                                         |
| --------------- | ------------------------ | ------------------------------------------------ |
| `shared/ui/`    | 页面壳级组件、布局级组件 | 多页使用 + 不 import 任何 feature + 不含业务逻辑 |
| `shared/utils/` | 纯工具函数（无副作用）   | 多 feature 使用 + 纯函数 + 不依赖 React/feature  |

**shared/ vs libs/ui/ 分流规则（可执行判定）**：

| 放哪里        | 判定条件                             | 示例                       |
| ------------- | ------------------------------------ | -------------------------- |
| `libs/ui/`    | 无状态、无业务语义、跨 App 复用潜力  | Button, Skeleton, Carousel |
| `shared/ui/`  | 有本站布局语义但无业务逻辑、多页使用 | Header, Footer, ErrorPage  |
| `features/x/` | 包含业务逻辑 OR 只在单个功能域使用   | ProductCard, LoginModal    |

如果吃不准，**默认放 feature**，等第二个 feature 真正需要共享时再提升到 shared/。

**规则**：`shared/` 不 import 任何 `features/`，只 import `core/` 和 `libs/`。

### `app/` — Next.js 路由层（最小化）

只放 Next.js 路由体系文件：

- `page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx` / `not-found.tsx`
- `app/api/*/route.ts`（API Route Handler）
- `providers.tsx` / `globals.css` / `robots.ts` / `sitemap.ts`

页面专属的子组件（如 ProductDetailClient.tsx）——如果只在单页面使用且足够简单，可以放在该路由目录下；一旦复用就提到对应 feature。

**不放**：业务组件、数据获取函数、业务逻辑。

### `libs/` — Nx 跨 App 共享库（不动）

| Lib             | 用途                                |
| --------------- | ----------------------------------- |
| `@prism/shared` | 类型定义、`cn()`、类型守卫          |
| `@prism/ui`     | 原子 UI：Button, Carousel, Skeleton |
| `@prism/tokens` | 设计 Token：颜色、间距、字体        |
| `@prism/blog`   | Blog 域组件 & API（待评估搬回）     |

---

## 四、依赖方向（严格单向）

```
app/ (路由，薄层)
  ↓ import
features/*/ (业务功能，允许 feature 间互相引用)
  ↓ import
shared/ (跨功能共享)  →  core/ (基础设施)  →  libs/ (Nx 库)
```

- `app/` 只能 import `features/`、`shared/`、`core/`、`libs/`
- `features/` 可以 import `shared/`、`core/`、`libs/`、其他 `features/`
- `shared/` 可以 import `core/`、`libs/`，**不能** import `features/`
- `core/` 可以 import `libs/`，**不能** import `features/` 或 `shared/`
- 追加 ESLint `@nx/enforce-module-boundaries` 规则来强制这些约束

---

## 五、分步执行计划

### 第 0 步：删掉已知冗余（立刻做，不改结构）

| 文件                                | 原因                                         |
| ----------------------------------- | -------------------------------------------- |
| `lib/auth/clearSession.ts`          | 一行 re-export，合并到调用方                 |
| `lib/api/bff/cart-handler.ts`       | 一行 re-export requireAuth                   |
| `lib/api/bff/product/recipes.ts`    | 空壳占位，返回 []                            |
| `lib/api/bff/product/blog-posts.ts` | 空壳占位，返回 []                            |
| `lib/api/bff/cookies.ts`            | 与 `lib/auth/cookies.ts` 重复（仅 TTL 不同） |

**验证**：`pnpm typecheck && pnpm lint`

### 第 1 步：建骨架目录

```bash
mkdir -p apps/jd-frontend/core/config
mkdir -p apps/jd-frontend/core/observability
mkdir -p apps/jd-frontend/features/{product,cart,auth,category,review,search,recipe,{cms-page},account,navigation}
mkdir -p apps/jd-frontend/shared/ui
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

**验证**：`pnpm typecheck`

### 第 3 步：搬 `shared/`（工具函数 + 壳组件）

| 搬什么   | 从                                                                                                | 到                 |
| -------- | ------------------------------------------------------------------------------------------------- | ------------------ |
| 工具函数 | `lib/utils/`、`lib/format-price.ts`、`lib/notify.ts`、`lib/seo.ts` 等                             | `shared/utils/`    |
| 壳组件   | `app/components/Header.tsx`, `Footer.tsx`, `MobileNavBar.tsx`, `ErrorPage.tsx`, `PromoBar.tsx` 等 | `shared/ui/`       |
| 分享组件 | `app/components/share/*`                                                                          | `shared/ui/share/` |

**验证**：`pnpm typecheck`

### 第 4 步：试点 — `features/product/`（最复杂的先做）

**理由**：product 是最大（~33 个文件）、依赖最复杂的 feature。如果这个模式对 product 好用，对其他 feature 一定也好用。反之如果先做简单的，做到第 9 步发现 product 装不下，前面全白改。

步骤：

1. 在 `features/product/` 下用**扁平后缀命名**（见第一节）放文件
2. 搬文件，更新文件内 import（约 20-30 处）
3. **暂停，验证**：`pnpm typecheck && pnpm lint && pnpm nx test jd-frontend -- --run`
4. 复盘 product 的迁移经验，调整规则后再铺开

### 第 5 步：搬其余 features（按产品重要性排序）

**新顺序**（基于业务重要性和互相引用，不再按复杂度）：

1. `cart/` — product 强依赖
2. `auth/` — cart 强依赖
3. `category/` — product 引用
4. `search/`
5. `review/`
6. `recipe/`
7. `cms-page/`
8. `account/`
9. `navigation/`

每个 feature 的步骤：搬文件 → 更新 import → `pnpm typecheck` → 下一个。

### 第 6 步：清理空壳目录

搬运完成后删除空的旧目录：

- `lib/domain/`、`lib/application/`、`lib/infrastructure/`、`lib/services/`、`lib/mappers/`
- `lib/api/bff/`、`lib/api/magento/`、`lib/api/strapi/`、`lib/api/adapters/`
- `lib/auth/`、`lib/cart/`、`lib/account/`、`lib/magento/`、`lib/auth-modal/`
- `lib/navigation/`、`lib/observability/`、`lib/validation/`
- `app/components/sections/`、`app/components/templates/`
- `app/shop/components/`、`app/shop/lib/`
- `app/search/lib/`
- `app/recipes/components/`、`app/recipes/hooks/`
- `app/categories/components/`

**暂保留**（有引用未完全迁完的残留客户端）：

- `lib/api/client.ts` — 旧 ApiClient，迁完后删
- `lib/api/magento/client.ts`
- `lib/api/bff/magento-rest-client.ts`
- `lib/api/bff/magento-server.ts`
- `lib/services/magento-graphql.client.ts`

### 第 7 步：最终验证

```bash
pnpm typecheck && pnpm lint && pnpm nx test jd-frontend -- --run && pnpm build
```

---

## 六、风险与应对

| 风险                                  | 应对                                                                |
| ------------------------------------- | ------------------------------------------------------------------- |
| Import 路径改动量大（~162 处 @/lib/） | 每一步独立验证 typecheck；只在 clean git state 下执行；提交小步走   |
| 与并行分支冲突                        | 第 4 步试点跑通前不合并其他大 PR；短期内冻结对 lib/ 结构的大改      |
| 后缀命名争议                          | 试点 product 时固定后缀列表，之后不新增，坚持用现有后缀覆盖所有情况 |
| shared/ 与 libs/ui/ 界限模糊          | 默认放 feature，第二个消费者出现再提升（YAGNI 原则）                |
| 单个 feature 目录文件过多             | 阈值设在 50，目前最大 feature 只有 ~33；达到 50 再讨论              |

---

## 七、不做的事

- 不重写业务逻辑 — 只搬目录 + 改 import
- 不动 `app/api/*/route.ts` — API Route Handler 留在原位
- 不动 `libs/` — Nx Lib 维持现状（`@prism/blog` 后续单独评估）
- 不在 feature 内建子目录 — 除非文件数超过 50
- 不创建空目录 — 没有文件就不建

---

## 八、改造完成后一眼能看懂的事

| 问题                           | 答案                                            |
| ------------------------------ | ----------------------------------------------- |
| 改商品详情怎么找代码？         | 进 `features/product/`，按后缀找文件            |
| 加一个新 CMS Section 组件？    | 进 `features/cms-page/`                         |
| 通用 Button/Carousel 在哪？    | `libs/ui/`（@prism/ui）                         |
| Header/Footer 在哪？           | `shared/ui/`                                    |
| API 客户端怎么调？             | `import { createHttpClient } from '@/core/api'` |
| 这个文件是 API 还是模型？      | 看后缀：`.api.ts` / `.model.ts`                 |
| 环境变量在哪定义？             | `core/config/env.ts`                            |
| 页面路由在哪？                 | `app/`                                          |
| 不确定放 shared 还是 feature？ | 默认放 feature，等第二个消费者出现再提升        |
