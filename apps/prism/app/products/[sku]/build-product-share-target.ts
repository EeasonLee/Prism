/**
 * Build a normalized ShareTarget for product detail pages.
 * Handles canonical PDP URLs and optional variant query parameters.
 */

import type { MagentoProduct } from '../../../lib/api/magento/types';
import type { ProductDetailSelection } from './ProductDetailClient';
import type { ShareTarget } from '../components/share/types';

export function buildProductShareTarget(
  product: MagentoProduct,
  pathname: string,
  origin: string,
  selection: ProductDetailSelection
): ShareTarget {
  // Build canonical PDP URL from origin and pathname
  let url = `${origin}${pathname}`;

  // Append variant query parameter only when configurable selection is complete
  if (
    product.type_id === 'configurable' &&
    selection.allSelected &&
    selection.selectedVariant?.sku
  ) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}variant=${encodeURIComponent(
      selection.selectedVariant.sku
    )}`;
  }

  return {
    type: 'product',
    title: product.name,
    url,
    imageUrl: product.image_url,
    meta: {
      sku: product.sku,
    },
  };
}
