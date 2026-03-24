# 商品详情页实现说明

## 1. 文档目的

本文档描述当前 Prism 商品详情页（PDP）的实际实现方式，重点说明以下问题：

- 页面入口如何取数和组装数据
- Magento 与 Strapi 商品数据如何融合
- 页面顶部商品信息为什么拆成客户端组件
- configurable 商品如何在页面内本地切换 child variant
- 为什么需要保留 `?variant=...`，同时又避免整页重新请求
- 评论、食谱、博客等区块各自走哪条数据链路

本文档描述的是当前代码状态，不是阶段性方案文档。

## 2. 关键文件

### 页面入口与组装

- `apps/prism/app/products/[sku]/page.tsx`
- `apps/prism/app/products/[sku]/product-detail-data.ts`
- `apps/prism/app/products/[sku]/mock-data.ts`

### 商品主信息区

- `apps/prism/app/products/[sku]/ProductDetailContent.tsx`
- `apps/prism/app/products/[sku]/ProductDetailClient.tsx`
- `apps/prism/app/products/[sku]/ProductImageGallery.tsx`

### 内容与数据来源

- `apps/prism/lib/api/unified-product.ts`
- `apps/prism/lib/api/magento/types.ts`
- `apps/prism/lib/api/strapi/reviews.ts`

### 页面区块

- `apps/prism/app/products/[sku]/SellingPoints.tsx`
- `apps/prism/app/products/[sku]/ProductGuarantees.tsx`
- `apps/prism/app/products/[sku]/ProductReviews.tsx`
- `apps/prism/app/products/[sku]/RecipesSection.tsx`
- `apps/prism/app/products/[sku]/BlogSection.tsx`
- `apps/prism/app/products/[sku]/ProductSectionNav.tsx`

## 3. 页面职责划分

当前 PDP 的职责是分三层的：

1. `page.tsx`
   负责服务端取数、mock/真实 SKU 分流、评论首屏数据准备、锚点导航和页面区块拼装。
2. `ProductDetailContent.tsx`
   负责顶部商品主信息区的客户端展示状态，包括图片、SKU、库存、价格、促销、短描述、加购入口。
3. `ProductDetailClient.tsx`
   负责不同商品类型的购买交互逻辑，尤其是 configurable / grouped / bundle / downloadable 的选项与加购参数生成。

这样拆分的原因很直接：

- 页面级数据仍然适合在 Server Component 里并发获取。
- configurable child variant 切换属于页面内本地状态，不应该变成整页重新导航。
- 页面顶部展示区需要随着本地 variant 变化立即更新，所以不能继续完全依赖服务端 `product` 的静态渲染结果。

## 4. 服务端数据流

真实 SKU 下，`page.tsx` 以 `fetchUnifiedProductBySku(decodedSku)` 作为商品本体的唯一入口。

数据流如下：

```ts
fetchUnifiedProductBySku(sku)
  -> Promise.all([
       fetchProductBySku(sku),
       fetchProductEnrichment(sku).catch(() => undefined),
     ])
  -> mergeProduct(magento, enrichment)
  -> UnifiedProduct
```

然后页面层再并发获取评论数据：

```ts
Promise.all([
  fetchUnifiedProductBySku(decodedSku),
  fetchReviewSummaryBySku(decodedSku),
  fetchReviewsBySku(decodedSku, 1, 10),
])
```

其中：

- `fetchUnifiedProductBySku()` 提供商品本体和已融合内容字段
- `fetchReviewSummaryBySku()` 提供评分汇总
- `fetchReviewsBySku()` 提供评论首屏列表

### 4.1 这样做的核心原则

- 商品本体只走一个统一入口，避免页面层再单独打一轮 enrichment 请求。
- 评论继续走独立接口，不混进 `UnifiedProduct`。
- 首屏评论在服务端准备，后续分页在客户端按需请求。

### 4.2 Mock SKU 与真实 SKU 分流

`page.tsx` 保留对 `MOCK_PRODUCT_SKU` 的特殊处理：

- mock SKU 直接使用 `mockProduct` 和 `mockProductExtras`
- 真实 SKU 走 Magento + Strapi + reviews 的真实接口

这样做的作用是：

- 保留原型页作为字段参考和 UI 回归基线
- 不让真实数据链路的异常影响 mock 演示页

## 5. UnifiedProduct 融合模型

`apps/prism/lib/api/unified-product.ts` 是 PDP 商品数据的核心融合层。

### 5.1 融合原则

- Magento 保留商业核心字段：价格、库存、配置选项、商品类型、children 等
- Strapi 提供展示与内容字段：展示名、副标题、富文本、营销标签、SEO、recipes、blog_posts 等
- Strapi 失败时静默降级，只返回 Magento 数据，不让 PDP 整体不可用

### 5.2 PDP 当前主要使用的融合字段

- `display_name`
- `subtitle`
- `short_description_html`
- `description_html`
- `product_detail_html`
- `unified_images`
- `promotion_label`
- `seo_title`
- `seo_description`
- `recipes`
- `blog_posts`

### 5.3 为什么 `recipes` / `blog_posts` 也放在融合结果里

当前实现里，PDP 页面 CMS 的第一层目标不是做一个完整 Page Builder，而是把和商品强绑定的内容块稳定接到页面上。

因此页面层不再额外请求一次 enrichment 来拿这些字段，而是直接从 `UnifiedProduct` 中读取：

- `buildRealProductPageCms(fetchedProduct)`

这样可以把“商品本体 + 页面内容片段”统一收口到一个商品详情入口里，减少重复请求和页面层分叉逻辑。

## 6. 页面 CMS 与区块拼装

`apps/prism/app/products/[sku]/product-detail-data.ts` 负责把当前 PDP 需要的页面区块数据裁成一个轻量结构。

### 6.1 当前保留的页面 CMS 字段

`RealProductPageCms` 只保留：

- `key_points`
- `guarantees`
- `recipes`
- `blog_posts`

`buildRealProductPageCms()` 的职责很简单：

- 从 `UnifiedProduct` 或 `UnifiedProductContent` 中读取字段
- 对空值做 `?? []` 标准化
- 如果全部为空则返回 `null`

### 6.2 页面锚点导航生成规则

`buildPdpSectionNav()` 会根据真实存在的区块决定是否显示导航项：

- 有 `key_points` 或 `guarantees` 时显示 `Features`
- 有 `product_detail_html` 或 mock `detail_sections` 时显示 `Details`
- 有评论上下文时显示 `Reviews`
- 有 recipes 时显示 `Recipes`
- 有 blog posts 时显示 `Blog`

这意味着导航不是写死的，而是由实际页面内容驱动。

## 7. 为什么顶部主信息区改成客户端组件

早期实现里，PDP 顶部区域直接在 `page.tsx` 中用服务端 `product` 渲染。这种写法有一个明显问题：

- configurable 商品切换 child variant 后，选项虽然变了，但页面顶部的 SKU、库存、价格、图片仍停留在父商品数据上。

为了让变体切换变成真正的“页面内状态变化”，当前实现把顶部主信息区抽成 `ProductDetailContent.tsx`，并改成客户端组件。

### 7.1 `ProductDetailContent.tsx` 的职责

它负责：

- 接收服务端已经准备好的 `product`
- 接收初始 gallery、评分和评论数量
- 持有当前页面内的 `selection` 状态
- 根据选中的 child variant 派生出当前真正应该展示的商品信息

这个组件不负责解析 configurable 规则本身，只负责消费 `ProductDetailClient` 回传的选中结果。

## 8. Configurable 商品本地切换模型

当前 configurable 的核心原则是：

- 路径 `/products/[sku]` 代表当前 PDP 的父商品
- `?variant=...` 只是这个页面里的本地选中状态表达
- 切换 variant 不应该触发整页数据重新获取
- 但 URL 里仍要保留 `?variant=...`，用于分享和回填高亮状态

### 8.1 `ProductDetailClient.tsx` 里 configurable 的职责

`ConfigurableOptions` 负责：

- 读取 configurable options
- 读取 `product.children`
- 根据当前 `selectedAttributes` 找出匹配 child SKU
- 根据 `?variant=...` 反推出一组选项值
- 生成 Magento configurable 加购所需的 `super_attribute`
- 把当前选中的 child variant 通过 `onSelectionChange` 回传给上层

### 8.2 从 URL 到选项状态

组件通过 `useSearchParams()` 读取：

```ts
const variantSku = searchParams?.get('variant') ?? null;
```

然后在 effect 中把 `variantSku` 转回选项值：

- `findAttributesBySku(childSku)` 根据 child 的 attributes 找到每个 configurable option 对应的 `value_index`
- 只有当当前状态和目标状态真的不同，才更新 `selectedAttributes`

这一步的作用是：

- 用户直接打开带 `?variant=CHILD-SKU` 的链接时，页面可以自动高亮对应选项
- 页面内同步 URL 后，刷新页面也能恢复同一组选择

### 8.3 从选项状态到 URL

当所有必选属性都选完后，组件会用 `findChildSku(selectedAttributes)` 算出目标 child SKU。

如果目标 SKU 与当前 `variantSku` 不同，则只更新浏览器地址栏：

```ts
window.history.replaceState(window.history.state, '', nextUrl);
```

这里故意没有使用 `router.replace()`。

原因是：

- `router.replace()` 在 App Router 下会把查询参数变化视作一次导航
- 对 PDP 这种 Server Component 页面来说，这会重新触发服务端执行
- 一旦叠加客户端 effect，同一个页面内快速切换就可能出现请求放大甚至循环

`window.history.replaceState()` 只改 URL，不触发 Next 页面导航，所以它更符合“页面内状态同步”的真实语义。

## 9. 顶部展示如何跟随 child variant 本地变化

`ProductDetailContent.tsx` 通过 `selection` 派生 `displayProduct`。

逻辑是：

- 非 configurable 商品，直接使用父商品数据
- configurable 商品但还没选全属性，也继续展示父商品数据
- configurable 商品且属性已选全，则优先使用选中的 child variant 数据

当前随 child variant 本地变化的字段包括：

- `SKU`
- `price`
- `specialPrice`
- `stockQty`
- `isInStock`
- `images`（仅当 child 自身带 `media_gallery` 时）

### 9.1 为什么不是所有文案都跟着 child 变

当前实现只切换“强商业字段”和可直接来自 child 的展示字段：

- 价格
- 库存
- SKU
- 图片

而这些字段以外的内容仍沿用父商品：

- `display_name`
- `subtitle`
- `promotion_label`
- `short_description_html`
- `description_html`

原因是当前 Magento child 数据里并没有一套完整、稳定、适合直接替换页面文案的内容字段。现阶段最稳妥的做法是：

- 商品介绍仍以父 PDP 内容为准
- 只把真正与 child 强绑定的字段做本地切换

## 10. 加购参数如何生成

不同商品类型由 `ProductDetailClient.tsx` 分支处理。

### 10.1 Simple / Virtual

- 只管理数量
- 直接用 `product.sku` 加购

### 10.2 Configurable

- 只有所有属性都选全时才允许加购
- `productOptionsJson` 结构为：

```json
{
  "super_attribute": {
    "<attribute_id>": <value_index>
  }
}
```

- 加购时使用 `selectedChild?.sku ?? product.sku`

这表示：

- 未选全时按钮禁用
- 选全后真正提交的是 child SKU，而不是父 SKU

### 10.3 Grouped

- 为每个子商品单独维护数量
- 用 `super_group` 构造加购参数

### 10.4 Bundle

- 分开管理单选、多选和 option qty
- 用 `bundle_option` 和 `bundle_option_qty` 生成参数

### 10.5 Downloadable

- 可选下载项时生成 `links` 参数
- 免费样本用外链预览

## 11. 评论区实现

评论区在 `apps/prism/app/products/[sku]/ProductReviews.tsx` 中实现。

### 11.1 首屏策略

首屏评论数据由服务端在 `page.tsx` 中并发准备：

- `summary`
- `initialReviews`
- `initialPagination`

这样可以保证：

- 首屏有完整评分汇总
- 评论列表首屏可直接 SSR/流式输出
- 页面导航里的评论数也能同步展示

### 11.2 分页策略

分页属于客户端行为，组件内部通过：

```ts
fetch(`/api/reviews/${encodeURIComponent(sku)}?...`)
```

继续按页拉取。

这样拆开的好处是：

- 首屏更完整
- 后续翻页不需要整页刷新
- 评论接口仍保持独立边界，不污染商品融合层

## 12. 食谱和博客区块

当前 PDP 的 recipes 和 blog 不是单独在页面层再次拉 enrichment，而是直接复用 `UnifiedProduct` 中已经融合好的：

- `recipes`
- `blog_posts`

页面层会先通过 `buildRealProductPageCms()` 归一化，再决定是否渲染：

- `RecipesSection`
- `BlogSection`

这两块的特点是：

- 都是展示型区块
- 无页面内交互状态
- 是否出现由内容是否存在决定

## 13. 请求边界与当前实现约束

### 13.1 当前已经明确避免的重复请求

当前实现已经把商品本体入口收敛为：

- `fetchUnifiedProductBySku()`

页面层不再单独对同一 SKU 再打一轮 enrichment 请求来组装页面 CMS。

同时，configurable 的 URL 同步也不再通过 Next 路由导航触发，因此 variant 切换不应该再引发整页 PDP 服务端重新执行。

### 13.2 仍然保留的合理边界

以下请求仍然独立存在，这是有意为之：

- 商品本体：Magento + Strapi enrichment 融合
- 评论汇总：reviews summary API
- 评论列表：reviews list API
- 评论翻页：客户端按需请求 `/api/reviews/[sku]`

原因是这些数据更新频率、缓存边界和失败处理策略都不同，不适合强行混成一个接口。

## 14. `generateMetadata()` 的策略

当前 `page.tsx` 中：

- mock SKU 使用 mock 数据生成 SEO 标题和描述
- 真实 SKU 返回保守默认值，不在 metadata 阶段再次触发统一商品请求

这样做的原因是避免 metadata 和页面渲染对同一 SKU 各自再跑一遍完整商品详情链路，导致服务端重复请求放大。

## 15. 手动验证建议

建议重点验证以下几组场景：

1. 真实 simple 商品
- 页面首屏正常展示商品主信息
- 价格、库存、评论、recipes、blog 区块正常

2. 真实 configurable 商品
- 带 `?variant=...` 直接打开时，选项能自动高亮
- 顶部 SKU、价格、库存能跟着 child variant 本地变化
- 如果 child 带图片，主图和缩略图会切到 child 图集
- 地址栏 `?variant=...` 会同步变化，但不会触发整页重新请求

3. configurable 快速切换
- 连续切换选项时，没有持续重复请求
- 没有 `router.replace` 导致的导航循环
- 最终加购使用的是 child SKU

4. 评论区
- 首屏展示 summary 和 initial reviews
- 翻页时只刷新评论列表，不影响整页其他区块

5. mock SKU
- `/products/JD-AF550` 仍保持原型页行为，不受真实链路影响

## 16. 后续演进方向

当前实现已经把 PDP 的几个核心边界理顺了：

- 商品本体统一入口
- 页面内容区块按需组装
- configurable variant 本地切换
- URL 可分享但不触发整页导航

后续如果要继续演进，合理方向通常是：

- 补齐真实商品的 metadata 方案，但避免再次引入重复请求
- 在 child 数据更完整时，再评估是否让标题或部分文案跟随 variant 切换
- 继续把 PDP 区块模型沉淀成可复用的页面内容组装模式

## 17. 相关文档

- `docs/project-plan.md`
- `docs/development/pdp-page-cms-phase-2.md`
- `docs/architecture/adr-001-product-data-fusion.md`
