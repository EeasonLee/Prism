import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ProductCarouselProps } from '../types';
import { productQueryFacade } from '@/features/product';
import { ProductCard, mapCardItemToDisplay } from '@/features/product';

const DESKTOP_GRID = {
  'grid-2': 'md:grid-cols-2',
  'grid-3': 'md:grid-cols-3',
  'grid-6': 'md:grid-cols-3 lg:grid-cols-6',
};

export async function ProductCarousel({
  title,
  subtitle,
  productSkus,
  layout,
  showViewAll,
  viewAllLink,
}: ProductCarouselProps) {
  const skus = [...new Set(productSkus.map(sku => sku.trim()).filter(Boolean))];

  if (skus.length === 0) {
    return null;
  }

  const validProducts = await productQueryFacade
    .queryBySkus(skus)
    .catch(error => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `Failed to fetch carousel products from Meilisearch: ${message}`
      );
      return [];
    });

  if (validProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 lg:py-20">
      <div className="px-6 lg:px-[8vw]">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {subtitle && (
              <span className="micro-text mb-2 block text-brand">
                {subtitle}
              </span>
            )}
            <h2 className="heading-3 text-ink">{title}</h2>
          </div>
          {showViewAll && viewAllLink && (
            <Link
              href={viewAllLink}
              className="group flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              View All
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        <div
          className={`flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar md:grid md:gap-4 ${DESKTOP_GRID[layout]}`}
        >
          {validProducts.map(product => (
            <div
              key={product.sku}
              className="w-[68%] shrink-0 snap-start md:w-auto"
            >
              <ProductCard
                product={mapCardItemToDisplay(product)}
                variant="grid"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
