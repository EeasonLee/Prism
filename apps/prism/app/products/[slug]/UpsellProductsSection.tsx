import Image from 'next/image';
import Link from 'next/link';
import type { UnifiedLinkedProduct } from '../../../lib/api/unified-product';

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
      aria-labelledby="upsell-products-heading"
      className="pb-10 lg:pb-16"
    >
      <div className="border-t border-border pt-10">
        <h2
          id="upsell-products-heading"
          className="heading-3 mb-8 text-center text-ink"
        >
          You may also like
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {initialProducts.map(item => {
            const displayPrice = item.special_price ?? item.price;
            const hasDiscount =
              item.special_price != null && item.special_price < item.price;

            return (
              <Link
                key={item.sku}
                href={`/products/${item.url_key ?? item.sku}`}
                className="group overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="relative aspect-[4/5] bg-surface-muted">
                  {item.unified_thumbnail ? (
                    <Image
                      src={item.unified_thumbnail}
                      alt={item.display_name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : null}
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-ink">
                    {item.display_name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-ink">
                      ${displayPrice.toFixed(2)}
                    </span>
                    {hasDiscount ? (
                      <span className="text-ink-faint line-through">
                        ${item.price.toFixed(2)}
                      </span>
                    ) : null}
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
