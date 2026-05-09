import type { FeaturedProductsProps } from '../types';
import { productQueryFacade } from '@/features/product';
import { FeaturedProductCard } from './FeaturedProductCard';

function stripHtml(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTopSellingPoints(
  richText: string | null | undefined,
  maxItems = 3
): string[] {
  if (!richText) return [];
  const liMatches = [...richText.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  return liMatches
    .map(match => stripHtml(match[1] ?? ''))
    .filter(Boolean)
    .slice(0, maxItems);
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
          {validProducts.map(product => {
            const price = product.price.value;
            const originalPrice = product.originalPrice;
            const currency = product.price.currency ?? 'USD';
            const displayName =
              product.shortName ??
              product.displayName ??
              product.name ??
              product.sku;
            const longTitle = stripHtml(product.longTitle);
            const sellingPoints = extractTopSellingPoints(
              product.shortDescription
            );
            const discount =
              price && originalPrice && originalPrice > price
                ? Math.round(((originalPrice - price) / originalPrice) * 100)
                : null;
            const imageUrl =
              product.image ?? '/images/product_soymilk_card.jpg';

            return (
              <FeaturedProductCard
                key={product.sku}
                product={{
                  sku: product.sku,
                  urlKey: product.urlKey,
                  imageUrl,
                  displayName,
                  promotionLabel: product.promotionLabel,
                  longTitle,
                  sellingPoints,
                  price,
                  originalPrice,
                  currency,
                  discount,
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
