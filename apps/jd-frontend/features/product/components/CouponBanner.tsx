'use client';

import { useState } from 'react';
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
 * 优惠券横幅组件
 *
 * 支持两种变体：
 * - `pdp`: 完整横幅（礼花装饰 + 券后价 + Claim 按钮 + Toast）
 * - `compact`: 紧凑展示（仅显示券信息 + 复制图标，无按钮）
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
  className,
}: CouponBannerProps) {
  const [showToast, setShowToast] = useState(false);

  const { couponOffAmount, priceAfterCoupon } = computeCouponAdjustedPrice(
    cpPrice,
    priceBeforeCoupon
  );

  const handleClaim = async () => {
    if (typeof navigator === 'undefined') return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(cpCode);
      } else {
        window.prompt('Copy coupon code', cpCode);
      }
    } catch {
      window.prompt('Copy coupon code', cpCode);
    }

    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 1500);
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
            className="shrink-0 text-brand underline"
          >
            {cpCode}
          </button>
        </div>
        {showToast && (
          <span className="mt-1 block text-green-600">Copied!</span>
        )}
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
          aria-label="Claim coupon"
          onClick={() => void handleClaim()}
          className="inline-flex items-center justify-center rounded-full bg-background px-5 py-2 text-sm font-semibold text-destructive shadow-sm transition hover:bg-background/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Claim coupon
        </button>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-10">
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-4 py-2 text-sm font-medium text-ink shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl">
            Coupon code copied
          </div>
        </div>
      )}
    </div>
  );
}
