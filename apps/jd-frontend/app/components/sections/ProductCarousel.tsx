import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ProductCarouselProps } from '@/lib/api/cms-page.types';
import { fetchUnifiedProductBySku } from '@/lib/api/unified-product';
import { ProductCard } from './ProductCard';

const LAYOUT_CLASSES = {
  'grid-2': 'grid-cols-2',
  'grid-3': 'grid-cols-2 md:grid-cols-3',
  'grid-6': 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
};

export async function ProductCarousel({
  title,
  subtitle,
  productSkus,
  layout,
  showViewAll,
  viewAllLink,
}: ProductCarouselProps) {
  const skus = productSkus
    .map(sku => sku.trim())
    .filter((sku): sku is string => sku.length > 0);

  if (skus.length === 0) {
    return null;
  }

  const products = await Promise.all(
    skus.map(async sku => {
      try {
        return await fetchUnifiedProductBySku(sku);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // CMS 里偶发无效 SKU 时，按“跳过该卡片”处理，避免整块渲染失败。
        if (!message.includes('Product not found')) {
          console.warn(`Failed to fetch product ${sku}: ${message}`);
        }
        return null;
      }
    })
  );

  const validProducts = products.filter(
    (p): p is NonNullable<typeof p> => p !== null
  );

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
            <h2
              className="heading-3 text-ink"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {title}
            </h2>
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

        <div className={`grid gap-3 lg:gap-4 ${LAYOUT_CLASSES[layout]}`}>
          {validProducts.map(product => (
            <ProductCard key={product.sku} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
