# PDP Page CMS Phase 2

## Context

当前商品详情页已经具备可复用的区块组件和真实 CMS 组装链路，但真实 SKU 仍主要依赖静态前端结构，只有 `recipes` 和 `blog_posts` 形成了真实 page cms 接入。为了避免 scope 继续膨胀，本阶段不再一次性推进所有营销模块，而是先只完成 `key_points` 和 `guarantees`。

这次工作的目标也不再是单独把 PDP 做得更丰富，而是把 PDP 当成 Page CMS 的第一阶段验证场。要先验证一条稳定链路是否成立：Strapi 配置 -> enrichment 归一化 -> 页面级 CMS 组装 -> 复用现有区块组件渲染。只要这条链路在 PDP 上用 `key_points` / `guarantees` 跑通，下一步就可以更有把握地推进完整的 Pages CMS，让首页、未来活动页、内容营销页都进入同一套 CMS 体系。

同时需要吸取最近一次回归教训：前端过早打开新增 `populate[...]`，会在 Strapi 字段尚未完全落地时直接打挂 `product-enrichment` 请求，连已有 enrichment 数据都丢失。因此第一阶段实现必须优先保证兼容性，避免验证新模块时破坏当前线上可用的数据链路。

## Scope

本次只覆盖 PDP Page CMS 第一阶段验证，不调整以下边界：

- 商品本体字段仍然由 Magento + Strapi enrichment 融合层提供
- 评论列表与评论摘要继续走独立评论接口
- `UnifiedProduct` 仍只代表商品本体，不吸收新的 page cms 区块数据
- 暂不推进 `detail_sections`、`recommended_products`、`cross_sell_addons`、`bundle_deals` 的真实接入

## Design Rules

1. `key_points` 和 `guarantees` 继续被视为 page-level CMS 数据，而不是商品本体字段。
2. PDP 的 page cms 数据直接来自 `fetchProductEnrichment()`，由页面层组装成 `RealProductPageCms`。
3. 真实 PDP 复用 mock 页已经存在的组件接口，不为后端结构单独新增第二套 UI props。
4. 前端以 `apps/prism/app/products/[sku]/mock-data.ts` 中已有结构作为契约参考，避免前后端字段漂移。
5. 第一阶段重点是验证模式，不是追求区块数量；只要 `key_points` / `guarantees` 在真实 SKU 上稳定打通，就说明 Page CMS 机制成立。

## Data Flow

```ts
fetchUnifiedProductBySku(sku) -> 商品本体
fetchProductEnrichment(sku) -> PDP page cms 片段
buildRealProductPageCms(enrichment) -> 页面级 CMS 数据
page.tsx -> 现有区块组件条件渲染
```

## Implementation Points

### 1. Strapi enrichment 类型扩展

文件：`apps/prism/lib/api/strapi/product-enrichment.ts`

本阶段只保留以下扩展：

- `key_points` 原始返回类型
- `guarantees` 原始返回类型
- 对应的前端标准化输出类型
- `normalizeEnrichment()` 中的归一化逻辑

兼容策略：

- 不重新一次性打开其他未落地模块的 `populate[...]`
- 对 `key_points` / `guarantees` 优先采用最小请求改动
- 保持 `fetchProductEnrichment()` 的降级能力，但尽量通过最小化请求风险避免触发整体降级

### 2. Page CMS 内容选择类型收敛

文件：`apps/prism/lib/api/unified-product.ts`

仅保留当前阶段真正要给 PDP CMS 组装函数使用的字段：

- `key_points`
- `guarantees`
- `recipes`
- `blog_posts`

不要把这些字段并入 `UnifiedProduct` 主接口。

### 3. 真实 PDP CMS 组装

文件：`apps/prism/app/products/[sku]/product-detail-data.ts`

- `RealProductPageCms` 只保留：
  - `key_points`
  - `guarantees`
  - `recipes`
  - `blog_posts`
- `buildRealProductPageCms()` 对数组字段做 `?? []` 标准化
- 仅在全部区块都为空时返回 `null`
- `buildPdpSectionNav()` 继续沿用既有逻辑，让 `Features` 导航随着真实 CMS 自动出现

### 4. 页面接入

文件：`apps/prism/app/products/[sku]/page.tsx`

真实 SKU 页面继续并行拉取：

- `fetchUnifiedProductBySku(decodedSku)`
- `fetchProductEnrichment(decodedSku)`
- `fetchReviewSummaryBySku(decodedSku)`
- `fetchReviewsBySku(decodedSku, 1, 10)`

然后按职责分开组装：

- `product` 使用统一商品数据
- `cms` 使用 `buildRealProductPageCms(fetchedEnrichment)`

本阶段页面只验证并渲染：

- `apps/prism/app/products/[sku]/SellingPoints.tsx`
- `apps/prism/app/products/[sku]/ProductGuarantees.tsx`
- 保留既有 `apps/prism/app/products/[sku]/RecipesSection.tsx`
- 保留既有 `apps/prism/app/products/[sku]/BlogSection.tsx`

### 5. 为完整 Pages CMS 铺路

这次实现沉淀的不是“PDP 多了两个模块”，而是先把前端侧准备成可验证状态，并明确接下来要通过 Strapi 落地和真实 SKU 联调来确认以下能力是否成立：

- Strapi 可以驱动真实页面区块
- 页面区块数据可以脱离商品本体独立组装
- 现有 UI 组件可直接复用，不需要为 CMS 页面额外再造一套 props
- 页面导航和区块显隐可以由 CMS 数据自然驱动

只有在 Strapi 侧真正提供 `key_points` / `guarantees` 并完成真实 SKU 手动验证之后，这些结论才算正式成立。届时才适合进入下一步完整的 Pages CMS：把首页、未来活动页、内容营销页纳入统一的“页面数据 -> 页面区块 -> 渲染组件”体系。

## Verification

### Manual Checks

在执行以下页面验证之前，Strapi 侧需要先为某个真实 SKU 提供：

- `key_points[]` with `icon`, `title`, `description`
- `guarantees[]` with `icon`, `title`, `description`

1. 打开一个已配置 `key_points` / `guarantees` 的真实 SKU，确认：

- `SellingPoints` 正常显示
- `ProductGuarantees` 正常显示
- `Features` 导航自动出现

2. 打开只配置其中一个字段的真实 SKU，确认页面只显示对应区块，不出现空容器。

3. 打开未配置这两个字段的真实 SKU，确认页面仍然正常降级。

4. 确认已有的 Strapi enrichment 数据继续正常显示，不因第一阶段接入而丢失。

5. 打开 `/products/JD-AF550`，确认 mock 页面行为不受影响。

6. 验证既有 `recipes` / `blog_posts` 不被这次收敛范围影响。

### Outcome To Record

如果以上验证成立，需要记录这次实现已经确认了以下前提：

- CMS 数据可以独立于商品本体进行页面组装
- 现有区块组件可直接复用
- 小范围试点不会破坏已有 enrichment 数据链路

如果这三点都成立，就可以进入下一阶段：设计完整的 Pages CMS，用于首页、活动页和内容营销页。

## Related Docs

- `docs/development/cms-page-development-guide.md`
- `docs/CMS Page.md`
- `docs/pdp-mock-vs-real.md`
