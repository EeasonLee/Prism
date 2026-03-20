# ADR-002: Magento → Strapi 同步方案

**状态：** 进行中
**日期：** 2026-03-19
**决策者：** 项目团队
**相关 ADR：** `docs/architecture/adr-001-product-data-fusion.md`

---

## 上下文

当前项目已经明确了前端聚合展示方向：

- Magento 负责核心商业能力
- Strapi 负责内容维护
- Next.js 负责按 `sku` 聚合两侧数据并渲染页面
- SSO 负责认证聚合与 Magento API 代理

但 Magento → Strapi 的同步链路仍未收口为正式方案，当前问题主要集中在以下几个方面：

1. 还没有明确 **哪些 Magento 字段应该同步到 Strapi**
2. `Strapi` 虽然已经完成商品双层模型的基础落地，但 **镜像层字段与内容层字段的最终边界还没有完全收口**
3. 还没有明确 **正式同步执行器应该由 SSO 推送还是由 Strapi 定时拉取**
4. `prism` 仓库虽然已有临时手动同步参考实现，`Strapi` 侧也已有早期直连 Magento 的同步脚本，但它们都不应直接等同于长期生产方案

用户已经确认了两个关键边界：

- `prism` 不承担正式同步职责，当前阶段不应以 `prism` 为落地主体
- `Strapi` 应采用双层模型，让管理员既能看到 Magento 主字段，又能维护 Strapi 内容字段

因此，1.1 阶段的目标不是先写同步代码，而是先把 **字段边界、模型结构、同步方向** 设计清楚。

---

## 决策

### 1. `prism` 不作为 Magento → Strapi 正式同步执行器

`prism` 的职责保持为前端展示与聚合消费层，不承接正式的商品同步任务。

当前 `apps/prism/app/api/admin/sync/magento-to-strapi/route.ts` 只保留为开发期参考实现或临时联调工具，不作为长期生产方案。

### 2. Strapi 采用双层商品模型

Strapi 商品相关数据拆分为两层，且基础模型已经在 `D:\WORK\helpcenter\backend` 落地：

#### A. Magento 镜像层

当前已落地模型：`magento-products`

职责：

- 存储从 Magento 同步过来的主字段
- 让 Strapi Admin 能看到 Magento 商品当前核心状态
- 作为同步落点与后台可见层
- 不作为运营编辑主入口

特点：

- 来源唯一：Magento
- 应视为只读镜像层
- 不承载营销/富文本/SEO 主编辑职责

#### B. 内容增强层

当前已落地模型：`product-enrichments`

职责：

- 存储运营维护的商品内容字段
- 作为 Next 聚合时的内容来源
- 与 Magento 商品通过 `sku` 建立关联

特点：

- 来源唯一：Strapi 运营维护
- 可编辑
- 不应覆盖价格、库存、可配置选项等核心商业字段

### 3. 字段边界先于同步收口

在同步方案真正落地前，必须先完成以下前置工作：

1. 查看 `SSO` 项目当前如何对接 Magento
2. 结合 Magento 官方文档梳理商品核心字段
3. 基于 Strapi 已落地模型收口双层字段边界
4. 再判断同步方向是 `SSO -> Strapi` 推送，还是 `Strapi -> SSO` 定时拉取

当前不预设推或拉为最终结论。

---

## 字段边界原则

### 一、Magento 核心字段

这类字段属于核心商业字段，应来自 Magento，并同步到 Strapi 镜像层。结合当前 SSO 实现，这些字段需要按两个来源来理解：

#### 1. 目录接口可直接获取的字段（SSO -> Magento GraphQL）

- `id`
- `uid`
- `sku`
- `name`
- `__typename`
- `url_key`
- `stock_status`
- `price_range.minimum_price.regular_price.value`
- `price_range.minimum_price.final_price.value`
- `price_range.minimum_price.final_price.currency`
- `thumbnail.url`
- `thumbnail.label`
- `rating_summary`
- `review_count`
- `categories`
- `configurable_options`
- `variants`
- `items`（grouped / bundle / downloadable 类型特定字段）
- `description.html`
- `short_description.html`
- `media_gallery`

#### 2. 库存接口额外补充字段（SSO -> Magento REST）

- `qty`
- `isInStock`
- `lowStockThreshold`
- `isLowStock`
- `backorders`
- `manageStock`

#### 3. 落到 Strapi 镜像层时建议统一的字段语义

- `id`
- `sku`
- `name`
- `type_id`
- `status`
- `visibility`
- `price`
- `final_price`
- `special_price`
- `currency`
- `stock_qty`
- `stock_status`
- `is_in_stock`
- `url_key`
- `thumbnail_url`
- `image_url`
- `media_gallery`
- `category_ids`
- `categories`
- `configurable_options`
- `children`
- `created_at`
- `updated_at`
- `synced_at`

这些字段的核心作用：

- 作为后台可见的 Magento 商品镜像
- 作为排查聚合问题的数据依据
- 为后续搜索、分类映射、内容关联提供基础数据

### 二、Strapi 可维护字段

这类字段属于内容、营销和 SEO 层，应保留在 `product-enrichments` 中。结合 Strapi 当前已落地 schema，现阶段可维护字段至少包括：

- `sku`
- `store_view_code`
- `display_name`
- `subtitle`
- `short_description_html`
- `description_html`
- `base_image`
- `carousel_images`
- `angle_images`
- `videos`
- `promotion_label`
- `promotion_expires_at`
- `is_featured`
- `seo`
- `content_status`
- `content_version`
- `last_synced_at`

这些字段由运营维护，在 Next 聚合时优先于 Magento 对应展示字段；但其中哪些应直接进入前端聚合类型，还需要结合 `prism` 当前读取模型进一步收口。

### 三、前端聚合字段

Next 聚合层输出的展示字段保持现有设计：

- `display_name`
- `short_description_html`
- `description_html`
- `unified_images`
- `unified_thumbnail`
- `promotion_label`
- `promotion_expires_at`
- `is_featured`
- `seo_title`
- `seo_description`

其中以下原则不变：

- 价格、库存、配置选项始终以 Magento 为准
- Strapi 只覆盖内容和展示层字段
- Strapi 不可用时可降级为纯 Magento 数据

---

## 方案对比：SSO 推送 vs Strapi 定时拉取

### 方案 A：SSO → Strapi 推送

含义：

- SSO 作为 Magento 接入层，从 Magento 获取商品数据
- SSO 负责将商品数据推送或 upsert 到 Strapi

优点：

- 更符合当前系统边界，SSO 已掌握 Magento 接入逻辑
- Magento 凭据、接口适配、字段清洗集中在 SSO
- Strapi 保持内容系统角色，不直接理解 Magento 复杂接口

缺点：

- SSO 会额外耦合 Strapi 写入协议
- 同步失败重试、日志、幂等等逻辑会集中到 SSO

适用前提：

- SSO 当前已经稳定封装商品/分类读取接口
- SSO 团队接受“额外承担同步执行器职责”

### 方案 B：Strapi 定时拉取

含义：

- Strapi 定时从 SSO 提供的商品接口拉取 Magento 数据
- Strapi 自己完成镜像层 upsert

优点：

- Strapi 自己掌握入库节奏和模型映射
- 内容模型和入库逻辑离得更近

缺点：

- Strapi 需要理解更多 Magento/SSO 数据结构
- 会让内容系统承担更多同步与数据清洗职责
- 同步逻辑更容易侵入内容平台

适用前提：

- Strapi 侧已有稳定的定时任务机制和数据同步能力
- 希望同步规则强绑定内容模型，而不是绑定 Magento 代理层

### 当前结论

当前不提前锁定最终同步方向。

**1.1 阶段先完成字段与模型设计，再根据 SSO 现有封装深度决定推/拉。**

---

## 推荐执行顺序

### Step 1：先调研 SSO 当前 Magento 对接方式

目标：

- 看 SSO 当前已有哪些商品/分类/库存接口
- 看接口返回了哪些字段，以及字段分别来自 GraphQL 还是库存 REST 能力
- 看是否已经存在后台任务、定时任务或管理接口模式
- 判断 SSO 是否适合作为正式同步执行器

当前调研结论：

- SSO 已提供公开目录代理接口：`GET /api/products`、`GET /api/products/:sku`、`GET /api/categories/tree`、`GET /api/categories/:categoryId`
- 上述商品/分类接口由 `src/routes/magento-catalog.ts` 暴露，底层通过 `src/services/magento-catalog.service.ts` 直接调用 Magento `GraphQL /graphql`
- 商品列表与详情接口基本保持 Magento GraphQL 原生结构，不做深度字段重组；这意味着 `sku`、`name`、`url_key`、`price_range`、`thumbnail`、`categories`、`configurable_options`、`variants`、`media_gallery` 等字段都可直接作为字段边界分析依据
- SSO 另有库存代理接口：`GET /api/inventory/:sku`、`POST /api/inventory/batch`，由 `src/services/magento-inventory.service.ts` 调用 Magento `REST /rest/V1/sso/inventory/*`
- GraphQL 目录接口只返回 `stock_status`，不返回可售数量 `qty`；如果同步方案需要 `stock_qty`、`lowStockThreshold`、`isLowStock`、`backorders`、`manageStock` 等字段，必须额外纳入库存接口
- 当前 SSO 代码中尚未发现商品/分类同步到 Strapi 的正式执行器，但 SSO 已具备稳定的 Magento 接入层、统一错误响应和 Swagger 暴露，具备承接正式同步器的基础

输出：

- 一份 SSO 现状说明
- 一份 SSO 当前可直接复用的商品字段清单

### Step 2：结合 Magento 官方文档整理核心字段

目标：

- 区分哪些字段是 Magento 核心商品字段
- 区分哪些字段只是当前代理层附加字段
- 识别哪些字段适合进入 Strapi 镜像层

输出：

- Magento 商品核心字段候选表
- 字段用途说明

### Step 3：基于现状收口 Strapi 双层模型

目标：

- 复核 `magento-products` 与 `magento-categories` 已落地字段结构
- 复核 `product-enrichments` 已落地字段结构
- 明确哪些字段只读、哪些字段可编辑、哪些字段需要与 `prism` 聚合类型对齐

输出：

- Strapi 当前模型字段清单
- 收口后的字段边界表
- `sku` 关联规则

### Step 4：确认同步方向

在完成前三步后，再决定：

- 由 `SSO` 推送到 `Strapi`
- 还是由 `Strapi` 定时从 `SSO` 拉取

判断标准：

- 哪边更掌握源数据
- 哪边更适合承载定时任务
- 哪边更容易做幂等、重试、日志和告警
- 哪边更不破坏现有系统边界

### Step 5：最后再进入具体实现

实现阶段应发生在：

- 字段边界已确定
- Strapi 模型已确认
- 推/拉方向已决定

之后才开始真正编写同步代码。

---

## 对 `prism` 仓库的影响

### 当前阶段不应该做的事

- 不在 `prism` 中实现正式同步任务
- 不在 `prism` 中设计最终同步执行器
- 不让 `Next.js` 直接承担 Magento 商品同步职责

### 当前阶段可以保留的内容

- `apps/prism/lib/api/unified-product.ts` 继续作为前端聚合层
- `apps/prism/lib/api/strapi/product-enrichment.ts` 继续作为 Strapi 内容层读取入口
- `apps/prism/app/api/admin/catalog-inspect/route.ts` 可继续作为临时字段分析参考
- `apps/prism/app/api/admin/sync/magento-to-strapi/route.ts` 仅作为早期参考，不作为正式方案依据

---

## 后果

### 正面影响

- 先把字段边界和系统职责定清楚，避免过早在错误位置写同步代码
- Strapi 后台能同时承载“Magento 主字段可见”和“内容字段可维护”两类需求
- 保持 `prism` 的职责纯净，不把前端项目变成后台同步执行器

### 负面影响

- 需要跨项目调研 `SSO` 和 `Strapi`，短期内推进速度比直接写代码慢
- 推/拉方向需要在调研后再决定，当前不能一步拍板

### 需要采取的行动

- [ ] 调研 `D:\WORK\Sso` 当前 Magento 对接实现
- [ ] 查阅 Magento 官方商品/分类字段文档
- [x] 确认 Strapi 已完成双层商品模型基础落地
- [ ] 基于现有模型收口最终字段边界
- [ ] 确认同步方向：SSO 推送或 Strapi 拉取
- [ ] 完成正式同步实现

---

## 相关文件

Prism 仓库参考：

- `docs/project-plan.md`
- `docs/architecture/adr-001-product-data-fusion.md`
- `apps/prism/lib/api/unified-product.ts`
- `apps/prism/lib/api/strapi/product-enrichment.ts`
- `apps/prism/lib/api/magento/types.ts`
- `apps/prism/app/api/admin/catalog-inspect/route.ts`
- `apps/prism/app/api/admin/sync/magento-to-strapi/route.ts`
