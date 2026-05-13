'use client';

import { OptimizedImage, PageContainer } from '@prism/ui';
import Link from 'next/link';
import { AddToCartButton, buildProductUrl } from '@/features/product';
import { formatPrice } from '@prism/shared';
import type { UnifiedLinkedProduct } from '@/features/product';

interface UpsellProductsSectionProps {
  initialProducts: UnifiedLinkedProduct[];
}

export function UpsellProductsSection({
  initialProducts,
}: UpsellProductsSectionProps) {
  if (initialProducts.length === 0) {
    return null;
  }

  return (
    <section
      id="section-upsell-products"
      aria-labelledby="upsell-products-heading"
      className="pb-10 lg:pb-16"
    >
      <div className="pt-10">
        <h2
          id="upsell-products-heading"
          className="heading-3 mb-8 text-center text-ink"
        >
          Explore Upgrades
        </h2>
        <PageContainer className="grid max-w-[1400px] grid-cols-1 gap-4 sm:grid-cols-2 lg:px-8 2xl:grid-cols-3">
          {initialProducts.map((item, index) => {
            const displayPrice = item.special_price ?? item.price;
            const hasDiscount =
              item.special_price != null && item.special_price < item.price;
            const productKey = `${item.sku}-${
              item.url_key ?? 'no-url'
            }-${index}`;

            return (
              <article
                key={productKey}
                className="group flex h-full min-h-[156px] overflow-hidden rounded-2xl border border-border bg-card"
              >
                <Link
                  href={buildProductUrl({
                    url_key: item.url_key,
                    sku: item.sku,
                    cp_code: null,
                  })}
                  className="relative block w-[132px] shrink-0 bg-surface-muted sm:w-[140px]"
                >
                  {item.unified_thumbnail ? (
                    <OptimizedImage
                      src={item.unified_thumbnail}
                      alt={item.display_name}
                      fill
                      maxDisplayWidth={140}
                      className="object-cover"
                      sizes="(max-width: 640px) 132px, 140px"
                    />
                  ) : null}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
                  <div className="space-y-2">
                    <Link
                      href={buildProductUrl({
                        url_key: item.url_key,
                        sku: item.sku,
                        cp_code: null,
                      })}
                      className="block"
                    >
                      <h3 className="line-clamp-2 text-sm font-semibold text-ink">
                        {item.display_name}
                      </h3>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-ink">
                        {formatPrice(displayPrice, item.currency)}
                      </span>
                      {hasDiscount ? (
                        <span className="text-ink-faint line-through">
                          {formatPrice(item.price, item.currency)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <AddToCartButton
                    sku={item.sku}
                    className="btn-primary flex h-9 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </article>
            );
          })}
        </PageContainer>
      </div>
    </section>
  );
}
