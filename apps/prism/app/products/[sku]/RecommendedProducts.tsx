import Image from 'next/image';
import Link from 'next/link';
import type { RecommendedProduct } from './mock-data';

interface RecommendedProductsProps {
  products: RecommendedProduct[];
}

export function RecommendedProducts({ products }: RecommendedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="recommended-heading" className="py-12 lg:py-16">
      <h2
        id="recommended-heading"
        className="heading-3 mb-8 text-center text-ink"
      >
        You May Also Like
      </h2>

      {/* 横向滚动容器 */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-[50px]">
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-[50px] [&::-webkit-scrollbar]:hidden">
          {products.map(product => {
            const hasDiscount =
              product.special_price != null &&
              product.special_price < product.price;
            const displayPrice = product.special_price ?? product.price;

            return (
              <Link
                key={product.id}
                href={`/products/${encodeURIComponent(product.sku)}`}
                className="group flex w-44 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-brand/30 hover:shadow-md sm:w-52"
              >
                {/* 图片 */}
                <div className="relative aspect-square overflow-hidden bg-surface">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    unoptimized
                    sizes="208px"
                    className="object-contain p-4 transition group-hover:scale-105"
                  />
                  {product.badge && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
                      {product.badge}
                    </span>
                  )}
                </div>

                {/* 信息 */}
                <div className="flex flex-1 flex-col p-3">
                  <p className="mb-2 line-clamp-2 text-xs font-medium leading-snug text-ink">
                    {product.name}
                  </p>
                  <div className="mt-auto flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-ink">
                      ${displayPrice.toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-ink-muted line-through">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
