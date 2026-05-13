# 优惠券领取 + 加购自动应用 设计说明

> 日期：2026-05-12
> 参考：docs/product-display-rules.md 第四章、第八章

---

## 一、需求概述

将 PDP 优惠券从"点击复制券码"改为"点击领取"，领取后加购时自动应用优惠券。

### 用户故事

1. 用户在 PDP 看到优惠券横幅，点击 "Claim" 按钮领取优惠券
2. 用户添加商品到购物车时，已领取的优惠券自动应用
3. 用户刷新页面或再次访问该 PDP，看到优惠券已显示为 "Claimed"
4. 通过 `?coupon=auto` URL 参数进入 PDP 时，优惠券自动领取
5. 商品卡片（simple/virtual）加购时，商品自带优惠券自动应用

---

## 二、技术方案

### 2.1 领取存储

使用 `localStorage` 持久化已领取的优惠券：

- **Key**: `claimed_coupons`
- **格式**: `Record<string, string>` — `{ [sku]: couponCode }`
- **有效期联查**: 读取时与当前商品 `cp_expires_at` 校验，过期自动清除

### 2.2 新增文件

| 文件                                         | 说明                    |
| -------------------------------------------- | ----------------------- |
| `features/product/hooks/use-coupon-claim.ts` | 优惠券领取状态管理 hook |

#### useCouponClaim hook

```ts
interface UseCouponClaimOptions {
  /** 商品 SKU */
  sku: string;
  /** 优惠券码 */
  cpCode: string | null;
  /** 优惠券是否在有效期内（外部已算好） */
  isCouponValid: boolean;
}

interface UseCouponClaimResult {
  /** 该 SKU 是否已领取 */
  isClaimed: boolean;
  /** 已领取的优惠券码（已领取时返回，否则 null） */
  claimedCode: string | null;
  /** 执行领取 */
  claim: () => void;
}
```

行为：

- mount 时从 localStorage 读取，校验 `isCouponValid`，过期则清除
- `claim()` 写入 localStorage `{ [sku]: cpCode }`
- `isCouponValid` 变为 false 时自动清除

### 2.3 修改文件

#### CouponBanner.tsx

| 变更       | 说明                                                          |
| ---------- | ------------------------------------------------------------- |
| 新增 props | `isClaimed: boolean`、`onClaim: () => void`                   |
| 按钮文字   | 未领取 → "Claim coupon"，已领取 → "Claimed"                   |
| 按钮行为   | 调用 `onClaim` 回调（由父组件通过 useCouponClaim.claim 提供） |
| 移除功能   | 剪贴板复制逻辑、Copied toast（compact 变体同步移除）          |

#### ProductDetailContent.tsx

| 变更                | 说明                                                |
| ------------------- | --------------------------------------------------- |
| 读取 URL 参数       | 用 `useSearchParams` 读取 `?coupon=auto`            |
| 引入 useCouponClaim | 管理当前商品的优惠券领取状态                        |
| 自动领取            | `coupon=auto` 且优惠券有效 → mount 时自动 `claim()` |
| 向下传递            | 将 `claimedCode` 传给 `ProductDetailClient`         |

#### ProductDetailClient.tsx

| 变更                | 说明                                                            |
| ------------------- | --------------------------------------------------------------- |
| 新增 prop           | `claimedCouponCode?: string \| null`                            |
| SimpleOptions       | 接收并传给 `AddToCartButton`                                    |
| ConfigurableOptions | 接收，结合变体选择后的 `effectiveCpCode` 传给 `AddToCartButton` |
| 其他类型            | grouped/bundle/downloadable 不涉及优惠券，忽略                  |

#### AddToCartButton.tsx

| 变更       | 说明                                                                       |
| ---------- | -------------------------------------------------------------------------- |
| 新增 prop  | `couponCode?: string \| null`                                              |
| 加购后行为 | `addItemToCart` 成功后，若有 `couponCode` 则调用 `applyCoupon(couponCode)` |
| 错误处理   | `applyCoupon` 失败时静默忽略（不阻断加购流程，不显示错误）                 |

#### ProductCard.tsx

| 变更       | 说明                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 加购联动   | `addSimpleProduct` / `handleCartAction` 中，若 `product.cp_code` 有效且商品为 simple/virtual，加购成功后调用 `applyCoupon(product.cp_code)` |
| 无用户交互 | 卡片端默认自动使用，无需领取步骤                                                                                                            |

#### QuickAddModal.tsx

| 变更       | 说明                                       |
| ---------- | ------------------------------------------ |
| 新增 prop  | `couponCode?: string \| null`              |
| 加购后行为 | 同 AddToCartButton，成功后自动 applyCoupon |

### 2.4 不被修改的文件

- `AddCartItemParams` / `cart-bff.service.ts` — 不变，优惠券通过独立的 `applyCoupon()` API 应用
- `cart.context.tsx` / `use-add-to-cart-action.ts` — 不变，applyCoupon 在调用方处理

---

## 三、数据流

```
┌─ PDP 页面加载 ─────────────────────────────────────────────────┐
│                                                                  │
│  ProductDetailContent                                           │
│    ├─ useCouponClaim(sku, cpCode, isCouponValid)                │
│    │   ├─ localStorage.getItem('claimed_coupons')                │
│    │   ├─ 校验 isCouponValid → 过期则清除                        │
│    │   └─ 返回 { isClaimed, claimedCode, claim }                │
│    │                                                            │
│    ├─ useSearchParams → coupon=auto ?                           │
│    │   └─ YES + isCouponValid → claim()                         │
│    │                                                            │
│    └─ CouponBanner                                              │
│        ├─ isClaimed={isClaimed}                                 │
│        └─ onClaim={claim}                                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌─ 加购流程 ──────────────────────────────────────────────────────┐
│                                                                  │
│  AddToCartButton                                                │
│    ├─ useAddToCartAction.addItemToCart({ sku, qty })            │
│    ├─ 成功 → if (couponCode) applyCoupon(couponCode)            │
│    └─ applyCoupon 失败 → 静默忽略                                │
│                                                                  │
│  ProductCard (simple/virtual)                                   │
│    ├─ addItemToCart({ sku, qty })                               │
│    └─ 成功 → if (cp_code valid) applyCoupon(cp_code)            │
│                                                                  │
│  QuickAddModal (configurable)                                   │
│    ├─ addItemToCart({ sku, qty, productOptionsJson })           │
│    └─ 成功 → if (couponCode) applyCoupon(couponCode)            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 四、边界情况

| 场景                       | 行为                                                         |
| -------------------------- | ------------------------------------------------------------ |
| 优惠券已过期               | `useCouponClaim` 自动清除 localStorage，不显示 Claimed       |
| 已领取后优惠券过期         | 下次 mount 时校验 `isCouponValid=false`，自动清除            |
| 购物车已有其他优惠券       | `applyCoupon` 调用后端，由 Magento 决定叠加/覆盖规则         |
| applyCoupon 失败           | 静默忽略，不阻断加购流程，不影响用户                         |
| 可配置商品变体切回父级     | 父级 cp_code 与子变体可能不同，由 `effectiveCpCode` 逻辑处理 |
| 手动在购物车 Remove 优惠券 | 不影响 localStorage 记录，下次加购仍会尝试应用               |
| localStorage 不可用        | try/catch 包裹，降级为仅当前会话的内存状态                   |

---

## 五、验收标准

1. PDP 点击 "Claim coupon" → 按钮变为 "Claimed"，localStorage 记录该券
2. 刷新页面 → 优惠券仍显示 "Claimed"
3. `?coupon=auto` 进入 → 自动领取，按钮显示 "Claimed"
4. PDP 领取后加购 → 购物车自动应用该优惠券
5. 商品卡片 simple/virtual 加购 → 自动应用商品自带优惠券
6. QuickAddModal 选择规格后加购 → 自动应用优惠券
7. 优惠券过期后 → 不显示，localStorage 自动清除
