# BFF、客户端请求与缓存策略说明

本文记录 Prism 侧 **BFF 边界**、**Next.js 缓存 / revalidate / tag** 约定，以及 **Strapi（helpcenter）按需失效** 的对齐关系，便于后续迭代不跑偏。

---

## 架构原则（摘要）

| 边界                                     | 规则                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 浏览器发起的 JSON 数据请求               | 优先同源 [`apps/prism/app/api`](../../apps/prism/app/api)（BFF），避免在浏览器直连 Strapi 域名（密钥与契约收口在服务端）                                                  |
| RSC / Server Components / Route Handlers | 可直接请求 Strapi / Magento；**密钥仅服务端**（见 [`server-adapter.ts`](../../apps/prism/lib/api/adapters/server-adapter.ts)）                                            |
| 缓存分档                                 | **交易 / 价库**：新鲜度优先；**评论 / QA**：分钟级；**CMS 关联内容**：小时级兜底 + On-Demand；秒级与 tag 见 [`cache-policy.ts`](../../apps/prism/lib/api/cache-policy.ts) |

可选：`NEXT_PUBLIC_USE_API_PROXY` 时 [`next.config.js`](../../apps/prism/next.config.js) 将 `/api-proxy`、`/magento-proxy` 转发到外部 API，属于**透明代理**，与业务 BFF 不等价。

---

## 已落地内容（两阶段）

### 阶段一：缓存策略单点收口

- 新增 [`lib/api/cache-policy.ts`](../../apps/prism/lib/api/cache-policy.ts)：集中 **revalidate 秒数** 与 **Next `tags`**，并提供 `cacheTagCmsPage(slug)` 等辅助。
- 将散落在 `lib/api/strapi/*`、`lib/api/recipes.ts`（部分）、`lib/api/cms-pages.ts`、`lib/api/carousel.ts`、若干 [`app/api/*`](../../apps/prism/app/api) Route、`app/**/page.tsx` ISR、`magento-graphql.client.ts` 等处的魔法数字改为引用该模块。
- **未改变**业务调用拓扑：仍是「浏览器走已有 BFF + 服务端直连后端」；本阶段主要是 **可维护性与约定统一**。

### 阶段二：食谱列表搜索 BFF（浏览器同源）

- 新增 Route Handlers：[`app/api/recipes/search/route.ts`](../../apps/prism/app/api/recipes/search/route.ts)（分面搜索）、[`app/api/search/recipes/route.ts`](../../apps/prism/app/api/search/recipes/route.ts)（关键字搜索，`q` 必填否则 400）。
- 新增 [`lib/api/recipes-search-params.ts`](../../apps/prism/lib/api/recipes-search-params.ts)：与 `buildQueryString` 约定一致的 **URLSearchParams 解析**。
- [`lib/api/recipes.ts`](../../apps/prism/lib/api/recipes.ts)：`searchRecipes` / `searchRecipesByKeyword` 在**浏览器**走 `fetch('/api/...')`；**服务端**仍通过 `fetchRecipeFacetedSearchStrapi` / `fetchRecipeKeywordSearchStrapi` + `apiClient` 直连 Strapi（含 token）。SSR 首屏（如 `app/recipes/page.tsx`）行为保持为服务端直连，不强制多一跳 HTTP。

### 与改造前的区别（大白话）

| 维度                                     | 改造前                                       | 改造后                                                      |
| ---------------------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| 缓存时间 / tag                           | 各文件手写 `300`、`3600`、tag 字符串         | 尽量从 **`cache-policy.ts`** 引用                           |
| 食谱列表在浏览器里筛选 / 翻页 / 搜关键字 | 可能因 `NEXT_PUBLIC_API_URL` **直连 Strapi** | **统一走本站** `/api/recipes/search`、`/api/search/recipes` |
| PDP、购物车、评论等                      | 原本已有 `/api/*`                            | 逻辑未重做；可能随缓存收口 touched 相关文件                 |

---

## 客户端数据请求巡检（`use client`）

**结论：核心业务 JSON 请求以同源 `/api/*` 为主；购物车走 `lib/api/magento/cart` 封装的 BFF 路径。**

| 区域                             | 方式                                                   | 备注                                                       |
| -------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| PDP 评论 / 上传 / helpful        | `fetch('/api/reviews/...')` 等                         | BFF                                                        |
| PDP QA                           | `fetch('/api/product-qa/...')`                         | BFF                                                        |
| Shop Discovery                   | `fetch('/api/discovery/...')`                          | BFF                                                        |
| Auth                             | `fetch('/api/auth/...')`                               | BFF                                                        |
| 购物车                           | `cart.ts` → `/api/cart/*`                              | BFF                                                        |
| 食谱列表（筛选 / 翻页 / 关键字） | 见阶段二：`/api/recipes/search`、`/api/search/recipes` | 服务端 SSR / BFF Route 内仍用 `apiClient` + server adapter |

**后续可选收敛（非阻塞）：**

- `getFilterTypes` / `getFilters` 若将来在**客户端**调用，再增加对应 BFF（当前主要在服务端 `app/recipes/page.tsx` 使用）。
- `getRecipeBySlug` 等若未来在纯客户端大量调用，再评估是否单独 BFF（当前以服务端为主）。

---

## Strapi → Prism 按需 revalidate 对齐

| 来源                                          | 机制                                                   | 与 Prism                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| helpcenter `revalidateProductEnrichmentPages` | `triggerRevalidate({ tags: ['product-enrichments'] })` | 与 [`CACHE_TAG_PRODUCT_ENRICHMENTS`](../../apps/prism/lib/api/cache-policy.ts) 一致                          |
| helpcenter 食谱 / 文章                        | `triggerRevalidate({ paths: [...] })`                  | 按路径失效；与 `REVALIDATE_SECONDS_CMS_ASSOCIATION` 等兜底 ISR 配合                                          |
| Prism 内评论 / QA / Discovery 等              | `next.tags` 见 `cache-policy.ts`                       | 若需在 Strapi 侧「按 tag 失效」UGC，需在 helpcenter 增加对应 `triggerRevalidate({ tags })`（当前未统一覆盖） |

环境变量：Strapi 使用 `NEXT_REVALIDATE_URL` + `REVALIDATE_SECRET`，与 Prism [`app/api/revalidate/route.ts`](../../apps/prism/app/api/revalidate/route.ts) 一致。

---

## 后续迭代建议（未承诺排期）

1. **内容与 UGC 秒级一致**：跨仓核对 helpcenter 发布钩子与 Prism **`cache-policy` tag** 是否一致，按需补 `triggerRevalidate`。
2. **食谱筛选在客户端动态拉取**：为 `recipe-filters` 增加 BFF 并改调用方。
3. **工程项**：全站 BFF 错误体 / 业务码统一（专项，避免与业务需求强耦合）。

---

## 相关测试

- 缓存与 Route：`apps/prism/tests/` 下已有 product-qa、recipes-search 等 spec；改 `cache-policy` 或食谱 BFF 后建议执行 `pnpm nx run prism:typecheck` 与 `pnpm nx test prism -- --run`。
