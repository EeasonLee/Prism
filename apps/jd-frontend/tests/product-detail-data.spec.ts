import { describe, expect, it } from 'vitest';
import { buildPdpSectionNav } from '../app/products/[slug]/pdp-section-nav';
import type { UnifiedProduct } from '@/features/product/unified.api';
import type { ProductSpecificationGroup } from '@/features/product/enrichment.api';

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
    const specifications: ProductSpecificationGroup[] = [
      {
        id: 'general',
        title: 'General',
        rows: [{ key: 'capacity', label: 'Capacity', value: '5.5L' }],
      },
    ];

    const sections = buildPdpSectionNav(null, {
      ...baseProduct,
      specifications: specifications as unknown as string,
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

  it('adds Videos before Recipes when CMS has product_videos', () => {
    const sections = buildPdpSectionNav(
      {
        product_videos: [
          {
            id: 1,
            title: 'Demo',
            caption: 'Caption',
            thumbnailUrl: 'https://example.com/t.jpg',
            videoUrl: 'https://example.com/v',
          },
        ],
        recipes: [
          {
            id: 1,
            title: 'R',
            image: '',
            time: '1 min',
            servings: 1,
            difficulty: 'Easy',
            tags: [],
          },
        ],
      },
      baseProduct
    );

    const videoIdx = sections.findIndex(s => s.id === 'section-videos');
    const recipesIdx = sections.findIndex(s => s.id === 'section-recipes');
    expect(videoIdx).toBeGreaterThan(-1);
    expect(recipesIdx).toBeGreaterThan(-1);
    expect(videoIdx).toBeLessThan(recipesIdx);
  });
});
