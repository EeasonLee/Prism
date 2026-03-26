# 商品索引落地方案（简版）

> 目标：用一套清晰、可执行的方案，支持商品搜索页与分类落地页统一走 Meilisearch，避免继续围绕 Magento 分类映射做过渡方案。
>
> 适用范围：商品搜索、商品分类页、筛选页、后续商品发现体系。
>
> 最后更新：2026-03-25

---

## 1. 为什么现在要改方向

当前项目已经开始建设 `discovery-category`、`discovery-filter-config`，但原方案仍然默认：

- 前台分类由 Strapi 管
- 商品结果仍优先按 Magento 分类查
- Next.js 通过 `discovery-category-mapping` 把前台分类翻译成 Magento 分类 ID

这条路可以作为过渡，但不适合作为长期方案。原因很直接：

- 运营真正想维护的是前台分类，不是 Magento 分类映射
- 映射关系理解成本高，后续排查也麻烦
- 搜索页和分类页最终都需要统一的筛选、排序、分页和 facet 能力
- 这些能力更适合由 Meilisearch 承担，而不是继续绑在 Magento category 查询上

结论：

**商品发现体系应尽快切换为“Strapi 管前台分类与归类，Meilisearch 管商品检索”。**

---

## 2. 当前现状判断

### 2.1 已有基础

Strapi 侧已经具备以下基础：

- 已有 `discovery-category`
- 已有 `discovery-filter-config`
- 已有 `product-enrichment`
- 已有 recipes / articles 的 Meilisearch 工具与索引初始化逻辑
- Strapi 启动时会自动检查并重建 recipes / articles 索引

说明：

**项目并不是从 0 开始做 Meilisearch，而是已经有一套可复用的索引模式。商品索引可以沿用同样思路落地。**

### 2.2 当前最大问题

Strapi 中现有 `magento-product` 模型字段太少，只够做基础镜像，不够支撑商品检索。

当前已有字段大致只有：

- `sku`
- `name`
- `price`
- `slug`
- `url`
- `image`
- `isActive`
- `stock`
- `shortDescription`
- `description`
- `syncedAt`

当前明显缺少：

- 品牌
- 可筛选属性
- Magento 原始分类集合
- 前台分类归属
- 更完整的图片与展示字段
- 统一排序所需字段
- 稳定的增量同步字段

结论：

**当前最大风险不是 Meilisearch 本身，而是商品源数据还不够。**

---

## 3. 新方案的核心结论

### 3.1 角色分工

#### Strapi 负责

- 前台分类树
- 筛选配置
- 商品前台归类关系
- 商品内容增强

#### Magento / SSO 负责

- 商品交易事实
- 价格
- 库存
- 可售状态
- 原始商品字段

#### Meilisearch 负责

- 商品搜索
- 商品分类页检索
- facet 统计
- 排序
- 分页结果

#### Next.js 负责

- 调用统一商品发现接口
- 渲染搜索页与分类页
- 管理 URL 状态

### 3.2 总体原则

- 前台分类不再依赖 Magento 分类映射作为主方案
- 搜索页和分类页共用同一套商品索引
- Strapi 不直接承担大规模商品检索，只承担配置和关系维护
- Magento 保留事实源角色，但不继续主导前台分类页结构

---

## 4. 这次要做什么，不做什么

### 4.1 本阶段要做

1. 补齐商品索引所需的数据字段
2. 建立商品索引写入 Meilisearch 的链路
3. 明确前台分类和商品的归类关系由 Strapi 管理
4. 提供统一商品检索接口，供搜索页和分类页复用

### 4.2 本阶段暂时不做

- 不追求一次性把所有 Magento 字段都镜像进 Strapi
- 不先做完整复杂属性筛选
- 不先做销量排序、推荐排序等复杂 ranking
- 不先做全量搜索运营能力

本阶段只聚焦第一批最核心能力：

- 分类页可查
- 搜索页可查
- 支持 `brand + price + sort`
- 支持分页
- 支持基本 facet

---

## 5. 商品索引的数据来源建议

### 5.1 不建议直接用 `magento-product` 单表作为最终索引源

原因：

- 现有字段过薄
- 缺少前台分类关系
- 缺少内容增强字段
- 缺少筛选字段

### 5.2 建议采用“聚合后写索引”的方式

商品索引文档建议由 3 部分聚合而成：

1. Magento / SSO 商品事实

- `sku`
- `name`
- `price`
- `special_price`
- `currency`
- `stock`
- `is_active`
- `brand`
- `attributes`
- `magento_category_ids`

2. Strapi 商品内容增强

- `display_name`
- `subtitle`
- `base_image`
- `promotion_label`
- `seo`
- 内容状态字段

3. Strapi 前台归类与筛选配置

- `discovery_category_slugs`
- `discovery_category_ids`
- 类目默认排序可选信息

结论：

**商品索引不应直接等于某一张表，而应是聚合产物。**

---

## 6. 建议新增或调整的数据模型

### 6.1 保留

- `discovery-category`
- `discovery-filter-config`
- `product-enrichment`

### 6.2 建议冻结或逐步废弃

- `discovery-category-mapping`

原因：

它更像过渡方案，不适合作为长期前台分类体系的主关系模型。

### 6.3 建议新增一层“商品前台归类关系”

推荐二选一：

#### 方案 A：挂在 `product-enrichment` 上

给 `product-enrichment` 增加：

- `discovery_categories`（多对多）

优点：

- 简单直接
- 运营好理解
- 先跑通最快

缺点：

- 后续如果要做精选排序、人工置顶，扩展性一般

#### 方案 B：单独建关系模型

例如新增：`discovery-product-assignment`

建议字段：

- `sku`
- `discovery_categories`
- `is_active`
- `sort_order`（可选）
- `manual_boost`（可选）

优点：

- 关系层更清晰
- 后续扩展更自然

缺点：

- 模型多一层
- 首版理解成本略高

### 6.4 当前建议

**先用方案 A。**

原因：

当前首要目标是尽快让“前台分类完全由 Strapi 管”这件事成立，不要先引入太多抽象。

---

## 7. 商品索引建议字段（首版）

首版商品索引不需要追求大而全，只保留搜索页和分类页真正要用的字段。

建议首版字段：

- `id`：建议用 `sku`
- `sku`
- `name`
- `display_name`
- `subtitle`
- `thumbnail`
- `price`
- `special_price`
- `currency`
- `in_stock`
- `is_active`
- `brand`
- `attributes`
- `promotion_label`
- `magento_category_ids`
- `discovery_category_slugs`
- `discovery_category_ids`
- `updated_at`
- `url`

### 7.1 首版可筛选字段

建议只开放：

- `discovery_category_slugs`
- `brand`
- `price`
- 少量稳定属性（如果现阶段数据稳定）

### 7.2 首版可排序字段

建议只开放：

- `updated_at`
- `price`
- `featured_score`（如果后续补）

说明：

`featured` 首版可以先由业务字段映射，或者先退化为固定排序，不必一开始做复杂 ranking。

---

## 8. 商品索引写入方式建议

### 8.1 建议沿用现有 recipes / articles 的模式

当前 Strapi 已有成熟模式：

- 启动时确保 index 存在
- 自动初始化 settings
- 支持全量重建
- 支持单条更新
- 支持缺失文档补齐
- 支持旧文档修复

商品索引建议复用同样模式。

### 8.2 建议提供 3 类能力

#### 1. 全量重建

适用场景：

- 首次上线
- 字段结构调整
- 数据污染后重建

#### 2. 单商品增量更新

适用场景：

- 商品内容改动
- 商品归类改动
- 价格库存同步后更新

#### 3. 索引修复

适用场景：

- Meilisearch 丢文档
- 某些历史文档缺字段

---

## 9. 查询接口建议

### 9.1 分类页接口

建议统一为：

- `GET /api/discovery/[slug]`

支持参数：

- `q`
- `brand`
- `price_min`
- `price_max`
- `sort`
- `page`
- `pageSize`

### 9.2 搜索页接口

建议统一为：

- `GET /api/search/products`

支持参数：

- `q`
- `slug`（可选，表示某个前台类目内搜索）
- `brand`
- `price_min`
- `price_max`
- `sort`
- `page`
- `pageSize`

### 9.3 原则

- 搜索页和分类页底层都走 Meilisearch
- 区别只在于是否带 `slug` 过滤条件
- 这样前端状态和契约更统一

---

## 10. 实施顺序建议

### Step 1：先补齐模型和字段边界

要确认：

- 商品索引首版字段清单
- 前台分类归类关系放在哪
- 哪些字段来自 Magento / SSO
- 哪些字段来自 Strapi

### Step 2：先做商品索引写入能力

要完成：

- `products` 索引创建
- 索引 settings 配置
- 全量重建脚本
- 单商品更新脚本

### Step 3：跑通第一批数据

要验证：

- 至少有一批真实商品写进索引
- 分类页能按 `slug` 查出商品
- `brand` / `price` / `sort` 能工作

### Step 4：再接 Next.js 页面

要完成：

- `/shop/[slug]`
- `/search`
- filter / sort / pagination UI

---

## 11. 当前最需要先确认的 4 个问题

### Q1. 商品事实从哪里进索引

建议：

先确认是：

- Strapi 定时从 SSO 拉商品事实
- 还是 SSO 主动推送到 Strapi

当前不建议直接让 Next.js 负责商品索引构建。

### Q2. 商品前台归类关系放哪里

建议：

首版直接挂在 `product-enrichment` 上，先跑通。

### Q3. 首版是否依赖 Magento 原始分类

建议：

保留 Magento 原始分类字段，仅作为参考与排查字段；前台分类页不再依赖它作为主检索入口。

### Q4. 首版开放哪些筛选项

建议：

只开放：

- `brand`
- `price`
- `sort`

少量属性筛选等第二步再补。

---

## 12. 风险与应对

### 风险 1：商品数据不完整

表现：

- 索引有商品，但缺品牌、分类、价格等关键字段

应对：

- 先定义首版最小字段集
- 先只上最关键的筛选能力

### 风险 2：商品同步链路不稳定

表现：

- 索引更新慢
- 有商品遗漏
- 分类页结果不准

应对：

- 首版先支持全量重建
- 同时提供缺失文档补齐能力

### 风险 3：过早做复杂筛选

表现：

- 项目范围快速膨胀
- 数据质量跟不上

应对：

- 首版只做 `brand + price + sort`
- 稳定后再扩属性筛选

### 风险 4：继续保留 mapping 导致双轨复杂

表现：

- 一套是前台分类归类
- 一套是 Magento 分类映射
- 最后团队不知道该维护哪套

应对：

- 尽快明确长期主方案
- 如切到商品索引路线，`discovery-category-mapping` 不再继续扩展

---

## 13. 建议结论

建议将当前商品发现体系调整为以下路线：

1. `discovery-category` 保留，继续作为前台分类中心
2. `discovery-filter-config` 保留，继续作为筛选配置中心
3. `discovery-category-mapping` 冻结，不再作为长期主模型推进
4. 商品前台归类关系交由 Strapi 直接维护
5. 商品搜索和分类页统一使用 Meilisearch
6. 当前优先级最高的任务不是页面，而是商品索引链路
7. Next.js 页面接入放在商品索引跑通之后

一句话总结：

**先把“商品能被正确索引和检索”做成立，再做分类页和搜索页 UI；否则前端越早接入，返工越大。**
