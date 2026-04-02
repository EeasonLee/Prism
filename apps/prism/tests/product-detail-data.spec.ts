import { describe, expect, it } from 'vitest';
import { buildPdpSectionNav } from '../app/products/[slug]/product-detail-data';
import type { UnifiedProduct } from '../lib/api/unified-product';

const baseProduct: UnifiedProduct = {
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
  _enriched: true,
  display_name: 'Air Fryer',
  subtitle: null,
  short_description_html: null,
  description_html: null,
  product_detail_html: null,
  unified_images: [],
  unified_thumbnail: null,
  promotion_label: null,
  promotion_expires_at: null,
  is_featured: false,
  seo_title: null,
  seo_description: null,
};

describe('buildPdpSectionNav', () => {
  it('adds Specifications when product has specification groups', () => {
    const sections = buildPdpSectionNav(null, {
      ...baseProduct,
      specifications: [
        {
          id: 'general',
          title: 'General',
          rows: [{ key: 'capacity', label: 'Capacity', value: '5.5L' }],
        },
      ],
    });

    expect(sections).toContainEqual({
      id: 'section-specifications',
      label: 'Specifications',
    });
  });

  it('does not add Specifications when no specification groups exist', () => {
    const sections = buildPdpSectionNav(null, baseProduct);

    expect(sections).not.toContainEqual({
      id: 'section-specifications',
      label: 'Specifications',
    });
  });
});
