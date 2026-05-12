'use client';

import { cn, formatPrice } from '@prism/shared';
import { contrastForegroundForBackground } from '../services/color-utils';

// ─── 类型 ──────────────────────────────────────────────────────────────────────

export interface ProductLabelProps {
  /** 库存状态 */
  isInStock: boolean;
  /** 折扣百分比（如 25 表示 25%） */
  discountPercent: number | null;
  /** 运营标签文字（Strapi/Meilisearch 配置） */
  bestText: string | null;
  /** 运营标签颜色（#RRGGBB），无值时品牌色兜底 */
  bestColor: string | null;
  /** 优惠券名称 */
  cpLabel: string | null;
  /** 优惠券活动色（#RRGGBB） */
  cpLabelColor: string | null;
  /** 优惠券抵扣金额 */
  cpPrice: number | null;
  /** 优惠券开始时间（ISO 8601） */
  cpStartsAt: string | null;
  /** 优惠券结束时间（ISO 8601） */
  cpExpiresAt: string | null;
  /** 货币代码 */
  currency: string;
  /** 外层样式 */
  className?: string;
}

// ─── 工具 ──────────────────────────────────────────────────────────────────────

/** 判断优惠券是否在有效期内 */
function isCouponValid(
  startsAt: string | null,
  expiresAt: string | null
): boolean {
  if (!startsAt && !expiresAt) return true;
  const now = Date.now();
  if (startsAt && now < new Date(startsAt).getTime()) return false;
  if (expiresAt && now > new Date(expiresAt).getTime()) return false;
  return true;
}

/** 计算标签背景色与前景色 style 对象 */
function labelStyle(bgColor: string | null): React.CSSProperties {
  if (!bgColor) return {};
  return {
    backgroundColor: bgColor,
    color: contrastForegroundForBackground(bgColor),
  };
}

// ─── 标签子组件 ────────────────────────────────────────────────────────────────

/** 缺货标签 */
function SoldOutLabel() {
  return (
    <span className="inline-block w-fit max-w-[7rem] truncate rounded-[4px] bg-ink px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-white">
      Sold Out
    </span>
  );
}

/** 折扣标签：Save -XX% */
function DiscountLabel({ percent }: { percent: number }) {
  return (
    <span className="inline-block w-fit max-w-[7rem] truncate rounded-[4px] bg-brand px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-brand-foreground">
      Save -{percent}%
    </span>
  );
}

/** 运营标签：best_text 原文 + best_color 背景 */
function BestTextLabel({
  text,
  color,
}: {
  text: string;
  color: string | null;
}) {
  const defaultBestStyle: React.CSSProperties = {
    backgroundColor: 'hsl(var(--surface-muted))',
    color: 'hsl(var(--ink))',
  };

  return (
    <span
      className="inline-block w-fit max-w-[7rem] truncate rounded-[4px] px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide"
      style={color ? labelStyle(color) : defaultBestStyle}
    >
      {text}
    </span>
  );
}

/** 优惠券标签：抵扣金额（如 -$5） */
function CouponLabel({
  cpPrice,
  cpLabel,
  cpLabelColor,
  currency,
}: {
  cpPrice: number | null;
  cpLabel: string | null;
  cpLabelColor: string | null;
  currency: string;
}) {
  const display =
    cpPrice != null ? `-${formatPrice(cpPrice, currency)}` : cpLabel;
  const defaultCouponStyle: React.CSSProperties = {
    backgroundColor: 'hsl(var(--brand-light))',
    color: 'hsl(var(--brand))',
  };

  if (!display) return null;

  return (
    <span
      className="inline-block w-fit max-w-[7rem] truncate rounded-[4px] px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide"
      style={cpLabelColor ? labelStyle(cpLabelColor) : defaultCouponStyle}
    >
      {display}
    </span>
  );
}

// ─── 主组件 ────────────────────────────────────────────────────────────────────

/**
 * 统一商品标签组件
 *
 * 同时展示多个标签（可同时存在折扣标签、运营标签、优惠券标签）。
 * 当 isInStock === false 时，仅展示 "Sold Out" 标签。
 *
 * @see docs/product-display-rules.md 第五章
 */
export function ProductLabel({
  isInStock,
  discountPercent,
  bestText,
  bestColor,
  cpLabel,
  cpLabelColor,
  cpPrice,
  cpStartsAt,
  cpExpiresAt,
  currency,
  className,
}: ProductLabelProps) {
  // 缺货：只显示 Sold Out
  if (!isInStock) {
    return (
      <div className={cn('flex flex-col items-start gap-1', className)}>
        <SoldOutLabel />
      </div>
    );
  }

  const labels: React.ReactNode[] = [];

  // 折扣标签
  if (discountPercent != null && discountPercent > 0) {
    labels.push(<DiscountLabel key="discount" percent={discountPercent} />);
  }

  // 运营标签
  if (bestText) {
    labels.push(<BestTextLabel key="best" text={bestText} color={bestColor} />);
  }

  // 优惠券标签（需在有效期内）
  if (cpLabel && isCouponValid(cpStartsAt, cpExpiresAt)) {
    labels.push(
      <CouponLabel
        key="coupon"
        cpPrice={cpPrice}
        cpLabel={cpLabel}
        cpLabelColor={cpLabelColor}
        currency={currency}
      />
    );
  }

  if (labels.length === 0) return null;

  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      {labels}
    </div>
  );
}
