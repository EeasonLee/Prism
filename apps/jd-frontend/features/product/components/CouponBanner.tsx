'use client';

import { cn, formatPrice } from '@prism/shared';

// ─── 类型 ──────────────────────────────────────────────────────────────────────

export interface CouponBannerProps {
  /** 优惠券码（必须） */
  cpCode: string;
  /** 优惠券标签/促销文案 */
  cpLabel: string | null;
  /** 抵扣金额（已归一化处理，如 5 表示 $5 off） */
  cpPrice: number | null;
  /** 券前价格 */
  priceBeforeCoupon: number;
  /** 货币代码 */
  currency: string;
  /** 是否有折扣 */
  hasDiscount: boolean;
  /** 特价（有折扣时使用） */
  specialPrice: number | null;
  /** 原价（划线价） */
  originalPrice: number;
  /** 有效期截止日（格式化后的文本，如 "Jun 15, 2026"） */
  validUntil: string | null;
  /** 变体 */
  variant?: 'pdp' | 'compact';
  /** 是否已领取 */
  isClaimed?: boolean;
  /** 点击领取回调 */
  onClaim?: () => void;
  /** 外层类名 */
  className?: string;
}

// ─── 工具 ──────────────────────────────────────────────────────────────────────

/** 计算券后实际价格 */
function computeCouponAdjustedPrice(
  cpPrice: number | null,
  priceBefore: number
): { couponOffAmount: number; priceAfterCoupon: number } {
  if (cpPrice == null || cpPrice <= 0) {
    return { couponOffAmount: 0, priceAfterCoupon: priceBefore };
  }
  const off = Math.min(cpPrice, priceBefore);
  return {
    couponOffAmount: off,
    priceAfterCoupon: Math.max(0, priceBefore - off),
  };
}

// ─── 子组件 ────────────────────────────────────────────────────────────────────

/** PDP 用的礼花装饰 SVG */
function FireworksIcon() {
  return (
    <svg
      className="h-full w-full text-white/90"
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="6"
        opacity="0.85"
      >
        <path d="M100 20 L100 55" />
        <path d="M100 145 L100 180" />
        <path d="M20 100 L55 100" />
        <path d="M145 100 L180 100" />
        <path d="M35 35 L60 60" />
        <path d="M140 140 L165 165" />
        <path d="M165 35 L140 60" />
        <path d="M60 140 L35 165" />
        <circle cx="100" cy="100" r="9" fill="currentColor" />
      </g>
    </svg>
  );
}

// ─── 主组件 ────────────────────────────────────────────────────────────────────

/**
 * 优惠券横幅组件（受控展示组件）
 *
 * 支持两种变体：
 * - `pdp`: 完整横幅（礼花装饰 + 券后价 + Claim 按钮）
 * - `compact`: 紧凑展示（券信息 + Claim 链接）
 *
 * 领取状态由父组件通过 `isClaimed`/`onClaim` props 控制。
 *
 * @see docs/product-display-rules.md 第四章
 */
export function CouponBanner({
  cpCode,
  cpLabel,
  cpPrice,
  priceBeforeCoupon,
  currency,
  hasDiscount,
  specialPrice,
  originalPrice,
  validUntil,
  variant = 'pdp',
  isClaimed = false,
  onClaim,
  className,
}: CouponBannerProps) {
  const { couponOffAmount, priceAfterCoupon } = computeCouponAdjustedPrice(
    cpPrice,
    priceBeforeCoupon
  );

  const handleClaim = () => {
    onClaim?.();
  };

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'rounded-lg bg-surface-muted px-3 py-2 text-xs',
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-ink">
            {cpLabel ?? 'Coupon'} {formatPrice(couponOffAmount, currency)} off
          </span>
          <button
            type="button"
            onClick={handleClaim}
            disabled={isClaimed}
            className={cn(
              'shrink-0 text-xs font-medium',
              isClaimed
                ? 'text-ink-muted cursor-default'
                : 'text-brand underline'
            )}
          >
            {isClaimed ? 'Claimed' : 'Claim'}
          </button>
        </div>
      </div>
    );
  }

  // PDP 变体：完整横幅
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-destructive px-5 py-4 text-white',
        className
      )}
    >
      {/* 礼花背景 */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -right-10 top-0 h-full w-44">
          <FireworksIcon />
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {/* 标签 */}
            <span className="text-sm font-semibold text-white/90">
              {cpLabel ?? 'Limited time coupon'}
            </span>

            {/* 价格展示 */}
            {couponOffAmount > 0 ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold leading-none">
                  {formatPrice(priceAfterCoupon, currency)}
                </span>
                <span className="text-sm font-semibold text-white/70 line-through">
                  {formatPrice(priceBeforeCoupon, currency)}
                </span>
              </div>
            ) : hasDiscount && specialPrice != null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold leading-none">
                  {formatPrice(specialPrice, currency)}
                </span>
                <span className="text-sm font-semibold text-white/70 line-through">
                  {formatPrice(originalPrice, currency)}
                </span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-white/90">
                Current price {formatPrice(priceBeforeCoupon, currency)}
              </div>
            )}
          </div>

          {/* 券码 + 有效期 */}
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {couponOffAmount > 0 ? (
              <span className="font-medium">
                Use coupon for {formatPrice(couponOffAmount, currency)} off
              </span>
            ) : (
              <span className="font-medium">Use coupon code for savings</span>
            )}
            <span className="font-semibold">Discount code: {cpCode}</span>
            {validUntil && (
              <span className="text-white/85">Valid until {validUntil}</span>
            )}
          </div>
        </div>

        {/* Claim 按钮 */}
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
      </div>
    </div>
  );
}
