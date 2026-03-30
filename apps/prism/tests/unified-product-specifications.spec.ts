import { describe, expect, it } from 'vitest';
import { mergeProduct } from '../lib/api/unified-product';
import type { MagentoProduct } from '../lib/api/magento/types';
import type { StrapiProductEnrichment } from '../lib/api/strapi/product-enrichment';

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
  it('exposes normalized specifications from Strapi enrichment', () => {
    const enrichment: StrapiProductEnrichment = {
      sku: 'JD-AF550',
      specifications: [
        {
          id: 'general',
          title: 'General',
          rows: [
            {
              key: 'capacity',
              label: 'Capacity',
              value: '5.5L',
              source: 'template',
              highlighted: true,
            },
          ],
        },
      ],
    };

    const result = mergeProduct(baseProduct, enrichment);

    expect(result.specifications).toEqual(enrichment.specifications);
  });

  it('keeps specifications undefined when Strapi enrichment is absent', () => {
    const result = mergeProduct(baseProduct);

    expect(result.specifications).toBeUndefined();
  });
});
