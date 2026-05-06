# app/api/ 路由审计报告（更新）

> 更新日期：2026-05-06 | 范围：`apps/jd-frontend/app/api/` 全量 57 个 route 文件

---

## 一、概览

| 分类              | 数量 | 说明                                            |
| ----------------- | :--: | ----------------------------------------------- |
| BFF（聚合/转换）  |  48  | 调用 feature service 层，做数据聚合、转换、校验 |
| API Proxy（透传） |  4   | 直接转发请求到 Magento/Strapi，绕过 service 层  |
| 工具/Dev          |  5   | ISR 缓存刷新、管理工具、开发调试                |

---

## 二、完整路由清单

### 2.1 Auth — `api/auth/` 和 `api/v1/auth/`（14 文件，6 对重复）

| #    | 路径                                                        | Method   | 分类                              |        重复         |
| ---- | ----------------------------------------------------------- | -------- | --------------------------------- | :-----------------: |
| 1    | `api/auth/guest`                                            | POST     | BFF                               |                     |
| 2    | `api/auth/login`                                            | POST     | BFF                               |                     |
| 3    | `api/auth/logout`                                           | POST     | BFF                               |                     |
| 4    | `api/auth/refresh`                                          | POST     | BFF                               |                     |
| 5    | `api/auth/register`                                         | POST     | BFF                               |                     |
| 6    | `api/auth/session`                                          | GET      | BFF                               |                     |
| 7    | `api/auth/forgot-password`                                  | POST     | **API Proxy** — 绕过 auth service |
| 8    | `api/auth/reset-password`                                   | POST     | **API Proxy** — 绕过 auth service |
| 9-14 | `api/v1/auth/{guest,login,logout,refresh,register,session}` | POST/GET | BFF                               | ✅ 与 #1-6 字节相同 |

### 2.2 Account — `api/v1/account/`（13 文件）

| #   | 路径                                  | Method         | 分类               |
| --- | ------------------------------------- | -------------- | ------------------ |
| 15  | `api/v1/account`                      | GET/PUT/DELETE | BFF — Profile CRUD |
| 16  | `api/v1/account/logout`               | POST           | BFF                |
| 17  | `api/v1/account/password`             | POST           | BFF                |
| 18  | `api/v1/account/orders`               | GET            | BFF                |
| 19  | `api/v1/account/orders/[id]`          | GET            | BFF                |
| 20  | `api/v1/account/wishlist`             | GET/POST       | BFF                |
| 21  | `api/v1/account/wishlist/[id]`        | DELETE         | BFF                |
| 22  | `api/v1/account/addresses`            | GET/POST       | BFF                |
| 23  | `api/v1/account/addresses/[id]`       | PUT/DELETE     | BFF                |
| 24  | `api/v1/account/addresses/countries`  | GET            | BFF                |
| 25  | `api/v1/account/addresses/regions`    | GET            | BFF                |
| 26  | `api/v1/account/addresses/default`    | GET            | BFF                |
| 27  | `api/v1/account/addresses/revalidate` | POST           | BFF                |

### 2.3 Cart — `api/v1/cart/`（7 文件）

| #   | 路径                       | Method       | 分类 | 问题                              |
| --- | -------------------------- | ------------ | ---- | --------------------------------- |
| 28  | `api/v1/cart`              | GET          | BFF  | 🔴 GET handler 与 #29 相同        |
| 29  | `api/v1/cart/items`        | GET          | BFF  | 🔴 GET handler 与 #28 相同        |
| 30  | `api/v1/cart/items/add`    | POST         | BFF  | ⚠️ 引用 `@/lib/api/magento/types` |
| 31  | `api/v1/cart/items/[id]`   | PATCH/DELETE | BFF  |                                   |
| 32  | `api/v1/cart/clear`        | DELETE       | BFF  |                                   |
| 33  | `api/v1/cart/coupon`       | DELETE       | BFF  |                                   |
| 34  | `api/v1/cart/coupon/apply` | POST         | BFF  |                                   |

### 2.4 Checkout — `api/v1/checkout/`（2 文件）

| #   | 路径                       | Method | 分类 |
| --- | -------------------------- | ------ | ---- |
| 35  | `api/v1/checkout/session`  | POST   | BFF  |
| 36  | `api/v1/checkout/redirect` | GET    | BFF  |

### 2.5 内容类（10 文件）

| #   | 路径                                | Method | 分类                             |
| --- | ----------------------------------- | ------ | -------------------------------- |
| 37  | `api/header-menu`                   | GET    | BFF                              |
| 38  | `api/categories`                    | GET    | BFF                              |
| 39  | `api/categories/[slug]`             | GET    | BFF                              |
| 40  | `api/categories/[slug]/breadcrumbs` | GET    | BFF                              |
| 41  | `api/recipes/search`                | GET    | BFF — 多维筛选（分类/标签/难度） |
| 42  | `api/search/recipes`                | GET    | BFF — 关键词搜索（同数据源）     |
| 43  | `api/global-search`                 | GET    | BFF — `Promise.allSettled` 聚合  |
| 44  | `api/deal-products`                 | GET    | BFF — 按分类查 deal 商品         |
| 45  | `api/products`                      | GET    | BFF — 按 SKU(s) 查商品           |
| 46  | `api/products/[sku]/variants`       | GET    | BFF                              |

### 2.6 Reviews（6 文件）

| #   | 路径                                  | Method   | 分类                                  |
| --- | ------------------------------------- | -------- | ------------------------------------- |
| 47  | `api/reviews/[sku]`                   | GET/POST | BFF                                   |
| 48  | `api/reviews/[sku]/media`             | GET      | BFF                                   |
| 49  | `api/reviews/[sku]/dimension-summary` | GET      | BFF                                   |
| 50  | `api/reviews/helpful`                 | POST     | **API Proxy** — 透传 Strapi           |
| 51  | `api/reviews/tags`                    | GET      | BFF                                   |
| 52  | `api/reviews/upload`                  | POST     | **API Proxy** — 裸 `fetch()` FormData |

### 2.7 Product Q&A（2 文件）

| #   | 路径                          | Method | 分类 |
| --- | ----------------------------- | ------ | ---- |
| 53  | `api/product-qa/by-sku/[sku]` | GET    | BFF  |
| 54  | `api/product-qa/questions`    | POST   | BFF  |

### 2.8 工具类（5 文件）

| #   | 路径                               | Method     | 分类                       |
| --- | ---------------------------------- | ---------- | -------------------------- |
| 55  | `api/revalidate`                   | POST       | Utility                    |
| 56  | `api/revalidate/nav`               | POST       | Utility                    |
| 57  | `api/admin/sync/magento-to-strapi` | POST       | Utility — ⚠️ 引用 `@/lib/` |
| 58  | `api/admin/catalog-inspect`        | GET        | Utility — ⚠️ 引用 `@/lib/` |
| 59  | `api/dev/request-log`              | GET/DELETE | Utility                    |

---

## 三、发现的问题（按严重程度）

### 3.1 🔴 Critical / High

#### 6 个 auth 路由完全重复

`/api/auth/` 和 `/api/v1/auth/` 下 login、guest、logout、refresh、register、session 的 route 文件 **字节级完全一致**（diff exit 0）。

```text
api/auth/login/route.ts    ≡  api/v1/auth/login/route.ts
api/auth/guest/route.ts    ≡  api/v1/auth/guest/route.ts
api/auth/logout/route.ts   ≡  api/v1/auth/logout/route.ts
api/auth/refresh/route.ts  ≡  api/v1/auth/refresh/route.ts
api/auth/register/route.ts ≡  api/v1/auth/register/route.ts
api/auth/session/route.ts  ≡  api/v1/auth/session/route.ts
```

**建议**：删除 `/api/v1/auth/*`，原路径改为 301 redirect 到 `/api/auth/*`。

#### `api/v1/cart` GET ≡ `api/v1/cart/items` GET

两个路由的 GET handler body 逐字节相同（diff exit 0），都返回完整购物车。

**建议**：删除 `api/v1/cart/items/route.ts` 中的 GET handler，`api/v1/cart` 作为唯一的购物车读取入口。

#### 版本策略不一致

| 资源          | v0（无版本号） | v1  | 问题     |
| ------------- | :------------: | :-: | -------- |
| auth          |       ✅       | ✅  | 6 对重复 |
| products      |       ✅       | ❌  |          |
| reviews       |       ✅       | ❌  |          |
| categories    |       ✅       | ❌  |          |
| recipes       |       ✅       | ❌  |          |
| deal-products |       ✅       | ❌  |          |
| global-search |       ✅       | ❌  |          |
| header-menu   |       ✅       | ❌  |          |
| cart          |       ❌       | ✅  |          |
| checkout      |       ❌       | ✅  |          |
| account       |       ❌       | ✅  |          |

**建议**：全量迁移到 `api/v1/*`。无版本号路由做 301 redirect。

#### `forgot-password` / `reset-password` 绕过 auth service

```typescript
// 当前实现：直接调 magentoClient
app/api/auth/forgot-password/route.ts → magentoClient.put('customers/password', ...)
app/api/auth/reset-password/route.ts  → magentoClient.post('customers/resetPassword', ...)

// 标准实现：走 service 层（其他 6 个 auth 路由的模式）
app/api/auth/login/route.ts           → auth.service.login(...)
```

两个路由独立实现错误处理，与其余 auth 路由不一致。

### 3.2 🟡 Medium

#### 两个菜谱搜索路由功能相近

|          | `api/recipes/search`                      | `api/search/recipes` |
| -------- | ----------------------------------------- | -------------------- |
| 搜索方式 | 多维筛选（分类/标签/难度/时间/评分）      | 关键词搜索           |
| 数据源   | `@/features/recipe/recipes.api`           | 相同                 |
| 参数处理 | `@/features/recipe/recipes-search-params` | 相同                 |

可合并为一个路由，用 `q` 参数存在与否区分关键词搜索和多维筛选。

#### `categories/[slug]` 与 `deal-products` 功能相近

都按分类查询商品，都走 `@/features/product/query-facade`。`deal-products` 少了排序/筛选，是 `categories/[slug]` 的简化版。可合并。

#### 3 个 API 路由仍引用 `@/lib/`

| 路由                                        | 引用                                          |
| ------------------------------------------- | --------------------------------------------- |
| `api/v1/cart/items/add/route.ts`            | `@/lib/api/magento/types` (AddCartItemParams) |
| `api/admin/catalog-inspect/route.ts`        | `@/lib/api/magento/types` (MagentoProduct)    |
| `api/admin/sync/magento-to-strapi/route.ts` | `@/lib/api/magento/types`                     |

### 3.3 ✅ 已修复

| 原编号 | 问题                                                                        | 修复方式                             |
| ------ | --------------------------------------------------------------------------- | ------------------------------------ |
| A4     | `categories/[slug]/route.ts` 脆弱相对 paths `../../../shop/lib/meilisearch` | 改为 `@/features/search/shop-search` |

---

## 四、Import 依赖分析

| Import 前缀   | 使用文件数 | 状态      |
| ------------- | :--------: | --------- |
| `@/features/` |    ~53     | ✅ 规范   |
| `@/core/`     |    ~12     | ✅ 规范   |
| `@/shared/`   |     ~2     | ✅ 规范   |
| `@/lib/`      |     3      | ⚠️ 待迁移 |

---

## 五、改进建议

### P0 — 立即

1. 删除 6 个重复的 `api/v1/auth/*` 路由，原路径 301 redirect 到 `api/auth/*`
2. 删除 `api/v1/cart/items/route.ts` 中的 GET handler（保留 `api/v1/cart`）
3. 统一版本策略：决定 v0 还是 v1 为唯一版本

### P1 — 短期

4. `forgot-password` / `reset-password` 改为走 `auth.service`
5. 迁移 3 个 `@/lib/` import 到 `@/features/` 或 `@/core/`
6. 迁移所有 v0 路由到 v1，设置 301 redirect

### P2 — 中期

7. 评估 `recipes/search` 和 `search/recipes` 合并
8. 评估 `categories/[slug]` 和 `deal-products` 合并
9. 为每个路由分类添加 JSDoc 注释说明用途
10. 考虑统一的 route handler wrapper 模式，减少样板代码
