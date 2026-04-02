import { describe, expect, it } from 'vitest';
import { mergeProduct } from '../lib/api/unified-product';
import type { MagentoProduct } from '../lib/api/magento/types';

const baseProduct: MagentoProduct = {
  id: 1,
  sku: 'JD-AF550',
  name: 'Air Fryer',
  url_key: 'air-fryer',
  price: 199.99,
  final_price: 199.99,
  currency: 'USD',
  stock_status: 'IN_STOCK',
  status: 1,
  visibility: 4,
  type_id: 'simple',
  image_url: null,
  thumbnail_url: null,
  short_description: null,
  description: null,
  media_gallery: [],
  categories: [],
  configurable_options: [],
  variants: [],
};

describe('mergeProduct specifications', () => {
  it('exposes specifications from Magento custom attribute', () => {
    const product: MagentoProduct = {
      ...baseProduct,
      specifications: 'Capacity: 5.5L | Power: 1500W',
    };

    const result = mergeProduct(product);

    expect(result.specifications).toBe('Capacity: 5.5L | Power: 1500W');
  });

  it('keeps specifications null when not set', () => {
    const result = mergeProduct(baseProduct);

    expect(result.specifications).toBeNull();
  });
});
