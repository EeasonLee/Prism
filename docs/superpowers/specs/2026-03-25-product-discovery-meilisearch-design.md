# 商品发现体系：Meilisearch 索引落地方案

> **文档角色**：历史设计记录（非当前执行入口）
> **状态**：已确立
> **日期**：2026-03-25
> **目标**：以 Meilisearch 为核心，统一商品搜索与分类落地页底层检索，废弃过渡期的 Magento 分类映射方案。
>
> 当前权威入口请优先查看：`docs/product-discovery-architecture.md`、`docs/tasks-product-discovery.md`、`docs/project-plan.md`。

## 1. 架构角色重定义

本方案彻底分离“商品事实”与“前台发现配置”：

- **Magento / SSO**：商品交易事实源（价格、库存、可售状态），通过 webhook 触发增量同步。
- **Strapi**：前台发现配置与内容增强中心，也是商品索引的构建与同步执行者。
- **Meilisearch**：统一检索引擎，承担前台分类页（PLP）和搜索页的商品检索、聚合、筛选、排序。
- **Next.js (BFF)**：封装查询契约，提供统一 `/api/discovery` 接口供前台渲染使用。

## 2. 数据模型变更 (Strapi)

### 2.1 废弃 `discovery-category-mapping`

不再使用 `前台 slug -> mapping -> Magento category IDs -> 商品结果` 的链路。

**废弃时间点**：Meilisearch 索引在生产环境跑通（分类页正常加载商品、筛选可用、增量同步已上线）后立即删除相关代码，不允许长期共存。在此之前，`service.ts` 中的 Magento fallback 链路仅作为过渡期临时保留。

### 2.2 扩展 `product-enrichment`

- **新增字段**：`discovery_categories`（多对多关联到 `discovery-category`）。
- **职责**：作为前台分类归属的权威事实源。选择挂在 `product-enrichment` 而非保留 mapping 层的原因：运营可直接在商品 enrichment 记录上看到并编辑前台分类归属，认知成本低；mapping 层要求运营理解"前台分类 → Magento 分类 ID → 商品"的间接关系，维护成本高且容易出错。
- **覆盖率保障**：全量/增量同步时，对于缺失 `product-enrichment` 的 SKU，Strapi 会自动创建最小化空记录（仅含 SKU），以保证索引完整性。运营后续可补充分类关系或内容。

## 3. Meilisearch 商品索引设计

**索引名**：`products`

### 3.1 字段设计 (精简索引原则)

索引仅包含搜索、筛选、排序和卡片渲染必需字段。强交易字段（PDP 加购所需详情）仍实时调用 SSO。

**关于价格/库存时效性**：在 SSO webhook 增量同步上线前（实施阶段 4），索引中的 `price`、`special_price`、`in_stock` 为全量初始化时的快照，可能存在小时级延迟。这是已知的过渡期风险，需在阶段 4 完成后才能保证秒级同步。分类页卡片展示可接受此延迟，但 PDP 加购前必须实时校验。

```json
{
  "id": "sku-123", // 主键 (sku)
  "name": "Product Name",
  "subtitle": "Short selling point",
  "brand": "Joydeem",
  "short_description": "...",
  "promotion_label": "Limited Offer", // 来自 product-enrichment

  // 归类（用于 filter）
  "discovery_category_slugs": ["blenders", "kitchen"],

  // 展示与交易基础
  "thumbnail": "https://...",
  "href": "/products/sku-123",
  "price": 199.99,
  "special_price": null, // 来自 SSO，全量同步时写入

  // 状态与排序
  "in_stock": true,
  "is_active": true,
  "created_at": 1711368000 // 用于 newest 排序
}
```

**说明：**

- `currency` 不写入索引，由前端根据用户地区动态处理。
- `promotion_label` 来自 `product-enrichment`，随内容同步更新。
- `special_price` 来自 SSO 全量拉取，webhook 上线后随增量同步保持时效。
- `rating_summary`、`review_count`、`badges` 第一阶段不纳入索引，商品卡片暂不展示这些字段，后续评估后再补充。

### 3.2 索引配置 (Settings)

- `searchableAttributes`: `["name", "subtitle", "brand", "short_description"]`
- `filterableAttributes`: `["discovery_category_slugs", "brand", "in_stock", "is_active", "price"]`
- `sortableAttributes`: `["price", "created_at"]`

## 4. 索引同步链路 (Strapi 主导)

复用现有的 recipes/articles 同步模式：

1. **第一阶段（全量初始化）**：Strapi 暴露管理接口，手动触发全量同步（不在启动时自动执行，避免重启时对 SSO 造成压力）。全量同步为异步后台任务，支持幂等 upsert。

   **前置依赖（关键）**：SSO 需提供支持全量拉取的商品接口。若当前 SSO 仅支持按单个 `categoryId` 查询，需在阶段 1 开发前确认以下两种方案之一：

   - 方案 A：SSO 新增全量商品列表接口
   - 方案 B：Strapi 遍历所有已知 Magento 分类 ID 逐个拉取后去重聚合（临时方案，性能较差）

   **过渡期方案**：在 webhook 上线前（阶段 4 完成前），配置每日定时全量刷新，防止价格/库存数据过度老化。

2. **第二阶段（增量同步）**：SSO 商品状态变更触发 webhook 通知 Strapi，Strapi 获取最新事实，重新聚合对应 SKU 的内容并更新单条 Meilisearch 文档。

## 5. Next.js BFF 查询契约重塑

`ProductDiscoveryQuery` 与 `ProductDiscoveryResult` 的数据结构契约**保持不变**，仅内部实现由 Magento 请求重写为 Meilisearch 查询。

### 5.1 目录结构

```text
lib/api/discovery/
  ├── types.ts           // 契约不变
  ├── service.ts         // [改造] 将底层查询由 Magento 替换为 Meilisearch
  └── meilisearch.ts     // [新增] Meilisearch 客户端封装与查询构造
```

### 5.2 降级与过渡策略

在 `service.ts` 中暂时保留基于 `discovery-category-mapping` 的 Magento 查询链路作为 fallback。
**强制约束**：在 Meilisearch 商品索引首批数据跑通、分类页能正常加载商品后，**立即删除**该 fallback 代码。

### 5.3 统一 API 入口

- **分类页**：`GET /api/discovery/[slug]`（复用 `service.ts`，附加 `slug` 过滤条件）
- **搜索页**：`GET /api/search`（复用 `service.ts`，无分类过滤，主要走关键字搜索）

**Facet 补充说明**：
虽然契约中的 `facets` 数组要求按分类/品牌等统计每个选项的商品数量（`count`），但由于第一阶段的 Meilisearch 查询（阶段 2）主要集中在跑通主流程，BFF 层的 `available_filters` 可以先返回空 `count` 或硬编码配置。随着页面 UI 的完善（阶段 3），再逐步引入完整的 facet 数据映射，这不会影响后端的模型调整。

## 6. 实施顺序

1. **Strapi 侧基建**：`product-enrichment` 加字段，建立 `products` 索引及初始化脚本，跑通全量拉取聚合入库。
2. **Next.js 服务层**：编写 `meilisearch.ts`，改造 `service.ts` 接入 Meilisearch。
3. **前端 UI 接入**：迁移 `/shop/[slug]` 路由，开发 `/search` 页面，接入 FilterPanel/SortPanel 组件与 Load more 分页。
4. **增量同步**：SSO 实现 webhook 触发 Strapi 增量更新。
5. **清理技术债**：删除 `discovery-category-mapping` 相关的后端接口、BFF 调用与废弃代码。
