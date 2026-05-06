# app/api 模块全链路重构计划书

> 日期：2026-05-06 | 状态：待实施 | 版本：v1.1（review 后修正）

---

## 一、目标

删除冗余代码，解决历史遗留问题，统一产品查询链路，使 `app/api` 架构清晰、易维护、易扩展。

**核心原则：**

- 产品列表统一通过 `magentoCategoryId` 或 SKU → Meilisearch 获取
- 删除所有多余 wrapper 层和死代码
- 统一响应格式和错误处理
- YAGNI：不用的直接删，不做兜底兼容

---

## 二、诊断发现的问题

### 2.1 产品查询存在 4 个独立路由 + features/search 重复 wrapper

| 入口                     | 调用链                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `/api/deal-products`     | route → `productQueryFacade.queryProducts()` ✅ 已规范，但多余                              |
| `/api/categories/[slug]` | route → `resolveCategoryBySlug()` → `productQueryFacade.queryProducts()`                    |
| `/api/global-search`     | route → `searchProducts()` → `search-meilisearch.ts` → `productQueryFacade.queryProducts()` |
| `/api/products`          | route → `searchCartProductBySkuFromMeilisearch()` — 实际是购物车富化                        |

—— 4 条产品查询链路，最终都走 `productQueryFacade` 或 `meilisearch.repo.ts`，但上层包装各自不同。

### 2.2 features/search/ 存在无用 wrapper

- `shop-search.ts` — 薄 wrapper，委托 `productQueryFacade`
- `search-meilisearch.ts` — 薄 wrapper，委托 `productQueryFacade`
- `search-service.ts` — 薄 wrapper，委托 `search-meilisearch.ts`

三层 wrapper 层层委托，没有增加任何实际价值。

### 2.3 features/product/api/ 存在无用 wrapper

- `list.bff.ts` → `meilisearch.bff.ts` → `query-facade.ts` 三层调用链
- `meilisearch.bff.ts` 仅做参数转换，无业务逻辑

### 2.4 `/api/products` 名不副实

当前实际上是购物车商品富化（查 configurable_options），不是产品列表查询。

### 2.5 Recipe 搜索分叉

`/api/search/recipes`（关键词搜索）和 `/api/recipes/search`（分面搜索）分散在两个路径下，功能独立但命名混乱。

### 2.6 错误处理不统一

| 模式                                        | 使用的路由                                                 |
| ------------------------------------------- | ---------------------------------------------------------- |
| `handleApiError(error)`                     | product-qa、reviews、search/recipes、recipes/search、admin |
| 手动 `try/catch` + `{success, data, error}` | products、deal-products、categories、header-menu           |
| 手动 `try/catch` + 自定义格式               | auth、v1/account                                           |

`handleApiError` 返回 `{error: message}` 格式，与 SSO 客户端定义的 `{success, data, error}` 标准不一致。

---

## 三、改造方案

### 3.1 路由层：app/api 最终结构

```
app/api/
├── products/
│   └── route.ts                     ← 产品查询唯一入口
├── products/[sku]/
│   └── variants/route.ts            ← 产品变体（不变）
├── recipes/search/route.ts          ← Recipe 搜索唯一入口（合并关键词+分面）
├── global-search/route.ts           ← 全局搜索（产品改为调 productQueryFacade）
├── categories/
│   ├── route.ts                     ← 分类树（不变）
│   └── [slug]/
│       ├── route.ts                 ← 分类产品列表（简化+对齐响应格式）
│       └── breadcrumbs/route.ts     ← 面包屑（不变）
├── header-menu/route.ts             ← 不变
├── reviews/*                        ← 不变
├── product-qa/*                     ← 不变
├── revalidate/*                     ← 不变
├── admin/*                          ← 不变
├── dev/request-log/route.ts         ← 不变
├── auth/*                           ← 冻结不动
└── v1/*                             ← 冻结不动
```

**删除的路由：**

- `/api/deal-products/route.ts` — 合并到 `/api/products`
- `/api/search/recipes/route.ts` — 合并到 `/api/recipes/search`

### 3.2 `/api/products` 统一入口

```
GET /api/products?magentoCategoryId=42&page=1&sort=price_asc   → 分类浏览
GET /api/products?q=blender&brand=xxx&size=xxx                  → 关键词搜索
GET /api/products?strapiCategorySlug=home-deals&pageSize=8      → CMS Deal Block
GET /api/products?strapiCategoryId=123&pageSize=8               → CMS CategoryGrid
GET /api/products?sku=JD-XXX                                    → 单SKU查询
GET /api/products?skus=JD-A,JD-B,JD-C                           → 批量SKU查询
```

Route handler（≤25 行）：

```ts
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/infrastructure/api/route-helpers';
import {
  productQueryFacade,
  parseProductQueryParams,
} from '@/features/product';

export async function GET(request: NextRequest) {
  try {
    const params = parseProductQueryParams(request.nextUrl.searchParams);
    const result = await productQueryFacade.queryProducts(params);
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 3.3 features/product/api/ 清理

| 文件                  | 操作     | 原因                                                                                                               |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `query-facade.ts`     | **保留** | 所有产品查询唯一入口；确保 `queryBySkus()` 从 index.ts 导出                                                        |
| `meilisearch.repo.ts` | **保留** | 核心 Meilisearch 搜索实现                                                                                          |
| `meilisearch.bff.ts`  | **删除** | 仅做参数转换，委托 query-facade。其 `searchProductsBySkusForBFF` 调用方需迁移到 `productQueryFacade.queryBySkus()` |
| `list.bff.ts`         | **删除** | 仅委托 meilisearch.bff。其 `getProductListBFF` 调用方需迁移到 `productQueryFacade.queryProducts()`                 |
| `catalog.api.ts`      | **保留** | `fetchProducts` 被 admin 路由使用                                                                                  |

**新增：** `features/product/api/product-params.ts` — URL 参数解析 + 校验

**受影响的消费者（必须迁移）：**

| 消费者                                              | 当前 import                                   | 迁移为                               |
| --------------------------------------------------- | --------------------------------------------- | ------------------------------------ |
| `features/category/api/list.bff.ts`                 | `getProductListBFF` from `@/features/product` | `productQueryFacade.queryProducts()` |
| `features/cms-page/api/cms-pages.api.ts`            | `searchProductsBySkusForBFF`                  | `productQueryFacade.queryBySkus()`   |
| `features/cms-page/components/ProductCarousel.tsx`  | `searchProductsBySkusForBFF`                  | `productQueryFacade.queryBySkus()`   |
| `features/cms-page/components/FeaturedProducts.tsx` | `searchProductsBySkusForBFF`                  | `productQueryFacade.queryBySkus()`   |

### 3.4 features/search/ 削减

| 文件                     | 操作     | 原因                               |
| ------------------------ | -------- | ---------------------------------- |
| `shop-search.ts`         | **删除** | 所有功能 productQueryFacade 已覆盖 |
| `search-meilisearch.ts`  | **删除** | productQueryFacade 薄 wrapper      |
| `search-service.ts`      | **删除** | search-meilisearch 薄 wrapper      |
| `meilisearch.service.ts` | **保留** | `fetchRelatedBySlug` 独立功能      |

保留的组件（`GlobalSearch`, `FilterPanel`, `SortPanel`）和类型定义不动。

**受影响的消费者（必须迁移）：**

| 消费者                                              | 当前 import                                         | 迁移为                                                         |
| --------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| `app/shop/page.tsx`                                 | `searchProducts` from `@/features/search`           | `productQueryFacade.queryProducts()` from `@/features/product` |
| `app/shop/[slug]/page.tsx`                          | `searchProducts` from `@/features/search`           | `productQueryFacade.queryProducts()` from `@/features/product` |
| `app/search/page.tsx`                               | `fetchProductSearchResult` from `@/features/search` | `productQueryFacade.queryProducts()` from `@/features/product` |
| `app/categories/[slug]/CategoryPageContent.tsx`     | `searchProducts` from `@/features/search`           | `productQueryFacade.queryProducts()` from `@/features/product` |
| `features/cms-page/components/CategoryTemplate.tsx` | `searchProducts` from `@/features/search`           | `productQueryFacade.queryProducts()` from `@/features/product` |

### 3.5 CMS 组件 + deal-products 合并

| 文件                             | 改动                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `app/api/deal-products/route.ts` | **删除**（功能合并到 `/api/products`）                                       |
| `LazyDealProductBlock.tsx`       | `fetch(/api/deal-products?)` → `fetch(/api/products?strapiCategorySlug=xxx)` |
| `CategoryGrid.tsx`               | `fetch(/api/deal-products?)` → `fetch(/api/products?magentoCategoryId=xxx)`  |

### 3.6 Recipe 搜索合并

`/api/search/recipes` + `/api/recipes/search` → 合并到 `/api/recipes/search`：

```ts
// app/api/recipes/search/route.ts
export async function GET(request: NextRequest) {
  const params = parseRecipeSearchParams(request.nextUrl.searchParams);
  try {
    const result = params.q
      ? await fetchRecipeKeywordSearchStrapi(params)
      : await fetchRecipeFacetedSearchStrapi(params);
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    return handleApiError(error);
  }
}
```

**受影响的客户端调用方：**

- `features/recipe/api/recipes.api.ts` — 更新内部 fetch URL：`/api/search/recipes` → `/api/recipes/search`
- `tests/recipes-search-route.spec.ts` — 更新 import 路径和测试

### 3.7 global-search 重构

产品搜索部分改为直接调 `productQueryFacade`，删除自带的 `searchProductsWithFallback` 逻辑：

```ts
// app/api/global-search/route.ts
import { productQueryFacade } from '@/features/product';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({
      products: { items: [], total: 0 },
      articles: { items: [], total: 0 },
      recipes: { items: [], total: 0 },
    });
  }

  const [productsResult, articlesResult, recipesResult] =
    await Promise.allSettled([
      productQueryFacade.queryProducts({ q, pageSize: LIMIT }),
      searchArticles({ q, page: 1, pageSize: LIMIT }),
      fetchRecipeKeywordSearchStrapi({ q, page: 1, pageSize: LIMIT }),
    ]);
  // ... 处理 results
}
```

### 3.8 统一错误处理

修复 `handleApiError` 返回格式，与 SSO 契约 `{success, data, error}` 一致：

```ts
// infrastructure/api/route-helpers.ts
export function handleApiError(error: unknown): NextResponse<{
  success: false;
  data: null;
  error: { message: string; code: string; detail?: unknown };
}> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          message: error.message,
          code: 'API_ERROR',
          detail: error.data,
        },
      },
      { status: error.status }
    );
  }
  const message =
    error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json(
    { success: false, data: null, error: { message, code: 'INTERNAL_ERROR' } },
    { status: 502 }
  );
}
```

**受影响的消费者（handleApiError 返回格式变了，需确认兼容）：**

| 消费者               | 当前处理方式                               | 兼容性                        |
| -------------------- | ------------------------------------------ | ----------------------------- |
| product-qa routes    | 使用 handleApiError，客户端读 `json.error` | 需改为读 `json.error.message` |
| reviews routes       | 使用 handleApiError，客户端读 `json.error` | 同上                          |
| admin routes         | 使用 handleApiError                        | 开发工具，影响小              |
| recipes/search route | 使用 handleApiError                        | 需对齐                        |
| global-search route  | 手动格式                                   | 改为使用 handleApiError       |

统一的客户端错误处理模式：

```ts
// 之前
if (json.error) {
  showError(json.error);
}
// 之后
if (!json.success) {
  showError(json.error?.message);
}
```

---

## 四、改动范围汇总

| 层                              | 删除                                                           | 新增                | 修改                                                                                                   |
| ------------------------------- | -------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------ |
| `app/api/`                      | `deal-products/route.ts`, `search/recipes/route.ts`            | —                   | `products/route.ts`, `global-search/route.ts`, `recipes/search/route.ts`, `categories/[slug]/route.ts` |
| `infrastructure/api/`           | —                                                              | —                   | `route-helpers.ts`                                                                                     |
| `features/product/api/`         | `meilisearch.bff.ts`, `list.bff.ts`                            | `product-params.ts` | `index.ts`                                                                                             |
| `features/search/api/`          | `shop-search.ts`, `search-meilisearch.ts`, `search-service.ts` | —                   | `index.ts`                                                                                             |
| `features/cms-page/`            | —                                                              | —                   | `LazyDealProductBlock.tsx`, `CategoryGrid.tsx`                                                         |
| `app/shop/`                     | —                                                              | —                   | `page.tsx`, `[slug]/page.tsx`                                                                          |
| `app/search/`                   | —                                                              | —                   | `page.tsx`                                                                                             |
| `app/categories/`               | —                                                              | —                   | `[slug]/CategoryPageContent.tsx`                                                                       |
| `features/cms-page/api/`        | —                                                              | —                   | `cms-pages.api.ts`                                                                                     |
| `features/cms-page/components/` | —                                                              | —                   | `CategoryTemplate.tsx`, `ProductCarousel.tsx`, `FeaturedProducts.tsx`                                  |
| `features/category/api/`        | —                                                              | —                   | `list.bff.ts`                                                                                          |
| `features/recipe/api/`          | —                                                              | —                   | `recipes.api.ts`                                                                                       |
| `tests/`                        | —                                                              | —                   | `recipes-search-route.spec.ts`                                                                         |

**净减少：8 个文件，约 500-600 行代码。**

---

## 五、数据流终态

```
                       ┌─────────────────────────────┐
                       │     app/api/products/route   │
                       │     app/api/categories/      │
                       │     app/api/global-search    │
                       │     (薄控制器，≤25行)         │
                       └──────────┬──────────────────┘
                                  │
                                  ▼
                       ┌─────────────────────────────┐
                       │   ProductQueryFacade         │
                       │   queryProducts(params)      │
                       │   queryBySkus(skus)          │
                       │   (features/product/api/)    │
                       └──────────┬──────────────────┘
                                  │
                                  ▼
                       ┌─────────────────────────────┐
                       │   meilisearch.repo.ts        │
                       │   searchProductsFromMeilisearch() │
                       │   searchProductBySkuFromMeilisearch() │
                       │   (直接操作 Meilisearch HTTP) │
                       └──────────┬──────────────────┘
                                  │
                                  ▼
                       ┌─────────────────────────────┐
                       │   Meilisearch                 │
                       │   joydeem_product_en 索引     │
                       └─────────────────────────────┘
```

**唯一数据流：Route Handler → ProductQueryFacade → Meilisearch**

---

## 六、不在本次范围内的模块

- `auth/*` — 冻结
- `v1/account/*` — 冻结
- `v1/cart/*` — 冻结
- `v1/checkout/*` — 冻结
- `reviews/*` — 已较规范，不动
- `product-qa/*` — 已较规范，不动
- `admin/*` — 开发工具，不动
- `revalidate/*` — 独立功能，不动
- `meilisearch.repo.ts` 内部拆分 — 653 行，本次不改内部结构

---

## 七、实施步骤（分阶段）

### Phase 1：发布新 API surface（先建后拆）

1. **新增** `features/product/api/product-params.ts` — URL 参数解析 + 校验
2. **修改** `infrastructure/api/route-helpers.ts` — `handleApiError` 统一为 `{success, data, error}` 格式
3. **增强** `features/product/index.ts` — 确保 `productQueryFacade.queryBySkus()` 已导出
4. **重写** `app/api/products/route.ts` — 统一产品查询入口（含 SKU 单/批量）
5. **修改** `app/api/global-search/route.ts` — 产品部分改为调 `productQueryFacade`
6. **合并** `app/api/recipes/search/route.ts` — 合并关键词+分面搜索
7. **反迁移消费者** — 见 Phase 1 消费者列表

**Phase 1 消费者迁移（先切换到新 API，再删旧文件）：**

| #   | 文件                                                | 改动                                                                                        |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 7a  | `app/shop/page.tsx`                                 | `searchProducts` → `productQueryFacade.queryProducts()` from `@/features/product`           |
| 7b  | `app/shop/[slug]/page.tsx`                          | 同上                                                                                        |
| 7c  | `app/search/page.tsx`                               | `fetchProductSearchResult` → `productQueryFacade.queryProducts()` from `@/features/product` |
| 7d  | `app/categories/[slug]/CategoryPageContent.tsx`     | `searchProducts` → `productQueryFacade.queryProducts()` from `@/features/product`           |
| 7e  | `features/cms-page/components/CategoryTemplate.tsx` | 同上                                                                                        |
| 7f  | `features/category/api/list.bff.ts`                 | `getProductListBFF` → `productQueryFacade.queryProducts()`                                  |
| 7g  | `features/cms-page/api/cms-pages.api.ts`            | `searchProductsBySkusForBFF` → `productQueryFacade.queryBySkus()`                           |
| 7h  | `features/cms-page/components/ProductCarousel.tsx`  | 同上                                                                                        |
| 7i  | `features/cms-page/components/FeaturedProducts.tsx` | 同上                                                                                        |
| 7j  | `features/recipe/api/recipes.api.ts`                | `/api/search/recipes` → `/api/recipes/search`                                               |
| 7k  | `LazyDealProductBlock.tsx`                          | `/api/deal-products` → `/api/products?strapiCategorySlug=`                                  |
| 7l  | `CategoryGrid.tsx`                                  | `/api/deal-products` → `/api/products?magentoCategoryId=`                                   |
| 7m  | `app/api/categories/[slug]/route.ts`                | 对齐 `{success, data, error}` 格式 + `handleApiError`                                       |

**验证点：** `pnpm typecheck && pnpm lint` 零错误

### Phase 2：删除冗余文件

8. **删除** `app/api/deal-products/route.ts`
9. **删除** `app/api/search/recipes/route.ts`
10. **删除** `features/product/api/meilisearch.bff.ts`
11. **删除** `features/product/api/list.bff.ts`
12. **删除** `features/search/api/shop-search.ts`
13. **删除** `features/search/api/search-meilisearch.ts`
14. **删除** `features/search/api/search-service.ts`

### Phase 3：清理索引文件

15. **更新** `features/product/index.ts` — 移除已删文件的 export
16. **更新** `features/search/index.ts` — 移除已删文件的 export
17. **更新** `tests/recipes-search-route.spec.ts` — 适配新路由路径

### Phase 4：最终验证

18. `pnpm typecheck` 零错误
19. `pnpm lint` 零错误
20. `pnpm nx test jd-frontend -- --run` 全部通过

---

## 八、验证标准

- `pnpm typecheck` 零错误
- `pnpm lint` 零错误
- `pnpm nx test jd-frontend -- --run` 全部通过
- 所有产品查询链路统一走 `productQueryFacade.queryProducts()`
- 所有 route handler 使用统一的 `{success, data, error}` + `handleApiError`
- 无死代码残留（无未使用的 export、无零引用文件）
- 前端页面：`/shop`、`/shop/[slug]`、`/search`、`/categories/[slug]`、CMS pages 功能正常
