# 商品卡片统一化 — 现状分析与实施计划

> 日期：2026-05-09
> 依赖规范：`docs/product-display-rules.md`

---

## 一、现状概览

项目中共有 **6 种商品卡片** + **1 种商品详情** 组件，分布在 3 个层级：

| #   | 组件                   | 文件路径                                               | 使用方                                       | 层级 |
| --- | ---------------------- | ------------------------------------------------------ | -------------------------------------------- | ---- |
| 1   | `ProductCard`          | `features/product/components/ProductCard.tsx`          | `CategoryProductGrid`、`CategoryTemplate`    | L1   |
| 2   | `ProductCardCompact`   | `features/product/components/ProductCardSection.tsx`   | `ProductCarousel`                            | L1   |
| 3   | `CategoryProductCard`  | `features/cms-page/components/CategoryProductCard.tsx` | `CategoryGridClient` → `CategoryGrid`        | L1   |
| 4   | `DealProductCard`      | `features/cms-page/components/DealProductCard.tsx`     | `LazyDealProductBlock` → `DealProductBlocks` | L1   |
| 5   | `FeaturedProductCard`  | `features/cms-page/components/FeaturedProductCard.tsx` | `FeaturedProducts`                           | L1   |
| 6   | `RecommendedProducts`  | `app/products/[slug]/RecommendedProducts.tsx`          | PDP 推荐（内联卡片）                         | L3   |
| 7   | `ProductDetailContent` | `app/products/[slug]/ProductDetailContent.tsx`         | PDP 详情页                                   | L3   |

### 使用关系图

```
CMS 页面系统 (blockMap)
  ├── page.product-carousel    → ProductCarousel    → ProductCardCompact
  ├── page.category-grid       → CategoryGrid        → CategoryGridClient → CategoryProductCard
  ├── page.featured-products   → FeaturedProducts    → FeaturedProductCard
  └── page.deal-product-blocks → DealProductBlocks   → LazyDealProductBlock → DealProductCard

分类页/搜索页
  └── CategoryProductGrid      → ProductCard         → QuickAddModal

PDP
  └── ProductDetailContent     → RecommendedProducts (内联卡片)
                               → UpsellProductsSection (内联卡片)
```

### CMS 区块注册情况

所有 4 种卡片均通过 `blockMap`（`features/cms-page/components/blockMap.tsx`）注册为 CMS Section。**目前没有完全未使用的卡片组件**，但存在大量重复逻辑。

---

## 二、差异分析

### 2.1 各卡片功能对比

| 维度           | ProductCard（主力）                          | ProductCardCompact            | CategoryProductCard    | DealProductCard         | FeaturedProductCard                          |
| -------------- | -------------------------------------------- | ----------------------------- | ---------------------- | ----------------------- | -------------------------------------------- |
| **布局**       | 纵向，图片上方                               | 纵向 + 渐变覆盖层             | 纵向，图片上方         | 纵向，图片上方          | **横向**，左图右文                           |
| **图片比例**   | `aspect-[3/4]`                               | `aspect-[3/4]`                | `aspect-square`        | `aspect-square`         | `aspect-square`（左 1/3）                    |
| **标题**       | `displayName` 2 行截断                       | `displayName`/`name` 1 行截断 | `name` 2 行截断        | `displayName` 2 行截断  | `displayName` + `longTitle` + selling points |
| **标签**       | cpLabel+cpLabelColor / promotionLabel / Sale | 硬编码 "Sale"                 | 父组件传入 badge+style | 硬编码 "Sale"           | promotionLabel（bg-ink）                     |
| **价格**       | 现价 + 划线原价                              | 现价 + 划线原价（白色）       | 现价 + tagline 划线    | 现价 + 划线原价         | 现价（brand 色）+ 原价 + Save%               |
| **折扣**       | hasDiscount 判断                             | hasDiscount → "Sale"          | 父组件判断             | hasDiscount → "Sale"    | discount 百分比药丸                          |
| **缺货**       | 覆盖层 + 灰度                                | 无处理                        | 无处理                 | 覆盖层 + "Out of Stock" | 无处理                                       |
| **评价**       | 5 星 SVG + 半星                              | 无                            | lucide Star + 数字     | 无                      | 无                                           |
| **加购**       | 步进器 / QuickAddModal                       | hover 圆形按钮                | 无（整卡链接）         | AddToCartButton         | AddToCartButton（z-10）                      |
| **优惠券感知** | 无                                           | 无                            | 无                     | 无                      | 无                                           |

### 2.2 差异本质

**6 种卡片是同一组数据的不同 UI 表达**，差异仅在：

1. 布局方向（纵向 / 横向）
2. 信息密度（紧凑 / 完整）
3. 交互方式（hover 按钮 / 常驻按钮 / 纯链接）

### 2.3 标签实现不一致

| 组件                  | 标签来源                            | 样式方案                           | 符合规范？ |
| --------------------- | ----------------------------------- | ---------------------------------- | ---------- |
| `ProductCard`         | `cpLabel` + `cpLabelColor`          | 动态 backgroundColor + WCAG 对比色 | 部分符合   |
| `ProductCardCompact`  | 硬编码 `"Sale"`                     | `bg-brand` 或 `bg-ink`             | ❌         |
| `CategoryProductCard` | 父组件传入 `badge` + `badgeStyle`   | brand/dark/light 三选一            | ❌         |
| `DealProductCard`     | 硬编码 `"Sale"`                     | `bg-brand text-white`              | ❌         |
| `FeaturedProductCard` | `promotionLabel`                    | `bg-ink text-white`                | ❌         |
| `RecommendedProducts` | `product.badge`                     | `bg-brand`                         | ❌         |
| PDP Detail            | `displayPromotionLabel`（变体感知） | `bg-brand` 药丸 / info 框          | 部分符合   |

### 2.4 价格处理不一致

**formatPrice 使用不统一**：`ProductDetailContent.tsx` 自行创建 `Intl.NumberFormat`（第 388-396 行），未使用共享的 `formatPrice()`。其他 23 处调用均使用 `@prism/shared`。

**折扣判断逻辑不统一**：

| 组件                   | 判断逻辑                                            | 数据来源          |
| ---------------------- | --------------------------------------------------- | ----------------- |
| `ProductCard`          | `originalPrice > priceValue`                        | `ProductCardItem` |
| `ProductDetailContent` | `specialPrice != null && specialPrice < price`      | `UnifiedProduct`  |
| `FeaturedProducts`     | `Math.round(((original - price) / original) * 100)` | `ProductCardItem` |

---

## 三、类型碎片化

存在 **5 种不同的商品数据类型**：

| 类型                      | 定义位置                                               | 用途                 |
| ------------------------- | ------------------------------------------------------ | -------------------- |
| `ProductCardItem`         | `features/product/bff-types.ts`                        | BFF 卡片数据         |
| `UnifiedProduct`          | `features/product/api/unified.api.ts`                  | 统一商品详情         |
| `ProductListItem`         | `features/product/services/product.mapper.ts`          | 映射层轻量列表项     |
| `FeaturedProductCardData` | `features/cms-page/components/FeaturedProductCard.tsx` | **内联定义，不规范** |
| `RecommendedProduct`      | `features/product/bff-types.ts`                        | PDP 推荐             |

同一语义用不同字段名：`price.value` vs `special_price` vs `price`；`cpLabel` vs `promotion_label` vs `badge`。

---

## 四、优惠券处理现状

`cp_code`、`cp_price`、`cp_date` 的处理**仅存在于 `ProductDetailContent.tsx`**：

- 优惠券横幅（`bg-destructive` 红色背景）
- `normalizeCpPrice()` 数字转换
- 优惠后价格计算
- 复制到剪贴板 + Toast 提示

**缺失**：所有 6 种卡片组件对优惠券字段完全无感知，无时效校验，无卡片端"加购自动用券"逻辑。

---

## 五、问题根因

**没有统一的"商品展示模型"**。每个组件各自从不同数据源取字段，各自实现展示逻辑。

1. 标签数据流断裂：`cpLabel`/`cpLabelColor` 只有 `ProductCard` 在消费
2. 价格字段命名不统一：`special_price` vs `specialPrice` vs `price.value`
3. 优惠券数据仅停留在 PDP 聚合层
4. 展示逻辑重复：6 个组件各写一套"判断折扣 → 展示标签 → 展示价格"
5. `FeaturedProductCardData` 内联在组件文件中

---

## 六、实施方案

### 总体策略

```
Phase 1：定义统一数据模型    →  UnifiedProductDisplay 类型 + display-mapper.ts
Phase 2：提取共享渲染组件    →  ProductLabel、ProductPrice、CouponBanner
Phase 3：合并卡片组件        →  ProductCard 统一组件（variant 驱动），删除旧组件
Phase 4：优惠券模块独立化    →  useCoupon hook + 加购自动用券 + URL 参数领券
Phase 5：数据源适配          →  各 BFF/API 层统一映射到 UnifiedProductDisplay
```

### 目标架构

```
                    ┌──────────────────────────────┐
                    │      数据源（后端）             │
                    └──────────┬───────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
        catalog.api.ts  meilisearch.repo.ts  content.api.ts
              │                │                 │
              └────────────────┼─────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │  display-mapper.ts   │  ← 新建
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │ UnifiedProductDisplay │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
        ProductLabel     ProductPrice      CouponBanner    ← 共享渲染组件
              │                │                 │
              └────────────────┼─────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │    ProductCard       │  ← 统一卡片（variant 驱动 UI）
                    └─────────────────────┘
```

### 6.1 Phase 1：统一数据模型

在 `features/product/types.ts` 定义 `UnifiedProductDisplay`（见 `docs/product-display-rules.md`），新增 `features/product/services/display-mapper.ts`：

```ts
// 映射函数
function mapCardItemToDisplay(item: ProductCardItem): UnifiedProductDisplay;
function mapUnifiedToDisplay(product: UnifiedProduct): UnifiedProductDisplay;

// 计算折扣百分比（纯函数）
function computeDiscountPercent(
  price: number,
  finalPrice: number
): number | null;

// 解析富文本 short_description
function parseShortDescription(html: string | null): string | null;
```

### 6.2 Phase 2：提取共享渲染组件

新建 3 个组件，放在 `features/product/components/`：

**`ProductLabel`** — 统一标签渲染，实现标签优先级链（缺货 → 折扣 → best_text → 优惠券）。

**`ProductPrice`** — 统一价格渲染（现价 + 划线原价 + 折扣百分比/Save 徽章），通过 `size` 变体控制尺寸。

**`CouponBanner`** — 从 PDP `ProductDetailContent.tsx` 提取，独立为可复用模块，支持时效校验、领取、自动领券。

### 6.3 Phase 3：合并卡片组件

统一 `ProductCard` 通过 `variant` 控制 UI 差异：

```ts
type ProductCardVariant =
  | 'default' // 分类页/搜索页主力卡片
  | 'compact' // 轮播紧凑卡片（原 ProductCardCompact）
  | 'deal' // 专题页卡片（原 DealProductCard）
  | 'featured' // 首页精选横向卡片（原 FeaturedProductCard）
  | 'category' // CMS 分类网格卡片（原 CategoryProductCard）
  | 'recommended'; // PDP 推荐卡片（原 RecommendedProducts 内联）
```

各 variant 视觉差异（CVA 驱动）：

| variant       | 布局            | 图片比例       | 加购                  | 评价        | 额外信息                 |
| ------------- | --------------- | -------------- | --------------------- | ----------- | ------------------------ |
| `default`     | 纵向            | 3/4            | 步进器/QuickAddModal  | 5 星        | —                        |
| `compact`     | 纵向+渐变覆盖层 | 3/4            | hover 圆形按钮        | 无          | —                        |
| `deal`        | 纵向            | square         | AddToCartButton 常驻  | 无          | —                        |
| `featured`    | 横向            | square(左 1/3) | AddToCartButton(z-10) | 无          | longtitle+selling points |
| `category`    | 纵向            | square         | 无(整卡链接)          | lucide Star | 颜色色块                 |
| `recommended` | 纵向            | 3/4            | 无                    | 无          | —                        |

### 6.4 Phase 4：优惠券模块独立化

新增 `features/product/hooks/useCoupon.ts`：

- 时效校验（`cp_starts_at` / `cp_expires_at`）
- 领取状态管理
- 加购时自动附带优惠券参数
- PDP URL 参数 `?coupon=auto` 自动领取

### 6.5 Phase 5：数据源适配

各 BFF/API 层统一输出 `UnifiedProductDisplay`：

- `query-facade.ts` → 映射 Meilisearch 结果
- `product.mapper.ts` → 映射 Magento REST 结果
- `unified.api.ts` → 映射 GraphQL 结果
- `detail.bff.ts` → PDP 聚合数据

---

## 七、改动范围

### 新建文件

| 文件                | 位置                           | 说明                      |
| ------------------- | ------------------------------ | ------------------------- |
| `ProductLabel.tsx`  | `features/product/components/` | 统一标签渲染              |
| `ProductPrice.tsx`  | `features/product/components/` | 统一价格渲染              |
| `CouponBanner.tsx`  | `features/product/components/` | 优惠券横幅（从 PDP 提取） |
| `useCoupon.ts`      | `features/product/hooks/`      | 优惠券状态管理            |
| `display-mapper.ts` | `features/product/services/`   | 统一展示映射              |

### 修改文件

| 文件                        | 说明                                     |
| --------------------------- | ---------------------------------------- |
| `ProductCard.tsx`           | 重写为 variant 驱动的统一组件            |
| `ProductDetailContent.tsx`  | 改用 `formatPrice`、改用 `CouponBanner`  |
| `CategoryGridClient.tsx`    | 改用 `ProductCard variant='category'`    |
| `ProductCarousel.tsx`       | 改用 `ProductCard variant='compact'`     |
| `FeaturedProducts.tsx`      | 改用 `ProductCard variant='featured'`    |
| `LazyDealProductBlock.tsx`  | 改用 `ProductCard variant='deal'`        |
| `RecommendedProducts.tsx`   | 改用 `ProductCard variant='recommended'` |
| `UpsellProductsSection.tsx` | 改用 `ProductCard`                       |
| `AddToCartButton.tsx`       | 增加优惠券参数支持                       |
| `bff-types.ts`              | 补充新字段                               |
| `types.ts`（product）       | 新增 `UnifiedProductDisplay`             |
| `query-facade.ts`           | 输出映射到 `UnifiedProductDisplay`       |
| `product.mapper.ts`         | 输出映射到 `UnifiedProductDisplay`       |
| `detail.bff.ts`             | 输出映射到 `UnifiedProductDisplay`       |

### 删除文件

| 文件                                                   | 原因                                                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `features/product/components/ProductCardSection.tsx`   | 合并到 `ProductCard variant='compact'`                                             |
| `features/cms-page/components/CategoryProductCard.tsx` | 合并到 `ProductCard variant='category'`                                            |
| `features/cms-page/components/DealProductCard.tsx`     | 合并到 `ProductCard variant='deal'`                                                |
| `features/cms-page/components/FeaturedProductCard.tsx` | 合并到 `ProductCard variant='featured'`；`FeaturedProductCardData` 移入 `types.ts` |

### 导出更新

| 文件                         | 变更                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `features/product/index.ts`  | 移除 `ProductCardCompact`，新增 `ProductLabel`、`ProductPrice`、`CouponBanner` |
| `features/cms-page/index.ts` | 移除卡片相关导出（如有）                                                       |

---

## 八、版本历史

| 日期       | 版本 | 变更                                                     |
| ---------- | ---- | -------------------------------------------------------- |
| 2026-05-09 | v1.0 | 初始版本。现状分析、差异对比、问题根因、分阶段实施计划。 |
