'use client';

import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '@/lib/format-price';
import { getCartItems } from '../../../lib/api/magento/cart';
import type { ProductCardItem } from '../../../lib/api/bff/product/types';
import { useCart } from '../../../lib/cart/context';
import { QuickAddModal } from './QuickAddModal';

interface ProductCardProps {
  product: ProductCardItem;
}

const TYPE_LABEL: Record<string, string> = {
  simple: 'Simple',
  configurable: 'Configurable',
  bundle: 'Bundle',
  grouped: 'Grouped',
  virtual: 'Virtual',
};

const TYPE_STYLE: Record<string, string> = {
  bundle: 'bg-violet-100 text-violet-700',
  configurable: 'bg-blue-100 text-blue-700',
  grouped: 'bg-amber-100 text-amber-700',
  virtual: 'bg-teal-100 text-teal-700',
  simple: 'bg-surface text-ink-muted',
};

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

let starIdCounter = 0;

function StarRating({ percentage }: { percentage: number }) {
  const score = (percentage / 100) * 5;
  const fullStars = Math.floor(score);
  const fraction = score - fullStars;
  const hasHalf = fraction >= 0.25 && fraction < 0.75;
  const clipId = `star-half-${++starIdCounter}`;

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${score.toFixed(1)} out of 5 stars`}
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="10" height="20" />
          </clipPath>
        </defs>
      </svg>
      {Array.from({ length: 5 }, (_, i) => {
        const isFilled = i < fullStars;
        const isHalf = hasHalf && i === fullStars;
        return (
          <svg
            key={i}
            className="relative h-3 w-3"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              d={STAR_PATH}
              fill="currentColor"
              className="text-ink-muted/25"
            />
            {(isFilled || isHalf) && (
              <path
                d={STAR_PATH}
                fill="currentColor"
                className="text-amber-400"
                clipPath={isHalf ? `url(#${clipId})` : undefined}
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, openCart } = useCart();
  const priceValue = product.price.value;
  const currencyCode = product.price.currency;
  const originalPrice = product.originalPrice;
  const hasDiscount =
    priceValue != null && originalPrice != null && originalPrice > priceValue;
  const typeKey = product.type ?? 'simple';
  const typeLabel = TYPE_LABEL[typeKey] ?? typeKey;
  const typeStyle = TYPE_STYLE[typeKey] ?? 'bg-surface text-ink-muted';
  const hasRating = product.ratingPercentage > 0;
  const isOutOfStock = product.inStock === false;
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [cartQty, setCartQty] = useState(0);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quickViewData, setQuickViewData] = useState<
    Parameters<typeof QuickAddModal>[0]['variantData'] | null
  >(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [quickViewError, setQuickViewError] = useState<string | null>(null);

  const imageUrl = product.image;

  const refreshCardQtyFromCart = async () => {
    try {
      const items = await getCartItems();
      if (typeKey === 'configurable' && quickViewData) {
        const variantSkuSet = new Set([
          product.sku,
          ...quickViewData.variants.map(variant => variant.sku),
        ]);
        const total = items.reduce((sum, item) => {
          if (!variantSkuSet.has(item.sku)) return sum;
          return sum + item.qty;
        }, 0);
        setCartQty(total);
        return;
      }

      const total = items.reduce((sum, item) => {
        if (item.sku !== product.sku) return sum;
        return sum + item.qty;
      }, 0);
      setCartQty(total);
    } catch {
      // 购物车读取失败时保持当前角标，避免影响加购主流程
    }
  };

  const addSimpleProduct = async () => {
    setAddError(null);
    setIsAdding(true);
    try {
      await addToCart({ sku: product.sku, qty: 1 });
      await refreshCardQtyFromCart();
      openCart();
    } catch (error) {
      setAddError(
        error instanceof Error
          ? error.message
          : 'Failed to add item to cart. Please try again.'
      );
    } finally {
      setIsAdding(false);
    }
  };

  const fetchConfigurableVariants = async () => {
    if (quickViewLoading) return;
    setQuickViewLoading(true);
    setQuickViewError(null);
    try {
      const response = await fetch(
        `/api/products/${encodeURIComponent(product.sku)}/variants`
      );
      const payload = (await response.json()) as {
        success: boolean;
        data?: {
          options: Array<{
            attribute_id: number;
            code: string;
            label: string;
            values: Array<{ label: string; value: string }>;
          }>;
          customizable_options: Array<{
            option_id: number;
            title: string;
            required: boolean;
            type: string;
            values?: Array<{ option_type_id: number; title: string }>;
          }>;
          variants: Array<{
            sku: string;
            attributes: Record<string, string>;
            inStock: boolean;
            price: number;
          }>;
        };
        error?: { message?: string };
      };
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? 'Failed to load variants.');
      }
      setQuickViewData(payload.data);
      await refreshCardQtyFromCart();
    } catch (error) {
      setQuickViewError(
        error instanceof Error ? error.message : 'Failed to load variants.'
      );
    } finally {
      setQuickViewLoading(false);
    }
  };

  const handleAddClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isOutOfStock || isAdding) return;

    if (typeKey === 'configurable') {
      setIsQuickViewOpen(true);
      setAddError(null);
      setQuickViewError(null);
      await fetchConfigurableVariants();
      return;
    }

    await addSimpleProduct();
  };

  return (
    <>
      <Link
        href={
          `/products/${encodeURIComponent(
            product.urlKey ?? product.sku
          )}` as Route
        }
        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition hover:shadow-md"
      >
        {/* 图片区域 */}
        <div className="relative aspect-square overflow-hidden bg-surface">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.displayName}
              fill
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-4 transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-muted/30">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* 左上角标签：促销 > Sale > 商品类型 */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.promotionLabel && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
                {product.promotionLabel}
              </span>
            )}
            {!product.promotionLabel && hasDiscount && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
                Sale
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeStyle}`}
            >
              {typeLabel}
            </span>
          </div>

          {/* 右上角：库存状态 + 列表加购 */}
          <div className="absolute right-2 top-2 flex items-start gap-2">
            {isOutOfStock && (
              <span className="rounded-full bg-ink/60 px-2 py-0.5 text-[10px] font-medium text-white">
                Out of Stock
              </span>
            )}
            <button
              type="button"
              onClick={event => {
                void handleAddClick(event);
              }}
              disabled={isOutOfStock || isAdding}
              aria-label={
                typeKey === 'configurable'
                  ? 'Select options and add to cart'
                  : 'Add to cart'
              }
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink backdrop-blur-sm transition-all duration-200 hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {cartQty > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-brand-foreground">
                  {cartQty}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 信息区域 */}
        <div className="flex flex-1 flex-col p-4">
          {/* 使用 display_name（Strapi 优化标题 > Magento 原始名称） */}
          <p className="mb-2 line-clamp-2 text-sm font-medium text-ink leading-snug group-hover:text-brand">
            {product.displayName}
          </p>

          {/* 评分 */}
          {hasRating ? (
            <div className="mb-2 flex items-center gap-1.5">
              <StarRating percentage={product.ratingPercentage ?? 0} />
              <span className="text-[11px] text-ink-muted">
                ({product.reviewCount})
              </span>
            </div>
          ) : (
            <div className="mb-2 h-4" />
          )}

          <div className="mt-auto flex items-baseline gap-2">
            {priceValue != null ? (
              <>
                {hasDiscount && (
                  <span className="text-base font-bold text-ink">
                    {formatPrice(priceValue, currencyCode)}
                  </span>
                )}
                <span
                  className={`text-base font-bold ${
                    hasDiscount
                      ? 'text-xs text-ink-muted line-through'
                      : 'text-ink'
                  }`}
                >
                  {formatPrice(
                    hasDiscount ? originalPrice ?? 0 : priceValue,
                    currencyCode
                  )}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-ink-muted">
                Price unavailable
              </span>
            )}
          </div>
          {addError && <p className="mt-2 text-xs text-red-500">{addError}</p>}
        </div>
      </Link>

      {isQuickViewOpen && (
        <QuickAddModal
          product={product}
          variantData={
            quickViewData ?? {
              options: [],
              customizable_options: [],
              variants: [],
            }
          }
          error={quickViewError}
          onClose={() => setIsQuickViewOpen(false)}
          onAdded={async () => {
            await refreshCardQtyFromCart();
            openCart();
          }}
        />
      )}
    </>
  );
}
