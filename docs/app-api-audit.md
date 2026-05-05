# app/api/ 路由审计报告

> 生成日期：2026-05-05 | 范围：`apps/jd-frontend/app/api/` 全量 57 个 route 文件

## 一、概览

| 分类              | 数量 | 说明                                            |
| ----------------- | ---- | ----------------------------------------------- |
| BFF（聚合/转换）  | 48   | 调用 feature service 层，做数据聚合、转换、校验 |
| API Proxy（透传） | 4    | 直接转发请求到 Magento/Strapi，几乎不做处理     |
| 工具/Dev          | 5    | ISR 缓存刷新、管理工具、开发调试                |

---

## 二、完整路由清单

### 2.1 Auth — `api/auth/` 和 `api/v1/auth/`（14 个文件，其中 6 对重复）

| #   | 路径                       | Method | 分类          | 调用的后端                                              |
| --- | -------------------------- | ------ | ------------- | ------------------------------------------------------- |
| 1   | `api/auth/guest`           | POST   | BFF           | `@/features/auth/auth.service` → `createGuestSession()` |
| 2   | `api/auth/login`           | POST   | BFF           | `@/features/auth/auth.service` → `login()`              |
| 3   | `api/auth/logout`          | POST   | BFF           | `@/features/auth/auth.service` → `logout()`             |
| 4   | `api/auth/refresh`         | POST   | BFF           | `@/features/auth/auth.service` → `refreshSession()`     |
| 5   | `api/auth/register`        | POST   | BFF           | `@/features/auth/auth.service` → `register()`           |
| 6   | `api/auth/session`         | GET    | BFF           | `@/features/auth/get-session` → `getSessionResponse()`  |
| 7   | `api/auth/forgot-password` | POST   | **API Proxy** | `magentoClient.put('customers/password', ...)`          |
| 8   | `api/auth/reset-password`  | POST   | **API Proxy** | `magentoClient.post('customers/resetPassword', ...)`    |
| 9   | `api/v1/auth/guest`        | POST   | BFF           | 与 #1 **逐字节相同**                                    |
| 10  | `api/v1/auth/login`        | POST   | BFF           | 与 #2 **逐字节相同**                                    |
| 11  | `api/v1/auth/logout`       | POST   | BFF           | 与 #3 **逐字节相同**                                    |
| 12  | `api/v1/auth/refresh`      | POST   | BFF           | 与 #4 **逐字节相同**                                    |
| 13  | `api/v1/auth/register`     | POST   | BFF           | 与 #5 **逐字节相同**                                    |
| 14  | `api/v1/auth/session`      | GET    | BFF           | 与 #6 **逐字节相同**                                    |

### 2.2 Account — `api/v1/account/`（13 个文件）

| #   | 路径                                  | Method         | 分类 | 说明                                   |
| --- | ------------------------------------- | -------------- | ---- | -------------------------------------- |
| 15  | `api/v1/account`                      | GET/PUT/DELETE | BFF  | Profile CRUD                           |
| 16  | `api/v1/account/logout`               | POST           | BFF  | Account 级别登出，清除 session cookies |
| 17  | `api/v1/account/password`             | POST           | BFF  | 修改密码                               |
| 18  | `api/v1/account/orders`               | GET            | BFF  | 订单列表                               |
| 19  | `api/v1/account/orders/[id]`          | GET            | BFF  | 订单详情                               |
| 20  | `api/v1/account/wishlist`             | GET/POST       | BFF  | 愿望清单 CRUD                          |
| 21  | `api/v1/account/wishlist/[id]`        | DELETE         | BFF  | 删除愿望清单项                         |
| 22  | `api/v1/account/addresses`            | GET/POST       | BFF  | 地址列表/新增                          |
| 23  | `api/v1/account/addresses/[id]`       | PUT/DELETE     | BFF  | 地址修改/删除                          |
| 24  | `api/v1/account/addresses/countries`  | GET            | BFF  | 国家列表                               |
| 25  | `api/v1/account/addresses/regions`    | GET            | BFF  | 地区列表                               |
| 26  | `api/v1/account/addresses/default`    | GET            | BFF  | 默认地址                               |
| 27  | `api/v1/account/addresses/revalidate` | POST           | BFF  | 刷新国家缓存                           |

### 2.3 Cart — `api/v1/cart/`（7 个文件）

| #   | 路径                       | Method       | 分类 | 说明                                     |
| --- | -------------------------- | ------------ | ---- | ---------------------------------------- |
| 28  | `api/v1/cart`              | GET          | BFF  | 获取购物车（guest/customer 分流）        |
| 29  | `api/v1/cart/items`        | GET          | BFF  | 获取购物车商品 — **与 #28 handler 相同** |
| 30  | `api/v1/cart/items/add`    | POST         | BFF  | 加购后返回完整购物车                     |
| 31  | `api/v1/cart/items/[id]`   | PATCH/DELETE | BFF  | 改数量 / 删商品                          |
| 32  | `api/v1/cart/clear`        | DELETE       | BFF  | 清空购物车                               |
| 33  | `api/v1/cart/coupon`       | DELETE       | BFF  | 移除优惠券                               |
| 34  | `api/v1/cart/coupon/apply` | POST         | BFF  | 应用优惠券                               |

### 2.4 Checkout — `api/v1/checkout/`（2 个文件）

| #   | 路径                       | Method | 分类 | 说明                                     |
| --- | -------------------------- | ------ | ---- | ---------------------------------------- |
| 35  | `api/v1/checkout/session`  | POST   | BFF  | 签发 Magento checkout SSO redirect token |
| 36  | `api/v1/checkout/redirect` | GET    | BFF  | 验证 token，拼接 Magento redirect URL    |

### 2.5 内容类（10 个文件）

| #   | 路径                                | Method | 分类 | 说明                                                                                          |
| --- | ----------------------------------- | ------ | ---- | --------------------------------------------------------------------------------------------- |
| 37  | `api/header-menu`                   | GET    | BFF  | 导航菜单数据                                                                                  |
| 38  | `api/categories`                    | GET    | BFF  | 分类树 + mapper 转换                                                                          |
| 39  | `api/categories/[slug]`             | GET    | BFF  | 按 slug 查分类，Meilisearch 过滤商品                                                          |
| 40  | `api/categories/[slug]/breadcrumbs` | GET    | BFF  | 分类面包屑                                                                                    |
| 41  | `api/recipes/search`                | GET    | BFF  | 菜谱多维度筛选（分类/标签/难度/时间/评分）                                                    |
| 42  | `api/search/recipes`                | GET    | BFF  | 菜谱关键词搜索                                                                                |
| 43  | `api/global-search`                 | GET    | BFF  | 全局搜索聚合：商品(Meilisearch) + 文章(blog bridge) + 菜谱(Strapi)，`Promise.allSettled` 并行 |
| 44  | `api/deal-products`                 | GET    | BFF  | 按分类查 deal 商品                                                                            |
| 45  | `api/products`                      | GET    | BFF  | 按 SKU(s) 查商品（单/批量模式）                                                               |
| 46  | `api/products/[sku]/variants`       | GET    | BFF  | 商品 variant 查询                                                                             |

### 2.6 Reviews（6 个文件）

| #   | 路径                                  | Method   | 分类          | 说明                                               |
| --- | ------------------------------------- | -------- | ------------- | -------------------------------------------------- |
| 47  | `api/reviews/[sku]`                   | GET/POST | BFF           | 获取/提交评价（含校验和 enrichment）               |
| 48  | `api/reviews/[sku]/media`             | GET      | BFF           | 评价媒体（图片/视频）                              |
| 49  | `api/reviews/[sku]/dimension-summary` | GET      | BFF           | 评价维度汇总                                       |
| 50  | `api/reviews/helpful`                 | POST     | **API Proxy** | 透传 Strapi `POST api/product-reviews/:id/helpful` |
| 51  | `api/reviews/tags`                    | GET      | BFF           | 评价标签                                           |
| 52  | `api/reviews/upload`                  | POST     | **API Proxy** | 透传文件上传（裸 `fetch()` 传 FormData）           |

### 2.7 Product Q&A（2 个文件）

| #   | 路径                          | Method | 分类 | 说明                   |
| --- | ----------------------------- | ------ | ---- | ---------------------- |
| 53  | `api/product-qa/by-sku/[sku]` | GET    | BFF  | 按 SKU 查问答          |
| 54  | `api/product-qa/questions`    | POST   | BFF  | 提交商品问题（含校验） |

### 2.8 工具类（5 个文件）

| #   | 路径                               | Method     | 分类    | 说明                          |
| --- | ---------------------------------- | ---------- | ------- | ----------------------------- |
| 55  | `api/revalidate`                   | POST       | Utility | 通用 ISR 缓存刷新（path/tag） |
| 56  | `api/revalidate/nav`               | POST       | Utility | 刷新 header menu 缓存         |
| 57  | `api/admin/sync/magento-to-strapi` | POST       | Utility | Magento → Strapi 数据同步工具 |
| 58  | `api/admin/catalog-inspect`        | GET        | Utility | Magento catalog 字段分析工具  |
| 59  | `api/dev/request-log`              | GET/DELETE | Utility | 开发环境请求日志查看器        |

---

## 三、发现的问题

### 3.1 🔴 Critical / High

#### 6 个 auth 路由完全重复

`/api/auth/` 和 `/api/v1/auth/` 下的 6 个端点（guest / login / logout / refresh / register / session）**文件内容逐字节相同**——导入相同、handler 代码相同、行为相同。

```text
api/auth/login/route.ts   ≡  api/v1/auth/login/route.ts
api/auth/guest/route.ts   ≡  api/v1/auth/guest/route.ts
api/auth/logout/route.ts  ≡  api/v1/auth/logout/route.ts
api/auth/refresh/route.ts ≡  api/v1/auth/refresh/route.ts
api/auth/register/route.ts ≡  api/v1/auth/register/route.ts
api/auth/session/route.ts ≡  api/v1/auth/session/route.ts
```

这不是版本管理，是复制粘贴。应该保留一组，另一组 301 redirect。

#### 版本策略不一致

| 资源       | v0（无版本号） |     v1     |
| ---------- | :------------: | :--------: |
| auth       |       ✅       | ✅（重复） |
| products   |       ✅       |     ❌     |
| reviews    |       ✅       |     ❌     |
| categories |       ✅       |     ❌     |
| recipes    |       ✅       |     ❌     |
| cart       |       ❌       |     ✅     |
| checkout   |       ❌       |     ✅     |
| account    |       ❌       |     ✅     |

无文档说明：

- v1 相比 v0 有什么不同？
- 哪个是推荐的？哪个会废弃？
- 新资源应该放 v0 还是 v1？

#### `api/v1/cart` 和 `api/v1/cart/items` handler 功能重复

两个 GET 的 handler body 完全相同——都调用 `getGuestCart` / `getCustomerCart`，返回完整购物车。其中一个冗余。

#### `forgot-password` / `reset-password` 绕过 auth service

其他 auth 路由都走 `@/features/auth/auth.service` 这一层，这两个直接调 `magentoClient.put/post`，内联了自己的错误处理。不一致。

### 3.2 🟡 Medium

#### 两个菜谱搜索路由功能相近

|          | `api/recipes/search`                      | `api/search/recipes` |
| -------- | ----------------------------------------- | -------------------- |
| 搜索方式 | 多维筛选（分类/标签/难度/时间/评分）      | 关键词搜索           |
| 数据源   | `@/features/recipe/recipes.api`           | 相同                 |
| 参数处理 | `@/features/recipe/recipes-search-params` | 相同                 |

可以考虑合并为一个路由，用 query param 区分模式。

#### `categories/[slug]` vs `deal-products` 功能相近

都按分类查询商品，都用 `@/features/product/query-facade`。`deal-products` 少了排序/筛选，可以认为是 `categories/[slug]` 的简化版。

#### `reviews/upload` 用裸 `fetch()` 而非 `strapiClient`

因为是 multipart FormData 上传，`strapiClient` 抽象层不支持，是合理例外。

---

## 四、Import 依赖分析

所有 route 文件的 import 来源分布：

| Import 前缀   | 使用文件数 | 用途                               |
| ------------- | :--------: | ---------------------------------- |
| `@/features/` |    ~53     | Feature service/BFF/handler 调用   |
| `@/core/`     |    ~12     | API client、错误处理、配置、tracer |
| `@/lib/`      |     3      | 遗留 Magento 类型（待迁移）        |
| `@/shared/`   |     2      | 邮件校验等工具函数                 |

**使用 `@/lib/` 的文件**（待迁移）：

- `api/v1/cart/items/add/route.ts` — `@/lib/api/magento/types`
- `api/admin/catalog-inspect/route.ts` — `@/lib/api/magento/types`
- `api/admin/sync/magento-to-strapi/route.ts` — `@/lib/api/magento/types`

---

## 五、改进建议

### 立即（P1）

1. **删除 6 个重复 auth 路由**：保留 `api/auth/*`，删除 `api/v1/auth/*`（或反之），客户端统一迁移
2. **合并或删除** `api/v1/cart` 和 `api/v1/cart/items` 中的一个
3. **标准化版本策略**：全量路由统一到一个版本，写入文档

### 短期（P2）

4. `forgot-password` / `reset-password` 改为走 `auth.service` 统一错误处理
5. 迁移剩余 3 个 `@/lib/` import 到 `@/features/` 或 `@/core/`
6. 评估 `recipes/search` 和 `search/recipes` 是否合并

### 长期（P3）

7. 为每个 API 路由分类添加 JSDoc 注释说明用途
8. 考虑统一的 route handler wrapper 模式，减少样板代码
