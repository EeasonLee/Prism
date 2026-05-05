'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/shared/utils/format-price';
import type { ProductCardItem } from '@/features/product/bff-types';
import { AddToCartButton } from '@/features/product/AddToCartButton';

interface DealProductCardProps {
  product: ProductCardItem;
}

export function DealProductCard({ product }: DealProductCardProps) {
  const priceValue = product.price.value;
  const currencyCode = product.price.currency;
  const originalPrice = product.originalPrice;
  const hasDiscount =
    priceValue != null && originalPrice != null && originalPrice > priceValue;
  const isOutOfStock = product.inStock === false;
  const productType = product.type ?? 'simple';
  const isDirectAddSupported =
    productType === 'simple' || productType === 'virtual';
  const addDisabled = isOutOfStock || !isDirectAddSupported;
  const disabledLabel = isOutOfStock ? 'Out of Stock' : 'Select Options';

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
      <Link
        href={
          product.urlKey
            ? `/products/${product.urlKey}`
            : `/products/${product.sku}`
        }
        className="block"
      >
        <div className="relative aspect-square overflow-hidden bg-surface">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.displayName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-xs text-ink-muted">No image</span>
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">
                Out of Stock
              </span>
            </div>
          )}

          {hasDiscount && (
            <div className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Sale
            </div>
          )}
        </div>

        <div className="p-3 pb-2">
          <h3 className="line-clamp-2 text-sm font-medium text-ink group-hover:text-brand">
            {product.displayName}
          </h3>
          <div className="mt-1.5 flex items-baseline gap-2">
            {priceValue != null ? (
              <>
                <span className="text-sm font-bold text-ink">
                  {formatPrice(priceValue, currencyCode)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-ink-muted line-through">
                    {formatPrice(originalPrice, currencyCode)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-ink-muted">Price unavailable</span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3">
        <AddToCartButton
          sku={product.sku}
          qty={1}
          disabled={addDisabled}
          disabledLabel={disabledLabel}
          className="btn-primary flex h-9 w-full items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </article>
  );
}
