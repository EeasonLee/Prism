# 商品展示业务规则规范

> 版本：v1.1
> 日期：2026-05-09
> 适用范围：所有商品展示相关组件（卡片、列表、详情）

---

## 一、统一数据模型

所有商品展示相关组件共享同一个数据模型，定义在 `features/product/types.ts`：

```ts
interface UnifiedProductDisplay {
  // === 基础标识 ===
  sku: string; // SKU

  // === 标题体系 ===
  name: string; // 商品标题（PDP 使用）
  short_name: string | null; // 短标题（卡片优先使用）
  longtitle: string | null; // 副标题（卡片、详情通用）
  short_description: string | null; // 买点信息（富文本，需解析后渲染，禁止直接渲染 HTML）

  // === 价格体系 ===
  price: number; // 划线价（原价）
  final_price: number; // 售价（实际售价）
  discount_percent: number | null; // 折扣比例（price 和 final_price 计算，无折扣时为 null）

  // === 优惠券 ===
  cp_code: string | null; // 优惠券码
  cp_label: string | null; // 优惠券名称
  cp_label_color: string | null; // 优惠券活动色（#RRGGBB）
  cp_price: number | null; // 优惠价格（抵扣金额）
  cp_starts_at: string | null; // 优惠券开始时间（ISO 8601）
  cp_expires_at: string | null; // 优惠券结束时间（ISO 8601）

  // === 库存 ===
  is_in_stock: boolean; // 是否有库存

  // === 标签 ===
  best_text: string | null; // 标签文字
  best_color: string | null; // 标签颜色（#RRGGBB，品牌色兜底）

  // === 评价 ===
  rating_summary: number | null; // 评分（0-100）
  review_count: number; // 评论数
  rating_distribution: Record<1 | 2 | 3 | 4 | 5, number> | null; // 1-5 星各有多少评论

  // === 图片 ===
  image: string | null; // 主图 URL

  // === 商品类型 ===
  type_id: string; // simple | configurable | grouped | bundle | downloadable | virtual
  url_key: string | null; // URL 标识
  variant_data: VariantData | null; // 可配置商品变体数据
}
```

### 字段语义对照

| 字段                  | 语义           | 来源                                       |
| --------------------- | -------------- | ------------------------------------------ |
| `name`                | 商品标题       | Magento `name`                             |
| `short_name`          | 短标题         | Magento `display_name` / Strapi            |
| `longtitle`           | 副标题         | Strapi                                     |
| `short_description`   | 买点信息       | Magento `short_description`（HTML）        |
| `price`               | 划线价（原价） | Magento `price`                            |
| `final_price`         | 售价           | Magento `special_price` / `final_price`    |
| `discount_percent`    | 折扣百分比     | 计算值                                     |
| `cp_code`             | 优惠券码       | Magento 自定义属性 `cp_code`               |
| `cp_label`            | 优惠券名称     | Magento 自定义属性 / Meilisearch `cpLabel` |
| `cp_label_color`      | 优惠券活动色   | Meilisearch `cpLabelColor`                 |
| `cp_price`            | 优惠券抵扣金额 | Magento 自定义属性 `cp_price`              |
| `cp_starts_at`        | 优惠券生效时间 | Magento 自定义属性                         |
| `cp_expires_at`       | 优惠券失效时间 | Magento 自定义属性 `cp_date`               |
| `is_in_stock`         | 库存状态       | Magento `stock_status`                     |
| `best_text`           | 标签文字       | Meilisearch / Strapi                       |
| `best_color`          | 标签颜色       | 运营配置                                   |
| `rating_summary`      | 评分 0-100     | 评价系统                                   |
| `review_count`        | 评论总数       | 评价系统                                   |
| `rating_distribution` | 1-5 星分布     | 评价系统                                   |

---

## 二、标题规则

| 场景                | 规则                                                 | 示例                                                                   |
| ------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| **商品卡片**        | 优先使用 `short_name`，无值时 `name` 兜底            | `product.short_name ?? product.name`                                   |
| **PDP 详情页**      | 使用 `name`                                          | 商品完整标题                                                           |
| **卡片/详情副标题** | 使用 `longtitle`                                     | 产品长标题/副标题                                                      |
| **买点信息**        | 使用 `short_description`（富文本），需统一解析后渲染 | 参考 PDP 现有 `SellingPoints` 实现，禁止直接 `dangerouslySetInnerHTML` |

---

## 三、价格规则

| 字段               | 语义                 | 展示方式                                                             |
| ------------------ | -------------------- | -------------------------------------------------------------------- |
| `price`            | 划线价（原价）       | 灰色删除线                                                           |
| `final_price`      | 售价（优惠券抵扣前） | 粗体/品牌色                                                          |
| `discount_percent` | 折扣比例             | `Math.round(((price - final_price) / price) * 100)`%，无折扣时不显示 |

> **优惠券独立计算**：使用优惠券时，实际支付价格 = `final_price - cp_price`。

---

## 四、优惠券规则

优惠券作为**独立模块**处理，需有时效校验。

### 4.1 各场景行为

| 场景             | 行为                                                         |
| ---------------- | ------------------------------------------------------------ |
| **商品卡片**     | 显示优惠券标签（展示抵扣金额），加购时**默认自动使用**优惠券 |
| **PDP 详情**     | 显示优惠券横幅模块，需用户点击交互后启用，加购时使用         |
| **PDP URL 参数** | 支持链接参数控制默认帮用户领取（如 `?coupon=auto`）          |

### 4.2 时效校验

基于 `cp_starts_at` / `cp_expires_at` 判断是否在有效期内：

- 未到 `cp_starts_at`：优惠券不可用，不展示
- 超过 `cp_expires_at`：优惠券已过期，不展示
- 在有效期内：正常展示和使用

### 4.3 加购联动

- 领取后加入购物车时，调用接口自动使用优惠券
- 卡片端：默认自动使用，无需用户交互
- PDP 端：用户点击领取后启用，加购时附带优惠券参数

---

## 五、标签规则

标签**可以同时展示多个**，按顺序排列。每个标签独立判断是否展示：

### 5.1 标签展示条件

| 序号 | 标签类型   | 展示条件                    | 展示内容             |
| ---- | ---------- | --------------------------- | -------------------- |
| 1    | 无库存标签 | `is_in_stock === false`     | "Sold Out"           |
| 2    | 折扣标签   | `discount_percent > 0`      | "-XX%"               |
| 3    | 运营标签   | `best_text` 有值            | `best_text` 原文     |
| 4    | 优惠券标签 | `cp_label` 有效且在有效期内 | 抵扣金额（如 "-$5"） |

> 注意：当 `is_in_stock === false` 时，折扣标签、运营标签、优惠券标签均不展示。

### 5.2 标签颜色规则

每个标签独立取色：

| 标签类型   | 颜色来源                                             |
| ---------- | ---------------------------------------------------- |
| 无库存标签 | 固定样式（灰色/深色）                                |
| 折扣标签   | 固定样式（品牌色 `bg-brand`）                        |
| 运营标签   | `best_color`（运营配置色，如 `#FF6B35`），品牌色兜底 |
| 优惠券标签 | `cp_label_color`（优惠券活动色），品牌色兜底         |

### 5.3 库存对展示的影响

当 `is_in_stock === false` 时：

- 显示 "Sold Out" 标签
- 图片灰度处理
- 加购按钮禁用或隐藏
- 不展示折扣、运营、优惠券标签

---

## 六、商品详情跳转规则

### 6.1 统一跳转函数

所有商品卡片、列表、推荐组件均使用同一个跳转函数，禁止在各处手写 `/products/...` 拼接。

```ts
// features/product/services/product-navigation.ts

interface ProductNavigationOptions {
  /** 是否自动领取优惠券 */
  autoClaimCoupon?: boolean;
  /** 面包屑来源标识（用于记录导航路径） */
  breadcrumbSource?: string;
  /** 是否新标签页打开 */
  openInNewTab?: boolean;
}

/**
 * 构建商品详情页 URL，统一控制优惠券领取、面包屑等参数。
 * 这是项目中唯一生成商品详情 URL 的地方。
 */
function buildProductUrl(
  product: Pick<UnifiedProductDisplay, 'url_key' | 'sku' | 'cp_code'>,
  options?: ProductNavigationOptions
): string;
```

### 6.2 URL 规则

```
/products/{url_key}          # 优先使用 url_key（SEO 友好）
/products/{sku}              # url_key 不存在时 fallback 到 sku

带参数：
/products/{url_key}?coupon=auto          # 自动领取优惠券
/products/{url_key}?breadcrumb=search    # 标记面包屑来源
```

### 6.3 各处使用方式

| 场景         | 调用方式                                                   |
| ------------ | ---------------------------------------------------------- |
| 商品卡片点击 | `buildProductUrl(product)`                                 |
| 搜索建议点击 | `buildProductUrl(product, { breadcrumbSource: 'search' })` |
| 推荐商品点击 | `buildProductUrl(product)`                                 |
| 优惠券跳转   | `buildProductUrl(product, { autoClaimCoupon: true })`      |
| 新标签打开   | `buildProductUrl(product, { openInNewTab: true })`         |

### 6.4 面包屑联动

跳转函数内部调用 `useBreadcrumbStore.track()`，根据 `breadcrumbSource` 记录导航路径：

- `'search'` → Home > Search > Product
- `'category'` → Home > Category > Product
- `'recommendation'` → Home > Product（推荐直接跳，不记录中间路径）
- 未指定 → 保留当前历史不变

### 6.5 禁止事项

- **禁止**在各处手写 `` `/products/${xxx}` `` 拼接 URL
- **禁止**手写 `encodeURIComponent` 处理 sku/url_key
- **禁止**在组件中自行处理优惠券 URL 参数

---

## 七、图片展示规则

| 场景               | 组件             | 宽高比 | 说明                       |
| ------------------ | ---------------- | ------ | -------------------------- |
| 商品卡片（默认）   | `OptimizedImage` | `3/4`  | `object-cover`，懒加载     |
| 商品卡片（正方形） | `OptimizedImage` | `1/1`  | `object-cover`，懒加载     |
| PDP 主图           | `OptimizedImage` | `1/1`  | `object-contain`，优先加载 |
| PDP 缩略图         | `OptimizedImage` | `1/1`  | `object-cover`             |

**错误处理**：图片加载失败时展示占位符（`bg-muted` + "No image" 文字），而非空白区域。

---

## 八、加购按钮行为规则

| 商品类型             | 按钮行为                                         |
| -------------------- | ------------------------------------------------ |
| `simple` / `virtual` | 直接加购，显示数量步进器（购物车已存在时）       |
| `configurable`       | "Select Options" → 打开 `QuickAddModal` 选择规格 |
| `grouped`            | "Select Options" → 跳转 PDP                      |
| `bundle`             | "Select Options" → 跳转 PDP                      |
| `downloadable`       | "Add to Cart" → 直接加购                         |
| 无库存               | 按钮禁用，显示 "Out of Stock"                    |

### 8.1 优惠券联动

- `simple`/`virtual` 加购时，若商品有有效优惠券，自动附带 `coupon_code` 参数
- `configurable` 在 `QuickAddModal` 中完成规格选择后，加购时同样自动附带优惠券

---

## 九、评价展示规则

### 9.1 星级渲染

评分 `rating_summary` 范围为 0-100，转换为 5 星制：

```
starRating = rating_summary / 20           # 0-5 范围
filledStars = Math.floor(starRating)        # 实心星数
halfStar = starRating - filledStars >= 0.5  # 是否有半星
emptyStars = 5 - filledStars - (halfStar ? 1 : 0)
```

### 9.2 展示阈值

| 场景         | 展示条件                                     |
| ------------ | -------------------------------------------- |
| 卡片评价     | `rating_summary != null && review_count > 0` |
| PDP 评价详情 | 始终展示（含星级分布、评论列表）             |
| 无评价       | 不展示星级，不展示评论数                     |

---

## 十、版本历史

| 日期       | 版本 | 变更                                                                                                                               |
| ---------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-09 | v1.0 | 初始版本。定义统一数据模型、标题/价格/优惠券/标签业务规则。                                                                        |
| 2026-05-09 | v1.1 | 标签规则改为可同时展示多个；新增商品详情跳转规则（统一 URL 构建 + 面包屑联动）；新增图片展示规则、加购按钮行为规则、评价展示规则。 |
