# 优惠券领取 + 加购自动应用 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 PDP 优惠券从复制改为领取（localStorage 持久化），加购时自动调用 applyCoupon API

**Architecture:** 新增 `useCouponClaim` hook 管理 localStorage 领取状态；CouponBanner 改为受控组件；AddToCartButton/ProductCard/QuickAddModal 加购成功后自动 applyCoupon + syncCart

**Tech Stack:** React hooks, localStorage, existing `applyCoupon` from `@/features/cart`

---

### Task 1: 新增 useCouponClaim hook

**Files:**

- Create: `apps/jd-frontend/features/product/hooks/use-coupon-claim.ts`

- [ ] **Step 1: 实现 useCouponClaim hook**

```ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseCouponClaimOptions {
  sku: string;
  cpCode: string | null;
  isCouponValid: boolean;
}

interface UseCouponClaimResult {
  isClaimed: boolean;
  claimedCode: string | null;
  claim: () => void;
}

const STORAGE_KEY = 'claimed_coupons';

function readClaimedCoupons(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeClaimedCoupons(coupons: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  } catch {
    // localStorage 不可用时静默降级
  }
}

export function useCouponClaim({
  sku,
  cpCode,
  isCouponValid,
}: UseCouponClaimOptions): UseCouponClaimResult {
  const [claimedMap, setClaimedMap] = useState<Record<string, string>>({});

  // mount 时读取 localStorage
  useEffect(() => {
    setClaimedMap(readClaimedCoupons());
  }, []);

  // 当优惠券失效时自动清除该 SKU 的领取记录
  useEffect(() => {
    if (!isCouponValid && claimedMap[sku]) {
      const next = { ...claimedMap };
      delete next[sku];
      setClaimedMap(next);
      writeClaimedCoupons(next);
    }
  }, [isCouponValid, sku]); // eslint-disable-line react-hooks/exhaustive-deps

  const isClaimed = useMemo(() => {
    if (!isCouponValid || !cpCode) return false;
    return claimedMap[sku] === cpCode;
  }, [claimedMap, sku, cpCode, isCouponValid]);

  const claimedCode = useMemo(() => {
    return isClaimed ? claimedMap[sku] : null;
  }, [isClaimed, claimedMap, sku]);

  const claim = useCallback(() => {
    if (!cpCode || !isCouponValid) return;
    const next = { ...claimedMap, [sku]: cpCode };
    setClaimedMap(next);
    writeClaimedCoupons(next);
  }, [claimedMap, sku, cpCode, isCouponValid]);

  return { isClaimed, claimedCode, claim };
}
```

- [ ] **Step 2: 在 features/product/index.ts 中导出 hook**

在 `index.ts` 的 `// ――― Hooks ―――` 区域（如无则加到 Components 之前）添加：

```ts
export { useCouponClaim } from './hooks/use-coupon-claim';
```

---

### Task 2: 改造 CouponBanner 为受控领取

**Files:**

- Modify: `apps/jd-frontend/features/product/components/CouponBanner.tsx`

- [ ] **Step 1: 新增 isClaimed / onClaim props，移除剪贴板逻辑**

将 `CouponBannerProps` 中新增两个 props，删除旧的 `handleClaim` 内部剪贴板实现：

```ts
export interface CouponBannerProps {
  // ... 保留所有现有 props ...
  /** 是否已领取 */
  isClaimed?: boolean;
  /** 点击领取回调 */
  onClaim?: () => void;
}
```

组件内部：删除 `useState(false)` 的 `showToast` (及相关 toast JSX)，删除 `handleClaim` 函数中的剪贴板逻辑。新的 `handleClaim` 直接调用 `onClaim`：

```ts
const handleClaim = () => {
  onClaim?.();
};
```

- [ ] **Step 2: 按钮根据 isClaimed 显示不同状态**

PDP 变体的按钮：

```tsx
<button
  type="button"
  aria-label={isClaimed ? 'Coupon claimed' : 'Claim coupon'}
  onClick={() => void handleClaim()}
  disabled={isClaimed}
  className={cn(
    'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition',
    isClaimed
      ? 'bg-background/40 text-white/60 cursor-default'
      : 'bg-background text-destructive hover:bg-background/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
  )}
>
  {isClaimed ? 'Claimed' : 'Claim coupon'}
</button>
```

Compact 变体同理，已领取时按钮变为不可点击的 "Claimed"。

- [ ] **Step 3: 删除 showToast 相关代码**

删除 `useState(false)` 和底部 Toast JSX（PDP 变体底部、compact 变体下方）。

---

### Task 3: ProductDetailContent 集成领取逻辑

**Files:**

- Modify: `apps/jd-frontend/app/products/[slug]/ProductDetailContent.tsx`

- [ ] **Step 1: 引入 useCouponClaim 和 useSearchParams**

在已有 import 区添加：

```ts
import { useSearchParams } from 'next/navigation';
import { useCouponClaim } from '@/features/product';
```

- [ ] **Step 2: 调用 useCouponClaim + 自动领取逻辑**

在 `showCouponBanner` 定义之后添加：

```ts
const searchParams = useSearchParams();

const { isClaimed, claimedCode, claim } = useCouponClaim({
  sku: product.sku,
  cpCode,
  isCouponValid: showCouponBanner,
});

// ?coupon=auto 自动领取
useEffect(() => {
  if (
    searchParams?.get('coupon') === 'auto' &&
    showCouponBanner &&
    !isClaimed
  ) {
    claim();
  }
}, [searchParams, showCouponBanner, isClaimed, claim]);
```

- [ ] **Step 3: 传递 isClaimed/onClaim 给 CouponBanner**

```tsx
<CouponBanner
  // ... 保留所有现有 props ...
  isClaimed={isClaimed}
  onClaim={claim}
/>
```

- [ ] **Step 4: 将 claimedCode 传给 ProductDetailClient**

```tsx
<ProductDetailClient
  product={product}
  claimedCouponCode={claimedCode}
  onSelectionChange={onSelectionChange}
/>
```

---

### Task 4: ProductDetailClient 透传 claimedCouponCode

**Files:**

- Modify: `apps/jd-frontend/app/products/[slug]/ProductDetailClient.tsx`

- [ ] **Step 1: ProductDetailClient 新增 prop，向下传递**

`ProductDetailClientProps` 新增：

```ts
interface ProductDetailClientProps {
  product: MagentoProduct;
  /** 已领取的优惠券码（PDP Claim 后的 code） */
  claimedCouponCode?: string | null;
  onSelectionChange?: (selection: ProductDetailSelection) => void;
}
```

- [ ] **Step 2: SimpleOptions 接收并传给 AddToCartButton**

`SimpleOptions` 新增 `claimedCouponCode` prop，传给 `<AddToCartButton couponCode={claimedCouponCode} ... />`。

- [ ] **Step 3: ConfigurableOptions 接收并处理变体 cp_code**

`ConfigurableOptions` 新增 `claimedCouponCode` prop + `parentCpCode` prop。根据 `allSelected` 状态决定传给 AddToCartButton 的 couponCode：

- 已全选且有 selectedChild → 优先用 selectedChild 的 cp_code
- 未选择变体 → 用 `claimedCouponCode`（即父商品领取的券）

实际在 `ConfigurableOptions` 中，`selectedChild` 已有 `cp_code` 字段。计算 effective code：

```ts
const effectiveCouponCode = useMemo(() => {
  if (allSelected && selectedChild?.cp_code) return selectedChild.cp_code;
  return claimedCouponCode ?? null;
}, [allSelected, selectedChild, claimedCouponCode]);
```

传给 `<AddToCartButton couponCode={effectiveCouponCode} ... />`。

- [ ] **Step 4: 主组件 switch 透传**

`ConfigurableOptions` 多传 `claimedCouponCode`，`SimpleOptions` 传 `claimedCouponCode`。其他类型不传。

---

### Task 5: AddToCartButton 支持加购后 applyCoupon

**Files:**

- Modify: `apps/jd-frontend/features/product/components/AddToCartButton.tsx`

- [ ] **Step 1: 新增 couponCode prop，引入 useCart 和 applyCoupon**

```ts
import { useAddToCartAction, applyCoupon, useCart } from '@/features/cart';

interface AddToCartButtonProps {
  // ... 保留所有现有 props ...
  /** 加购成功后自动应用的优惠券码 */
  couponCode?: string | null;
}
```

- [ ] **Step 2: 加购成功后 applyCoupon**

从 `useCart()` 解构 `syncCart`，修改 `handleAddToCart`：

```ts
const { syncCart } = useCart();

const handleAddToCart = useCallback(async () => {
  const success = await addItemToCart(
    { sku, qty, storeId, productOptionsJson },
    { openCartOnSuccess: true }
  );
  if (success && couponCode) {
    try {
      await applyCoupon(couponCode);
      await syncCart();
    } catch {
      // 静默忽略 applyCoupon 失败
    }
  }
}, [
  addItemToCart,
  productOptionsJson,
  qty,
  sku,
  storeId,
  couponCode,
  syncCart,
]);
```

---

### Task 6: ProductCard simple/virtual 自动应用 cp_code

**Files:**

- Modify: `apps/jd-frontend/features/product/components/ProductCard.tsx`

- [ ] **Step 1: 引入 applyCoupon，获取 syncCart**

```ts
import { useCart, useAddToCartAction, applyCoupon } from '@/features/cart';
```

从 `useCart()` 中解构 `syncCart`（已 import `useCart`，只需增加 `syncCart` 解构）。

- [ ] **Step 2: 判断优惠券是否有效**

在组件顶部添加判断：

```ts
const isCouponValid = useMemo(() => {
  if (!product.cp_code) return false;
  const now = Date.now();
  if (product.cp_starts_at) {
    const startMs = new Date(product.cp_starts_at).getTime();
    if (Number.isFinite(startMs) && now < startMs) return false;
  }
  if (product.cp_expires_at) {
    const endMs = new Date(product.cp_expires_at).getTime();
    if (Number.isFinite(endMs) && now > endMs) return false;
  }
  return true;
}, [product.cp_code, product.cp_starts_at, product.cp_expires_at]);
```

- [ ] **Step 3: 修改 addSimpleProduct 加购后 applyCoupon**

```ts
const addSimpleProduct = async () => {
  await addItemToCart(
    { sku: product.sku, qty: 1 },
    { openCartOnSuccess: true }
  );
  if (isCouponValid && product.cp_code) {
    try {
      await applyCoupon(product.cp_code);
      await syncCart();
    } catch {
      // 静默忽略
    }
  }
};
```

- [ ] **Step 4: 修改 handleQtyDelta 中新增加购路径**

在第 938 行 `addItemToCart` 调用后同样加 applyCoupon（当 cartLineForSku 为 null 即首次加购时）:

```ts
if (isCouponValid && product.cp_code) {
  try {
    await applyCoupon(product.cp_code);
    await syncCart();
  } catch {
    /* ignore */
  }
}
```

- [ ] **Step 5: 修改 handleCompactAdd 加购后 applyCoupon**

```ts
const handleCompactAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  e.stopPropagation();
  if (isAdding || isOutOfStock) return;
  void (async () => {
    const success = await addItemToCart(
      { sku: product.sku, qty: 1 },
      { openCartOnSuccess: true }
    );
    if (success && isCouponValid && product.cp_code) {
      try {
        await applyCoupon(product.cp_code);
        await syncCart();
      } catch {
        /* ignore */
      }
    }
  })();
};
```

---

### Task 7: QuickAddModal 支持加购后 applyCoupon

**Files:**

- Modify: `apps/jd-frontend/features/product/components/QuickAddModal.tsx`

- [ ] **Step 1: 新增 couponCode prop，引入 applyCoupon 和 useCart**

```ts
import { useAddToCartAction, applyCoupon, useCart } from '@/features/cart';

interface QuickAddModalProps {
  // ... 保留所有现有 props ...
  /** 加购成功后自动应用的优惠券码 */
  couponCode?: string | null;
}
```

- [ ] **Step 2: 加购成功后 applyCoupon**

从 `useCart()` 解构 `syncCart`，修改 `handleAddToCart`（约第 173 行）：

```ts
const { syncCart } = useCart();

// ... 在 addItemToCart 成功且 couponCode 存在时:
if (added && couponCode) {
  try {
    await applyCoupon(couponCode);
    await syncCart();
  } catch {
    // 静默忽略
  }
}
```

- [ ] **Step 3: ProductCard 渲染 QuickAddModal 时传入 cpCode**

在 ProductCard 中查找 `<QuickAddModal` 渲染位置，添加 `couponCode` prop。传值逻辑：

- 若 `isCouponValid && product.cp_code` → 传 `product.cp_code`
- 否则传 `null`

---

### Task 8: 完整性检查

- [ ] **Step 1: typecheck**

```bash
pnpm typecheck
```

Expected: 无新增类型错误

- [ ] **Step 2: lint**

```bash
pnpm lint
```

Expected: 无新增 error/warning（已存在的 5 个 warning 除外）

- [ ] **Step 3: 手动验证 Checklist**

| 场景                 | 验证点                              |
| -------------------- | ----------------------------------- |
| PDP 点击 Claim       | 按钮变 Claimed，localStorage 有记录 |
| 刷新 PDP             | 仍显示 Claimed                      |
| `?coupon=auto`       | 自动 Claimed                        |
| PDP Claim 后加购     | 购物车自动应用券                    |
| 商品卡片 simple 加购 | 自动应用 cp_code                    |
| QuickAddModal 加购   | 自动应用 cp_code                    |
| 优惠券过期后再访问   | localStorage 清除，不显示 Claimed   |
