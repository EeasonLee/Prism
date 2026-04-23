import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { FeaturedProductsProps } from '@/lib/api/cms-page.types';
import { searchProductsBySkusForBFF } from '@/lib/api/bff/product/meilisearch';
import { formatPrice } from '@/lib/format-price';

function stripHtml(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function FeaturedProducts({
  title,
  subtitle,
  products,
}: FeaturedProductsProps) {
  const skus = [...new Set(products.map(sku => sku.trim()).filter(Boolean))];

  if (skus.length === 0) {
    return null;
  }

  const validProducts = await searchProductsBySkusForBFF(skus).catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `Failed to fetch featured products from Meilisearch: ${message}`
    );
    return [];
  });

  if (validProducts.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full bg-surface py-12 lg:py-20">
      <div className="w-full px-5 sm:px-6 lg:px-[8vw]">
        <div className="mb-8">
          {subtitle && (
            <span className="micro-text mb-2 block text-brand">{subtitle}</span>
          )}
          <h2
            className="heading-3 text-ink"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {validProducts.map(product => {
            const price = product.price.value;
            const originalPrice = product.originalPrice;
            const currency = product.price.currency ?? 'USD';
            const discount =
              price && originalPrice && originalPrice > price
                ? Math.round(((originalPrice - price) / originalPrice) * 100)
                : null;
            const imageUrl =
              product.image ?? '/images/product_soymilk_card.jpg';

            return (
              <div
                key={product.sku}
                className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] lg:grid-cols-[220px,1fr]">
                  <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden md:aspect-auto md:min-h-[260px]">
                    <Image
                      src={imageUrl}
                      alt={product.displayName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 280px"
                    />
                    {product.promotionLabel && (
                      <div className="absolute left-3 top-3 rounded bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        {product.promotionLabel}
                      </div>
                    )}
                  </div>

                  <div className="flex min-h-[260px] flex-1 flex-col justify-between p-5 lg:p-6">
                    <div>
                      <h3
                        className="mb-2 line-clamp-2 text-lg font-bold leading-snug text-ink lg:text-xl"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {product.displayName}
                      </h3>
                      {product.promotionLabel && (
                        <p className="mb-5 text-sm text-ink-muted">
                          {stripHtml(product.promotionLabel)}
                        </p>
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

                      <div className="flex flex-wrap gap-2.5">
                        <Link
                          href={`/products/${product.urlKey ?? product.sku}`}
                          className="btn-primary flex items-center gap-1.5 px-5 py-2.5 text-sm"
                        >
                          View Product
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/products/${product.urlKey ?? product.sku}`}
                          className="flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
                        >
                          Learn More
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
