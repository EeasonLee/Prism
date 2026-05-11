'use client';

import { cn, formatPrice } from '@prism/shared';
import { cva, type VariantProps } from 'class-variance-authority';

// ─── CVA 配置 ──────────────────────────────────────────────────────────────────

const priceContainer = cva('flex items-baseline', {
  variants: {
    size: {
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const sellingPriceStyle = cva('font-bold text-ink', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-2xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const originalPriceStyle = cva('font-medium text-ink-muted line-through', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-xs',
      lg: 'text-sm',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const saveBadgeStyle = cva('font-semibold', {
  variants: {
    size: {
      sm: 'rounded px-1.5 py-0.5 text-[10px]',
      md: 'rounded-full bg-brand/10 px-2.5 py-0.5 text-xs',
      lg: 'rounded-full bg-brand/10 px-3 py-1 text-sm',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// ─── 类型 ──────────────────────────────────────────────────────────────────────

export interface ProductPriceProps extends VariantProps<typeof priceContainer> {
  /** 划线价（原价） */
  price: number;
  /** 售价 */
  finalPrice: number;
  /** 折扣百分比（如 25 表示 25%），null 表示无折扣 */
  discountPercent: number | null;
  /** 货币代码 */
  currency: string;
  /** 是否显示 Save XX% 徽章 */
  showSaveBadge?: boolean;
  /** 外层样式 */
  className?: string;
  /** 售价样式覆盖 */
  sellingPriceClassName?: string;
}

// ─── 组件 ──────────────────────────────────────────────────────────────────────

/**
 * 统一商品价格组件
 *
 * 展示逻辑：
 * - 始终显示 final_price（售价）为粗体
 * - 有折扣时显示 price（划线原价）+ 可选 Save XX% 徽章
 * - 无折扣时仅显示售价
 *
 * @see docs/product-display-rules.md 第三章
 */
export function ProductPrice({
  price,
  finalPrice,
  discountPercent,
  currency,
  showSaveBadge = false,
  size,
  className,
  sellingPriceClassName,
}: ProductPriceProps) {
  const hasDiscount = discountPercent != null && discountPercent > 0;

  return (
    <div className={cn(priceContainer({ size }), className)}>
      {/* 售价 */}
      <span className={cn(sellingPriceStyle({ size }), sellingPriceClassName)}>
        {formatPrice(finalPrice, currency)}
      </span>

      {/* 划线原价（有折扣时显示） */}
      {hasDiscount && (
        <span className={originalPriceStyle({ size })}>
          {formatPrice(price, currency)}
        </span>
      )}

      {/* Save XX% 徽章 */}
      {hasDiscount && showSaveBadge && (
        <span className={cn(saveBadgeStyle({ size }), 'text-brand')}>
          Save {discountPercent}%
        </span>
      )}
    </div>
  );
}
