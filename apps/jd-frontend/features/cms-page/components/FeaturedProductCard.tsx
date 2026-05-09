'use client';

import { OptimizedImage } from '@prism/ui';
import Link from 'next/link';
import { AddToCartButton } from '@/features/product';
import { formatPrice } from '@prism/shared';

export interface FeaturedProductCardData {
  sku: string;
  urlKey?: string;
  imageUrl: string;
  displayName: string;
  promotionLabel?: string;
  longTitle: string;
  sellingPoints: string[];
  price: number | undefined;
  originalPrice: number | undefined;
  currency: string;
  discount: number | null;
}

export function FeaturedProductCard({
  product,
}: {
  product: FeaturedProductCardData;
}) {
  const {
    sku,
    urlKey,
    imageUrl,
    displayName,
    promotionLabel,
    longTitle,
    sellingPoints,
    price,
    originalPrice,
    currency,
    discount,
  } = product;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* 整卡点击覆盖层 */}
      <Link
        href={`/products/${urlKey ?? sku}`}
        className="absolute inset-0 z-[1]"
        aria-label={displayName}
      />

      <div className="grid grid-cols-1 items-start md:grid-cols-[1fr,2fr] md:items-stretch">
        <div className="relative w-full shrink-0 overflow-hidden aspect-square">
          <OptimizedImage
            src={imageUrl}
            alt={displayName}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            maxDisplayWidth={280}
            sizes="(max-width: 640px) 100vw, 280px"
          />
          {promotionLabel && (
            <div className="absolute left-3 top-3 rounded bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {promotionLabel}
            </div>
          )}
        </div>

        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col justify-between p-5 lg:p-6">
          <div className="min-w-0 flex-1 overflow-hidden">
            <h3
              className="mb-2 line-clamp-2 text-lg font-bold leading-snug text-ink lg:text-xl"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {displayName}
            </h3>
            {longTitle && (
              <p className="mb-3 line-clamp-2 text-sm text-ink-muted">
                {longTitle}
              </p>
            )}
            {sellingPoints.length > 0 && (
              <ul className="mb-5 min-w-0 space-y-1.5 overflow-hidden text-xs text-ink-muted lg:text-sm">
                {sellingPoints.map(point => (
                  <li
                    key={`${sku}-${point}`}
                    className="relative min-w-0 pl-4 before:absolute before:left-0 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-brand/35"
                  >
                    <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            {(price || originalPrice) && (
              <div className="mb-4 flex items-center gap-3">
                {price && (
                  <span className="text-2xl font-bold text-brand">
                    {formatPrice(price, currency)}
                  </span>
                )}
                {originalPrice && (
                  <span className="text-sm text-ink-faint line-through">
                    {formatPrice(originalPrice, currency)}
                  </span>
                )}
                {discount && (
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                    Save {discount}%
                  </span>
                )}
              </div>
            )}

            {/* z-10 + stopPropagation 防止点击按钮时触发整卡跳转 */}
            <span className="relative z-10" onClick={e => e.stopPropagation()}>
              <AddToCartButton
                sku={sku}
                className="btn-primary flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
