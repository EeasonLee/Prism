import type { FeaturedProductsProps } from '../types';
import {
  productQueryFacade,
  ProductCard,
  mapCardItemToDisplay,
} from '@/features/product';

export async function FeaturedProducts({
  title,
  subtitle,
  products,
}: FeaturedProductsProps) {
  const skus = [...new Set(products.map(sku => sku.trim()).filter(Boolean))];

  if (skus.length === 0) {
    return null;
  }

  const validProducts = await productQueryFacade
    .queryBySkus(skus)
    .catch(error => {
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

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {validProducts.map(product => (
            <ProductCard
              key={product.sku}
              product={mapCardItemToDisplay(product)}
              variant="featured"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
