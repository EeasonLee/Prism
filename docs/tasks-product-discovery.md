# 商品发现体系开发任务

> 对应架构文档：`docs/product-discovery-architecture.md`  
> 最后更新：2026-03-26

## 决策记录

| 决策项           | 结论                                               |
| ---------------- | -------------------------------------------------- |
| 前台分类层级     | 最多 3 级（一级导航 + 二级落地页 + 三级图标入口）  |
| 第一阶段筛选项   | `brand` + `price` + `sort`                         |
| 排序项           | `featured` / `price_asc` / `price_desc` / `newest` |
| 列表加载方式     | 分页契约（`page` / `pageSize`）+ Load more 交互    |
| 前台 URL 标识    | `slug`（对外）+ 稳定 ID（内部关联）                |
| 第一阶段映射规则 | 前台分类 → Magento 分类集合（并集）                |

---

## Phase 3A — 前台发现配置落地

> 目标：建立 Strapi 驱动的前台分类体系与筛选配置，不替换底层商品结果事实源。

### Strapi 侧

- **3A-S1** 新增 `discovery-category` Content Type
  - 已完成文件：`/mnt/d/WORK/helpcenter/backend/src/api/discovery-category/`
  - 字段：`name`, `slug`, `parent`(self-relation), `children`, `level`(1/2/3), `icon`, `banner`, `seo`, `sort_order`, `is_visible`, `default_sort`, `layout_type`, `description`
  - 路由策略：使用 `createCoreRouter`，开放 `find` / `findOne` 无鉴权访问
- **3A-S2** 新增 `discovery-category-mapping` Content Type
  - 已完成文件：`/mnt/d/WORK/helpcenter/backend/src/api/discovery-category-mapping/`
  - 字段：`discovery_category`(relation → discovery-category), `magento_category_ids`(JSON 数组), `is_active`
  - 第一阶段：一个前台分类可映射多个 Magento 分类 ID
- **3A-S3** 新增 `discovery-filter-config` Content Type
  - 已完成文件：`/mnt/d/WORK/helpcenter/backend/src/api/discovery-filter-config/`
  - 字段：`discovery_category`(relation), `enabled_filters`(JSON), `sort_options`(JSON), `default_sort`, `price_ranges`(JSON), `is_enabled`
  - 第一阶段启用项仍为 `brand` + `price`
- **3A-S4** 录入初始数据
  - 录入当前业务的前台分类树（参考 Magento 现有分类结构）
  - 建立前台分类与 Magento 分类的映射关系
  - 为每个前台分类配置筛选项

### Next.js / BFF 侧

- **3A-N1** 新增 Strapi discovery API 客户端
  - 文件：`apps/prism/lib/api/strapi/discovery.ts`
  - 已实现：`fetchDiscoveryCategories()` / `fetchDiscoveryCategoryBySlug(slug)` / `fetchDiscoveryCategoryMapping(categoryId)` / `fetchDiscoveryFilterConfig(categoryId)`
  - 已实现：Strapi media URL normalize + `revalidate: 3600` + cache tags
- **3A-N2** 建立统一商品发现查询契约
  - 文件：`apps/prism/lib/api/discovery/types.ts`
  - 已定义：`DiscoveryCategory` / `DiscoveryCategoryMapping` / `DiscoveryFilterConfig`
  - 已定义：`ProductDiscoveryQuery` / `ProductDiscoveryResult` / `ProductCardItem`
  - 当前字段以 Phase 3A 骨架可用为准，继续对齐架构文档 §6.2 / §6.3 / §6.4
- **3A-N3** 实现商品发现 service 层
  - 文件：`apps/prism/lib/api/discovery/service.ts`
  - 已实现：`resolveDiscoveryQuery(query)` — 将前台 slug 翻译为 Magento 分类 ID 集合
  - 已实现：`fetchDiscoveryResult(query)` — 聚合 Strapi 配置 + Magento 商品结果
  - 当前采用服务层多分类聚合：由于 SSO `/api/products` 仍仅支持单个 `categoryId`，Phase 3A 先逐个查询并在应用层去重合并
- **3A-N4** 新增 Route Handler（API 入口）
  - 文件：`apps/prism/app/api/discovery/[slug]/route.ts`
  - 已实现：接受 `slug`, `brand`, `price_min`, `price_max`, `sort`, `page`, `pageSize`
  - 已验证：返回 `ProductDiscoveryResult`，`/api/discovery/cookware` 可返回 Meilisearch 商品结果
- **3A-N5** 迁移 `/shop/[categoryId]` → `/shop/[slug]`
  - 已实现文件：`apps/prism/app/shop/[slug]/page.tsx`
  - 已实现：URL 参数改为前台 `slug`，通过 service 层读取 Strapi 配置并执行商品查询
  - 已验证：`/shop/cookware` 可返回 200 并渲染商品卡片
  - 旧路由重定向仍可选，未在本轮收口

---

## Phase 3B — 分类页与筛选页完整打通

> 目标：交付移动端优先的完整类目页体验，支持 URL 状态分享。

### UI 组件

- **3B-U1** 移动端分类导航组件
  - 左侧一级类目列表 + 右侧二级标题与三级图标入口
  - 参考架构文档 §7 阶段 3B 描述
- **3B-U2** 筛选面板组件（FilterPanel）
  - 支持 brand 多选、price 区间、sort 单选
  - URL 状态同步（`?brand=A,B&price_min=100&sort=price_asc`）
- **3B-U3** 排序面板组件（SortPanel）
  - 支持 `featured` / `price_asc` / `price_desc` / `newest`
- **3B-U4** 商品卡片统一数据结构
  - 对齐 `ProductCardItem` 契约字段
  - 复用现有 `ProductCard` 组件或按契约重构
- **3B-U5** Load more 分页交互
  - 首屏 SSR，后续 Load more 走 Route Handler
  - URL 保留 `page` 参数支持分享与刷新恢复

### 类目落地页

- **3B-P1** 类目落地页 Banner / 标题 / SEO
  - 从 Strapi `discovery-category` 读取配置
  - 支持 `layout_type` 控制不同落地页布局
- **3B-P2** PC 端兼容布局
  - 左侧分类侧边栏 + 右侧商品网格
  - 筛选面板在 PC 端内联展示，移动端抽屉展示

---

## Phase 4A — 超级搜索接入 Meilisearch

> 目标：商品 + 文章 + 食谱统一搜索，建立搜索结果页能力。

- **4A-1** 商品索引进入 Meilisearch（字段边界待确认）
- **4A-2** 搜索结果页（`/search?q=...`）
- **4A-3** 搜索结果与类目页共用 `ProductCardItem` 契约
- **4A-4** 统一搜索结果类型（商品 + 文章 + 食谱混合）

---

## Phase 4B — 评估商品发现检索迁移

> 评估条件见架构文档 §7 阶段 4B，满足条件后再启动。

- **4B-1** 评估 Magento 类目查询性能
- **4B-2** 评估 facet 计算瓶颈
- **4B-3** 决策：是否将商品类目页检索迁移到 Meilisearch

---

## 当前阻塞项

| 阻塞项                                              | 负责方       | 状态                                                |
| --------------------------------------------------- | ------------ | --------------------------------------------------- |
| Strapi 新增 Content Type（3A-S1/S2/S3）             | 开发         | 已完成，待重启 Strapi / Admin 验证                  |
| 初始前台分类数据录入（3A-S4）                       | 运营/产品    | 待启动                                              |
| Magento 属性数据质量确认（color/capacity 是否稳定） | 后端/Magento | 暂缓（第一阶段不需要）                              |
| Magento fallback / mapping 技术债清理（Task 9）     | 开发         | 待执行，需等待 SSO 增量同步链路上线后再删除保底代码 |

---

## 开发顺序建议

```
3A-S1 → 3A-S2 → 3A-S3   (Strapi 建模，可并行)
    ↓
3A-S4                     (录入初始数据)
    ↓
3A-N1 → 3A-N2             (API 客户端 + 类型定义，可并行)
    ↓
3A-N3                     (service 层，依赖 N1/N2)
    ↓
3A-N4 + 3A-N5             (Route Handler + 页面迁移，可并行)
    ↓
3B-U* + 3B-P*             (UI 组件与落地页，依赖 3A 完成)
```
