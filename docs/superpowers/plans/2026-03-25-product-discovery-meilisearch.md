# 商品发现体系：Meilisearch 索引落地方案 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构商品发现体系（分类页与搜索），由原本映射 Magento Category 的方案迁移至直接请求由 Strapi 驱动的 Meilisearch 商品索引。

**Architecture:**
1. Strapi 端（阶段1）：扩展 `product-enrichment`，集成 Meilisearch 索引与全量同步脚本。
2. BFF 端（阶段2）：封装 Meilisearch 客户端 `meilisearch.ts`，重写 `service.ts` 的 `fetchDiscoveryResult`（内部降级保留旧版），暴露出无缝的同一套 `ProductDiscoveryResult`。
3. 页面端（阶段3）：迁移 `/shop/[slug]` 路由并实现 `/search` 页面与相关的筛选项组件。
4. webhook 增量更新（阶段4，不在本一期计划内）。

**Tech Stack:** Next.js App Router, Strapi, Meilisearch, TypeScript

---

## Phase 1: Strapi 数据结构与全量同步脚本

（注：此阶段的任务需要在 Strapi 后端项目 `D:\WORK\helpcenter\backend` 执行。为确保范围清晰，我们将只提供需要的接口和操作逻辑指导。）

### Task 1: Strapi 扩展 `product-enrichment` 并提供 Meilisearch 工具

**Files:**
- Create/Modify: `src/api/product-enrichment/content-types/product-enrichment/schema.json` (或通过 Strapi UI)
- Create: `src/utils/meilisearch-product-indexer.js`

- [ ] **Step 1: 新增 discovery_categories 关系**
在 `product-enrichment` 的 schema 中增加多对多关系 `discovery_categories`，关联到 `discovery-category`。

- [ ] **Step 2: 编写全量同步脚本**
编写可以从 SSO 全量拉取商品，聚合 Strapi 的 enrichment 数据，并写入 Meilisearch `products` 索引的 Node.js 脚本或 Strapi Cron Job。
配置 Meilisearch 索引 Settings:
`searchableAttributes`: `['name', 'subtitle', 'brand', 'short_description']`
`filterableAttributes`: `['discovery_category_slugs', 'brand', 'in_stock', 'is_active', 'price']`
`sortableAttributes`: `['price', 'created_at']`

- [ ] **Step 3: 运行并验证**
确认可以成功将数据导入本地 Meilisearch 的 `products` 索引。

*(此阶段可以由人工完成或使用独立子代理执行)*

---

## Phase 2: Next.js API 层改造

（从这部分开始是在 `apps/prism` 下执行代码修改）

### Task 2: 配置 Meilisearch 环境变量与更新基础类型

**Files:**
- Modify: `apps/prism/lib/env.ts`
- Modify: `apps/prism/lib/api/discovery/types.ts`

- [ ] **Step 1: 增加 Meilisearch 环境变量**
修改 `apps/prism/lib/env.ts` 增加验证逻辑：
```typescript
NEXT_PUBLIC_MEILISEARCH_HOST: z.string().url().optional(),
MEILISEARCH_API_KEY: z.string().optional(),
```

- [ ] **Step 2: 更新查询契约以支持搜索页**
修改 `apps/prism/lib/api/discovery/types.ts`，使契约能够同时服务于分类页和搜索页：
```typescript
export interface ProductDiscoveryQuery {
  slug?: string;  // 分类页传入，搜索页不传
  q?: string;     // 搜索页传入关键词
  brand?: string;
  price_min?: number;
  price_max?: number;
  sort?: DiscoverySortOption;
  page?: number;
  pageSize?: number;
}

export interface ProductDiscoveryResult {
  category?: DiscoveryCategory; // 搜索页为 undefined
  // ... 其他字段保持不变
}
```

- [ ] **Step 3: Commit**
```bash
git add apps/prism/lib/env.ts apps/prism/lib/api/discovery/types.ts
git commit -m "chore: add Meilisearch env vars and update discovery types for search"
```

### Task 3: 实现 Meilisearch 客户端封装

**Files:**
- Create: `apps/prism/lib/api/discovery/meilisearch.ts`
- Create: `apps/prism/lib/api/discovery/meilisearch.test.ts` (可选，若支持单元测试)

- [ ] **Step 1: 编写 Meilisearch 客户端**
使用原生 `fetch` 结合 `env` 构建 Meilisearch REST API 请求封装。
实现 `searchProducts` 方法，入参支持 `q`, `slug`, `brand`, `priceMin`, `priceMax`, `sort`, `page`, `pageSize`。
支持在查询时带上 `facets=["brand", "price"]` 等配置。

- [ ] **Step 2: 构建统一结果映射**
将 Meilisearch 的结果映射成现有类型 `ProductCardItem` 列表与分页信息。

- [ ] **Step 3: Commit**
```bash
git add apps/prism/lib/api/discovery/meilisearch.ts
git commit -m "feat(api): implement meilisearch client for products"
```

### Task 4: 重构 `service.ts` 接入 Meilisearch

**Files:**
- Modify: `apps/prism/lib/api/discovery/service.ts`

- [ ] **Step 1: 重写 `fetchDiscoveryResult` 方法**
内部逻辑改为：
1. 优先调用 `meilisearch.ts` 进行检索。如果 `query.slug` 存在，则在 filter 中加入 `discovery_category_slugs = [slug]`。
2. 捕获 Meilisearch 异常或发现开关未开启时，临时回退到（保留）原有基于 `magentoCategoryIds` 的拉取逻辑。
3. 标注 `TODO: remove after Meilisearch products index is live` 在旧逻辑处。

- [ ] **Step 2: 填充 `facets`**
利用 Meilisearch 返回的 `facetDistribution` 来填充 `available_filters` 中的 `count` 信息。第一阶段若未支持则保留为空列表（或现有实现）。

- [ ] **Step 3: 测试并 Commit**
```bash
git add apps/prism/lib/api/discovery/service.ts
git commit -m "feat(api): integrate meilisearch in discovery service"
```

---

## Phase 3: 前端 UI 接入

### Task 5: 迁移分类页路由并新建搜索页

**Files:**
- Delete: `apps/prism/app/shop/[categoryId]/page.tsx`
- Create: `apps/prism/app/shop/[slug]/page.tsx`
- Create: `apps/prism/app/search/page.tsx`
- Modify: `apps/prism/app/shop/page.tsx`

- [ ] **Step 1: 迁移 `shop/[slug]/page.tsx`**
将原 `categoryId` 参数替换为 `slug`。
调用重构后的 `fetchDiscoveryResult` 时传入 `slug`。处理 SSR 渲染。

- [ ] **Step 2: 创建 `search/page.tsx`**
实现基于 `q` (query param) 的搜索结果页面。复用 `fetchDiscoveryResult`（仅传 `q` 等搜索和筛选参数，不传 `slug`）。

- [ ] **Step 3: 调整 `shop/page.tsx`**
更新父级 Shop 路由中的默认入口。

- [ ] **Step 4: Commit**
```bash
git add apps/prism/app/shop/ apps/prism/app/search/
git commit -m "feat(ui): migrate shop routing and add search page"
```

### Task 6: 提供 Route Handler 供客户端按需加载

**Files:**
- Create: `apps/prism/app/api/discovery/[slug]/route.ts`
- Create: `apps/prism/app/api/search/route.ts`

- [ ] **Step 1: 实现分类页的 Load More API**
接收 GET 请求，解析 search parameters (`page`, `brand`, etc.)，调用 `fetchDiscoveryResult` 并返回 JSON。

- [ ] **Step 2: 实现搜索页的 Load More API**
同理，无 `slug`，按 `q` 进行。

- [ ] **Step 3: Commit**
```bash
git add apps/prism/app/api/
git commit -m "feat(api): add discovery route handlers for client side loading"
```

### Task 7: 实现 FilterPanel 与 SortPanel 组件

**Files:**
- Create: `apps/prism/app/shop/components/FilterPanel.tsx`
- Create: `apps/prism/app/shop/components/SortPanel.tsx`
- Modify: `apps/prism/app/shop/[slug]/page.tsx`

- [ ] **Step 1: 实现 FilterPanel**
接收 `available_filters` 与 `applied_filters` 作为 props。
支持 brand 多选（checkbox）、price 区间（range）。
URL 状态同步：`?brand=A,B&price_min=100&price_max=500`。
使用 `useRouter` + `useSearchParams` 管理状态。

- [ ] **Step 2: 实现 SortPanel**
接收 `sort_options` 与当前 `sort` 值。
URL 状态同步：`?sort=price_asc`。

- [ ] **Step 3: 集成到分类页**
在 `shop/[slug]/page.tsx` 中引入 FilterPanel 与 SortPanel。
移动端：抽屉展示；PC 端：内联展示。

- [ ] **Step 4: Commit**
```bash
git add apps/prism/app/shop/components/
git commit -m "feat(ui): add FilterPanel and SortPanel components"
```

### Task 8: 实现 Load More 分页交互

**Files:**
- Create: `apps/prism/app/shop/components/ProductGrid.tsx`
- Modify: `apps/prism/app/shop/[slug]/page.tsx`

- [ ] **Step 1: 实现 ProductGrid 组件**
接收初始 `items` 与 `pagination` 信息。
"Load more" 按钮触发客户端请求 `/api/discovery/[slug]?page=N`。
追加结果到现有列表（不替换）。

- [ ] **Step 2: 集成到分类页**
首屏 SSR 渲染初始商品，后续 Load more 走 Route Handler。

- [ ] **Step 3: Commit**
```bash
git add apps/prism/app/shop/components/ProductGrid.tsx
git commit -m "feat(ui): add load more pagination to product grid"
```

---

## Phase 4: 清理技术债（Meilisearch 索引跑通后执行）

### Task 9: 删除 Magento fallback 与 mapping 相关代码

**前提条件（必须全部满足才能执行此任务）：**
- Meilisearch `products` 索引在生产环境正常运行
- 分类页能正常加载商品，筛选功能可用
- SSO webhook 增量同步已上线

**Files:**
- Modify: `apps/prism/lib/api/discovery/service.ts`
- Modify: `apps/prism/lib/api/strapi/discovery.ts`

- [ ] **Step 1: 删除 service.ts 中的 Magento fallback 链路**
移除 `resolveDiscoveryQuery`、`mapSortToMagento`、`fetchUnifiedProducts` 相关调用。
移除 `TODO: remove after Meilisearch products index is live` 注释。

- [ ] **Step 2: 删除 strapi/discovery.ts 中的 mapping 相关函数**
移除 `fetchDiscoveryCategoryMapping`。

- [ ] **Step 3: Commit**
```bash
git add apps/prism/lib/api/discovery/ apps/prism/lib/api/strapi/discovery.ts
git commit -m "chore: remove magento fallback and discovery-category-mapping code"
```
