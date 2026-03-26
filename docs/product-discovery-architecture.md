# 商品发现体系技术方案

> **目标**：在不影响 Magento 核心交易职责的前提下，建立由 Strapi 驱动的前台商品发现体系，统一承接分类导航、类目落地页、筛选配置与后续搜索扩展。
>
> **适用范围**：商品分类页、类目落地页、商品筛选、商品列表、后续 Meilisearch 搜索衔接。
>
> **当前结论**：
>
> - 前台分类模型必须独立于 `magento-category`
> - 商品必须保留 Magento 原始分类集合，而不是单个分类 ID
> - 当前 discovery 链路已进入 **Meilisearch 优先、Magento fallback 仅保底** 的过渡态
> - `discovery-category-mapping` 仍作为过渡结构存在，待商品索引稳定且增量同步上线后清理
> - 下一阶段重点不再是页面骨架，而是商品索引覆盖率、初始配置数据与统一搜索页

---

## 1. 背景

当前 `prism` 的 PDP 已经形成较清晰的分层：

- Magento / SSO 提供商品事实：价格、库存、配置项、可售状态
- Strapi 提供商品内容增强：富文本、图片、SEO、卖点、食谱、文章
- Next.js 在服务端完成聚合，向页面输出统一商品数据

参考：

- `apps/prism/lib/api/unified-product.ts`
- `apps/prism/lib/api/strapi/product-enrichment.ts`

商品列表页（PLP）已经从原先直接依赖 Magento 分类 ID 的页面实现，迁移到以前台 `slug` 为主语义的 discovery 链路：

- `apps/prism/app/shop/[slug]/page.tsx` 负责首屏分类页渲染
- `apps/prism/app/api/discovery/[slug]/route.ts` 负责分页与客户端追加加载
- 分类导航结构、类目落地页与筛选配置已开始由 Strapi 承接

当前真正需要解决的，不再是是否迁移页面入口，而是如何让 discovery 配置、商品索引与后续搜索阶段保持一致。

---

## 2. 设计目标

### 2.1 业务目标

- 前台分类导航由 Strapi 管理，而不是直接复用 Magento 原始类目树
- 类目落地页配置由 Strapi 管理，包括标题、图标、Banner、SEO、排序等
- 筛选配置由 Strapi 管理，包括品牌、属性、价格区间、排序项、显示顺序等
- 商品列表页移动端优先，PC 端兼容
- URL 参数稳定，可分享、可收藏、可承接后续搜索
- 后续接入 Meilisearch 时，不推翻前台分类与筛选契约

### 2.2 技术目标

- 将“前台发现配置”与“商品事实来源”彻底分层
- 保留 Magento 作为交易事实源，不让 Strapi 覆盖价格、库存、可售状态等字段
- 为阶段三商品列表与阶段四超级搜索建立统一查询契约
- 将底层检索引擎设计为可替换：第一阶段可走 Magento/SSO，后续可迁移到 Meilisearch

---

## 3. 当前现状

### 3.0 当前实现状态（2026-03-26）

当前已落地并验证的 discovery 实现如下：

- `apps/prism/lib/api/discovery/meilisearch.ts`
  - 已实现商品 Meilisearch 查询、排序、筛选与 facet 请求封装
- `apps/prism/lib/api/discovery/service.ts`
  - 已实现 `fetchDiscoveryResult()`，当前采用 Meilisearch 优先、Magento fallback 保底的过渡策略
- `apps/prism/lib/api/strapi/discovery.ts`
  - 已实现前台分类、筛选配置与过渡期 mapping 数据读取
- `apps/prism/app/api/discovery/[slug]/route.ts`
  - 已实现 Route Handler，返回统一 `ProductDiscoveryResult`
- `apps/prism/app/shop/[slug]/page.tsx`
  - 已完成前台分类页迁移与首屏 SSR
- `apps/prism/app/shop/components/FilterPanel.tsx`
  - 已提供基础筛选面板与 URL 状态同步
- `apps/prism/app/shop/components/SortPanel.tsx`
  - 已提供排序切换
- `apps/prism/app/shop/components/ProductGrid.tsx`
  - 已提供 Load more 分页交互
- `apps/prism/app/shop/components/DiscoveryProductCard.tsx`
  - 已用于 discovery 商品卡片渲染，并已修复空价格场景
- `apps/prism/tests/DiscoveryProductCard.spec.tsx`
  - 已覆盖 `price: null` 时卡片不崩溃的回归测试

当前未完成但已明确的阻塞点：

- Strapi 侧商品索引覆盖率仍需补齐
- 初始 `discovery-category` / `discovery-filter-config` 数据仍需录入
- SSO 增量同步链路未上线，暂不能删除 fallback / mapping 技术债
- `/search` 商品搜索页与统一搜索结果仍待收口

### 3.1 Prism 现状

#### PDP 已完成的分层

- `apps/prism/lib/api/unified-product.ts`
  - 已实现 Magento 商品事实与 Strapi 商品增强的聚合
- `apps/prism/lib/api/strapi/product-enrichment.ts`
  - 已实现按 SKU 获取 `product-enrichment`
  - 已聚合 PDP 相关 recipe/article 内容

#### PLP 现状

- `apps/prism/app/shop/[slug]/page.tsx`
- `apps/prism/app/api/discovery/[slug]/route.ts`

当前页面参数已切换为前台 `slug`，首屏页面与 API 入口共用 discovery service。

当前运行方式：

- 通过 `fetchDiscoveryResult()` 聚合前台分类配置与商品结果
- 默认优先查询 Meilisearch `products` 索引
- 当分类页查询失败且存在 `slug` 时，临时降级到 Magento fallback

当前 PLP 的主要剩余问题：

- 前台配置数据与商品索引覆盖率仍不完整
- 移动端分类导航与类目落地页配置仍待完善
- fallback 仍然存在，文档和代码都需要在前提满足后清理

### 3.2 Strapi 现状

当前 Strapi 已有能力：

- `magento-products`
  - 作为 Magento 商品镜像层
- `magento-categories`
  - 作为 Magento 分类镜像层
- `product-enrichments`
  - 作为 PDP 内容增强层
- 已有 recipe/article 与 `magento-product` 的 SKU 关联能力
- 已有博客、食谱的 Meilisearch 集成

当前 Strapi 已明确落地的能力：

- 独立的前台分类模型 `discovery-category`
- 筛选配置模型 `discovery-filter-config`
- 过渡期前台分类映射模型 `discovery-category-mapping`
- `product-enrichment` 上的 `discovery_categories` 归类关系
- 可供 Next/BFF 读取的 discovery 配置 API

当前 Strapi 仍待补齐的能力：

- 初始前台分类与筛选配置数据录入
- 商品索引字段覆盖率与稳定性
- 面向 Meilisearch 的增量同步链路

结论：

当前 Strapi 已具备作为“商品发现配置中心 + 索引构建参与者”的基础，后续重点是数据与同步，而不是继续补建模。

---

## 4. 核心边界

### 4.1 Magento / SSO 负责什么

Magento / SSO 继续承担商品交易事实层职责：

- 商品主数据
- 原始分类关系
- 品牌与属性原始值
- 价格
- 库存
- 可售状态
- 加购、购物车、结算、客户态能力

说明：

- Magento 原始分类关系仍是商品事实的一部分，不能被前台分类直接替代
- 第一阶段 PLP 商品结果事实继续优先由 Magento / SSO 提供

### 4.2 Strapi 负责什么

Strapi 负责前台发现配置层：

- 前台分类树
- 类目落地页配置
- 筛选配置
- 排序配置
- 图标、Banner、SEO、文案
- 前台分类与 Magento 原始分类的映射规则
- 商品内容增强（已存在）

说明：

- Strapi 管理的是“前台发现体系”，不是直接接管 Magento 商品事实
- Strapi 不负责价格、库存、可售状态等强交易字段的最终权威来源

### 4.3 Next.js / BFF 负责什么

Next.js 作为上层 BFF，负责：

- 读取 Strapi 的前台分类与筛选配置
- 将前台分类映射翻译为底层可执行查询条件
- 聚合 Magento / SSO 商品结果与 Strapi 商品内容
- 向页面输出统一的类目页与筛选页数据结构
- 逐步承接商品发现查询契约与搜索聚合能力

### 4.4 Meilisearch 负责什么

Meilisearch 当前已承担：

- 商品分类页检索的主链路
- `brand` facet 与基础筛选支持
- 排序、分页与商品卡片字段返回

Meilisearch 后续继续承担：

- 商品、文章、食谱统一搜索
- 更完整的 facet 统计与搜索结果聚合

说明：

- 当前代码已经是 Meilisearch 优先，并非仅停留在后续评估阶段
- Magento 查询仅作为过渡期分类页保底，不应再被视为长期主方案

---

## 5. 数据模型设计

### 5.1 原则

- 镜像层与前台层分离
- 商品事实与前台发现配置分离
- 不让前台分类模型污染 Magento 镜像模型
- 不将底层检索引擎参数直接暴露为前台 URL 语义

### 5.2 Magento 镜像层

#### `magento-category`

职责：

- 镜像 Magento 原始分类结构
- 保留原始 `id`、`parent`、`path`、`level`、`name` 等事实字段
- 作为同步、排查和映射的依据

限制：

- 不直接作为前台导航模型扩展
- 不承载前台 Banner、图标、SEO、显示规则、筛选规则

#### `magento-product`

职责：

- 镜像 Magento 商品事实
- 保留 SKU、名称、价格、库存、状态、品牌、属性、原始分类关系等

关键要求：

- 商品必须保留 **Magento 原始分类集合**，而不是单个分类 ID
- 该集合至少应支持：
  - 原始分类 ID 列表
  - 必要时附带分类最小快照（如 `id`、`name`、`path`、`level`）

原因：

- Magento 商品可能属于多个分类
- 前台分类与 Magento 原始分类不一定一一对应
- 后续搜索、推荐、人工选品都需要更灵活的关系支撑

### 5.3 前台发现层

建议新增独立前台分类模型，例如：`discovery-category`

职责：

- 定义前台一级 / 二级 / 三级分类结构
- 定义类目 URL 标识（slug）
- 定义图标、Banner、SEO、展示标题、排序等
- 定义是否显示在导航中、是否启用、默认排序方式等
- 定义移动端导航结构与入口布局

建议字段方向：

- `name`
- `slug`
- `parent`
- `level`
- `icon`
- `banner`
- `seo`
- `sort_order`
- `is_visible`
- `default_sort`
- `layout_type`
- `description`

说明：

- 该模型是前台分类树，不要求与 `magento-category` 一一对应
- 可根据运营需求自由组织层级与展示结构

### 5.4 前台分类映射层

建议新增映射结构，例如：`discovery-category-mapping`

职责：

- 建立前台分类与 Magento 原始分类之间的映射关系
- 为 Next/BFF 提供商品集合圈定依据

建议支持：

- 一个前台分类映射多个 Magento 分类
- 一个 Magento 分类可被多个前台分类复用
- 后续保留扩展空间：品牌限制、排除规则、人工选品规则

第一阶段最小要求：

- `discovery-category -> magento-categories[]`

后续可扩展：

- include / exclude 规则
- 运营精选商品列表
- 品牌白名单

### 5.5 筛选配置层

建议新增筛选配置模型，例如：`discovery-filter-config`

职责：

- 定义某个前台分类可见哪些筛选项
- 定义筛选项的显示顺序、文案、默认展开状态
- 定义排序选项列表
- 定义价格区间配置

建议字段方向：

- `discovery_category`
- `enabled_filters`
- `sort_options`
- `default_sort`
- `price_ranges`
- `is_enabled`

筛选项分层说明：

- Strapi 负责“筛选配置”
- 检索层负责“筛选结果事实”

例如：

- Strapi 决定页面显示 `brand`、`color`、`capacity`
- 底层检索层决定当前结果里 `brand=A` 有多少个商品

这两个职责不能混在一起。

---

## 6. 查询契约设计

### 6.1 目标

阶段三和阶段四都应复用统一商品发现查询契约。该契约应独立于底层数据源，不直接暴露 Magento API 参数或 Meilisearch 查询细节。

### 6.2 输入契约

建议统一为以下语义：

- `slug`
  - 前台分类标识，使用前台分类 `slug`，不使用 Magento `categoryId` 作为前台主语义
- `brand`
  - 第一阶段已落地筛选项之一
- `price_min` / `price_max`
  - 第一阶段价格区间筛选输入
- `sort`
  - 第一阶段稳定排序键：`featured`、`price_asc`、`price_desc`、`newest`
- `page` / `pageSize`
  - 分页模式时使用
- `cursor`
  - 无限滚动模式时预留

URL 设计原则：

- 参数语义面向前台，不面向底层引擎
- 可分享、可收藏、可复用到搜索结果页
- 不将 Magento 或 Meilisearch 的内部字段名直接暴露到前台 URL

### 6.3 输出契约

建议统一输出：

- `category`
  - 当前前台分类信息
- `applied_filters`
  - 当前已应用筛选条件
- `available_filters`
  - 当前可见筛选面板及选项配置
- `facets`
  - 当前结果集的筛选统计信息
- `sort_options`
  - 当前可用排序项
- `items`
  - 商品卡片数据列表
- `pagination`
  - 分页或游标信息
- `total`
  - 总结果数

### 6.4 商品卡片字段

商品卡片字段建议稳定为：

- `sku`
- `name`
- `subtitle`
- `thumbnail`
- `price`
- `price_range`
- `in_stock`
- `promotion_label`
- `rating_summary`
- `review_count`
- `badges`
- `href`

说明：

- 商品卡片字段也应独立于底层引擎
- 阶段三和阶段四应共享这一最小字段集

---

## 7. 分阶段实施方案

### 阶段 3A：前台发现配置与查询骨架落地

目标：

- 明确前台分类体系
- 明确类目落地页与筛选配置归属
- 建立统一 discovery 查询契约与页面入口

当前完成情况（2026-03-26）：

- Strapi 已新增 `discovery-category` Content Type，包含前台分类树、自关联、图标、Banner、SEO、默认排序、布局类型等字段
- Strapi 已新增 `discovery-category-mapping` Content Type，作为过渡期前台分类到 Magento 分类 ID 集合的映射结构
- Strapi 已新增 `discovery-filter-config` Content Type，承接 `enabled_filters`、`sort_options`、`default_sort`、`price_ranges` 等配置
- `product-enrichment` 已具备 `discovery_categories` 关系，可承接前台商品归类
- Next.js 已新增 `apps/prism/lib/api/discovery/types.ts`，定义 `DiscoveryCategory`、`DiscoveryFilterConfig`、`ProductDiscoveryQuery`、`ProductDiscoveryResult` 等契约
- Next.js 已新增 `apps/prism/lib/api/strapi/discovery.ts`，实现前台分类、筛选配置与过渡期 mapping 读取
- Next.js 已新增 `apps/prism/lib/api/discovery/meilisearch.ts`，实现商品检索客户端
- Next.js 已新增 `apps/prism/lib/api/discovery/service.ts`，当前采用 Meilisearch 优先、Magento fallback 保底
- Next.js 已完成 `/api/discovery/[slug]` 与 `/shop/[slug]` 落地，并已验证 `cookware` 分类页可返回并渲染商品

实施重点：

- 在 Strapi 中承接 discovery 配置与商品归类
- 在 Next.js 中以 `slug` 作为前台主语义
- 在 BFF 中统一查询契约，屏蔽底层检索差异

当前剩余重点：

- 补齐初始前台分类与筛选配置数据
- 提升商品索引覆盖率与稳定性
- 为后续删除 fallback 做前提准备

### 阶段 3B：分类页和筛选页完整打通

目标：

- 在已跑通的 discovery 链路之上补齐移动端优先体验
- 支持 URL 状态分享
- 完成类目落地页配置与布局收口

实施重点：

- 左侧一级类目、右侧二级标题与三级图标入口的导航结构
- 类目落地页 Banner / SEO / layout_type 的真实接入
- 筛选面板与排序面板的移动端/PC 兼容收口
- 商品卡片契约与展示细节统一
- PC 端兼容布局

说明：

- Meilisearch 已经接入，不再是这一阶段的前提工作
- 当前这阶段更偏向 UI、配置接入和交互 polish

### 阶段 4A：超级搜索与商品索引稳定化

目标：

- 在现有商品 Meilisearch 链路基础上，建立统一搜索结果页能力
- 同时补齐商品索引覆盖率、facet 与增量同步前提

实施重点：

- 提升商品索引覆盖率与字段边界稳定性
- 搜索结果与类目页共用商品卡片与查询契约
- 输出统一搜索结果类型
- 为后续清理 fallback 准备数据与同步前提

说明：

- 这一阶段的重点已不再是“是否接 Meilisearch”，而是“让 Meilisearch 商品索引真正稳定可依赖”

### 阶段 4B：评估商品发现检索是否迁移到 Meilisearch

评估条件：

- Magento / SSO 当前类目查询性能是否足够
- 多维筛选和 facet 计算是否已成为性能瓶颈
- 商品量级是否已超出当前链路可接受范围
- 前台筛选体验是否需要更强的 facet / ranking 能力

如果满足条件：

- 将商品类目页检索逐步迁移到 Meilisearch
- 保持前台分类、URL 和商品发现契约不变
- 仅替换底层检索实现

---

## 8. 为什么第一阶段不直接让 Strapi 商品镜像承担正式 PLP 查询

原因如下：

1. 当前 `prism` 已经具备 Magento / SSO 的商品列表查询基础能力
2. 价格、库存、可售状态等强交易字段仍以 Magento 为权威
3. Strapi 当前更适合作为配置中心与内容增强层，而不是一开始就承担复杂商品检索
4. 如果第一阶段同时替换“前台分类体系”和“底层商品结果事实源”，风险过高
5. 长期来看，更可能由 Meilisearch 而非 Strapi 本体承担商品发现检索与 facet 计算

因此建议：

- 第一阶段优先替换前台发现结构与配置归属
- 第二阶段再评估底层商品检索实现是否迁移

---

## 9. 风险与注意事项

### 9.1 不要让前台分类直接覆盖 Magento 原始分类

风险：

- 同步与排查困难
- 无法准确回溯商品原始归属
- 难以支持多分类映射和后续搜索扩展

### 9.2 不要只保留一个 Magento 分类 ID

风险：

- 信息丢失
- 无法表达多分类商品
- 无法支持前台分类与原始分类的灵活映射

### 9.3 不要把筛选配置和筛选结果事实混在 Strapi 中

风险：

- Strapi 模型职责混乱
- 难以与后续检索引擎衔接
- facet 统计逻辑无法清晰迁移

### 9.4 不要将底层引擎参数直接暴露为前台 URL

风险：

- 切换底层实现时需要重写前台路由与状态逻辑
- 阶段三与阶段四无法共用统一商品发现契约

---

## 10. 设计决议

以下决议作为下一阶段默认实现口径。

### 10.1 前台分类主标识

- 前台 URL 与查询契约对外使用 `slug`
- Strapi 内部仍保留稳定 ID（如 `id` / `documentId`）用于关系关联
- Next/BFF 先按 `slug` 定位前台分类实体，再通过内部稳定 ID 读取映射关系与筛选配置

理由：

- `slug` 更适合作为面向用户的 URL 语义，具备更好的可读性与 SEO 友好性
- 稳定 ID 更适合承载内部关系，避免类目重命名或多语言调整时关系抖动

### 10.2 第一阶段映射规则范围

- 第一阶段仅支持 `前台分类 -> Magento 分类集合`
- 商品集合由映射到的 Magento 原始分类并集圈定
- 第一阶段不支持：排除规则、品牌白名单、人工精选、动态规则表达式

理由：

- 当前阶段优先验证前台分类体系、类目页体验与筛选交互是否成立
- 过早引入复杂映射规则会明显增加 Strapi 配置复杂度、BFF 解释成本和排查难度

### 10.3 第一阶段筛选项范围

第一阶段仅支持以下 4 类筛选能力：

- `brand`
- `attributes`（仅开放少量购买决策强相关且数据质量稳定的属性，如 `color`、`capacity`、`size`）
- `price`
- `sort`

第一阶段排序项默认范围：

- `featured`
- `price_asc`
- `price_desc`
- `newest`

说明：

- 不默认开放全部 Magento 属性作为前台筛选项
- `best_selling` / 销量排序暂不作为第一阶段强承诺，待底层数据能力与语义确认后再评估接入

### 10.4 第一阶段列表加载方式

- 底层查询统一采用分页语义（`page` / `pageSize`）
- 前台交互优先采用 `Load more`
- 第一阶段不做纯自动无限滚动

理由：

- 分页语义更稳定，便于首屏 SSR、状态恢复、URL 分享与后续底层切换
- `Load more` 更适合在移动端作为分页与无限滚动之间的折中方案

### 10.5 BFF 查询入口形态

- 商品发现核心逻辑应沉淀在共享 service 层
- Route Handler 作为统一商品发现 API 入口
- Server Component 负责首屏 SSR，并复用同一 service 层逻辑
- 不允许分别在页面层和 API 层维护两套商品发现实现

推荐结构：

- `apps/prism/lib/api/discovery/`\*：商品发现领域逻辑与统一查询契约
- `apps/prism/app/api/discovery/*/route.ts`：标准 API 入口
- `apps/prism/app/shop/[slug]/page.tsx`：首屏页面入口

---

## 11. 待后续确认事项

以下事项仍需在进入详细实现前继续确认：

1. 前台分类模型命名与层级限制
2. 第一批类目分别开放哪些具体属性作为筛选项
3. 类目页首版是否需要保留页码型分页回退能力
4. 商品索引进入 Meilisearch 的字段边界与同步时机
5. 前台分类 `slug` 变更时是否需要历史 slug / 重定向策略

---

## 12. 推荐结论

推荐采用以下路线：

1. 在 Strapi 中新增独立前台分类体系，不复用 `magento-category` 作为前台模型
2. 商品镜像层保留 Magento 原始分类集合，不收缩为单个分类 ID
3. 第一阶段由 Strapi 管理前台发现配置，Magento / SSO 继续提供商品结果事实
4. Next.js 作为上层 BFF 聚合配置与结果，建立统一商品发现查询契约
5. 统一采用 `slug` 对外、稳定 ID 对内的分类标识策略
6. 第一阶段映射规则仅支持 `前台分类 -> Magento 分类集合`
7. 第一阶段筛选范围仅支持品牌、核心属性、价格、排序
8. 第一阶段列表采用分页契约 + `Load more` 交互
9. 商品发现逻辑沉淀在共享 service 层，由 Route Handler 和 Server Component 复用
10. 后续优先接入 Meilisearch 超级搜索，再评估是否逐步接管商品类目页检索

---

_最后更新：2026-03-24_
