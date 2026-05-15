/**
 * Build a normalized ShareTarget for product detail pages.
 * Uses current browser URL and optional variant query parameters.
 */

import type { UnifiedProduct } from '@/features/product';
import type { ProductDetailSelection } from './ProductDetailClient';
import type { ShareTarget } from '@/app/_ui/share';

function stripHtml(value?: string | null): string {
  if (!value) {
    return '';
  }
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildShareText(product: UnifiedProduct): string | undefined {
  const price = product.special_price ?? product.final_price ?? product.price;
  const currency = product.currency ? ` ${product.currency}` : '';
  const priceText =
    typeof price === 'number' && Number.isFinite(price)
      ? ` | ${price}${currency}`
      : '';
  const description = stripHtml(
    product.short_description ?? product.description
  );
  const shortDescription =
    description.length > 110
      ? `${description.slice(0, 109).trimEnd()}...`
      : description;
  const text = `${product.name}${priceText}${
    shortDescription ? ` | ${shortDescription}` : ''
  }`;
  return text.trim() || undefined;
}

export function buildProductShareTarget(
  product: UnifiedProduct,
  currentUrl: string,
  selection: ProductDetailSelection
): ShareTarget {
  const url = new URL(currentUrl);

  // Append variant query parameter only when configurable selection is complete
  if (
    product.type_id === 'configurable' &&
    selection.allSelected &&
    selection.selectedVariant?.sku
  ) {
    url.searchParams.set('variant', selection.selectedVariant.sku);
  }

  return {
    type: 'product',
    title: product.name,
    text: buildShareText(product),
    url: url.toString(),
    imageUrl: product.image_url ?? product.thumbnail_url ?? undefined,
    meta: {
      sku: product.sku,
    },
  };
}
