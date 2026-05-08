import { describe, expect, it, vi } from 'vitest';
import { mergeProduct } from '@/features/product';
import type { MagentoProduct } from '../lib/api/magento/types';

const {
  fetchProductDetailBySkuGQLMock,
  fetchProductDetailByUrlKeyGQLMock,
  getRelatedProductsBFFMock,
  fetchReviewsBySkuMock,
  fetchReviewSummaryBySkuMock,
  fetchProductQaBySkuMock,
  fetchPdpRecipesBySkuMock,
  fetchPdpArticlesBySkuMock,
  fetchPdpProductVideosBySkuMock,
} = vi.hoisted(() => ({
  fetchProductDetailBySkuGQLMock: vi.fn(),
  fetchProductDetailByUrlKeyGQLMock: vi.fn(),
  getRelatedProductsBFFMock: vi.fn(),
  fetchReviewsBySkuMock: vi.fn(),
  fetchReviewSummaryBySkuMock: vi.fn(),
  fetchProductQaBySkuMock: vi.fn(),
  fetchPdpRecipesBySkuMock: vi.fn(),
  fetchPdpArticlesBySkuMock: vi.fn(),
  fetchPdpProductVideosBySkuMock: vi.fn(),
}));

vi.mock('@/features/product/product-graphql.service', () => ({
  fetchProductDetailBySkuGQL: fetchProductDetailBySkuGQLMock,
  fetchProductDetailByUrlKeyGQL: fetchProductDetailByUrlKeyGQLMock,
}));

vi.mock('@/features/product/related.bff', () => ({
  getRelatedProductsBFF: getRelatedProductsBFFMock,
}));

vi.mock('@/features/product/reviews.api', () => ({
  fetchReviewsBySku: fetchReviewsBySkuMock,
  fetchReviewSummaryBySku: fetchReviewSummaryBySkuMock,
}));

vi.mock('@/features/product/qa.api', () => ({
  fetchProductQaBySku: fetchProductQaBySkuMock,
}));

vi.mock('@/features/product/content.api', () => ({
  fetchPdpRecipesBySku: fetchPdpRecipesBySkuMock,
  fetchPdpArticlesBySku: fetchPdpArticlesBySkuMock,
  fetchPdpProductVideosBySku: fetchPdpProductVideosBySkuMock,
}));

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

  it('renders plain-text descriptions into HTML paragraphs and lists', () => {
    const product: MagentoProduct = {
      ...baseProduct,
      short_description: 'Fast heat\n\n- Crisp finish\n- Dishwasher safe',
      description: 'Line one\nLine two\n\n1. Prep\n2. Cook',
    };

    const result = mergeProduct(product);

    expect(result.short_description_html).toBe(
      '<p>Fast heat</p><ul><li>Crisp finish</li><li>Dishwasher safe</li></ul>'
    );
    expect(result.description_html).toBe(
      '<p>Line one Line two</p><ol><li>Prep</li><li>Cook</li></ol>'
    );
    expect(result.product_detail_html).toBe(result.description_html);
  });

  it('decodes serialized html descriptions before rendering', () => {
    const product: MagentoProduct = {
      ...baseProduct,
      short_description:
        '"<p class=\\"intro\\">Fast heat<\\/p><ul><li>Crisp finish<\\/li><\\/ul>"',
      description: '&lt;p&gt;Deep clean&lt;/p&gt;',
    };

    const result = mergeProduct(product);

    expect(result.short_description_html).toBe(
      '<p class="intro">Fast heat</p><ul><li>Crisp finish</li></ul>'
    );
    expect(result.description_html).toBe('<p>Deep clean</p>');
    expect(result.product_detail_html).toBe('<p>Deep clean</p>');
  });
});

describe('product detail aggregate', () => {
  it('returns core data eagerly and resolves deferred relations and reviews', async () => {
    fetchProductDetailByUrlKeyGQLMock.mockResolvedValueOnce({
      id: 30,
      sku: 'BUYDEEM-K568',
      url_key: 'buydeem-k568',
      name: 'Buydeem K568',
      __typename: 'SimpleProduct',
      long_title: null,
      cp_label: null,
      cp_code: null,
      cp_date: null,
      cp_price: null,
      meta_title: null,
      meta_description: null,
      price_range: {
        minimum_price: {
          regular_price: { value: 199.99, currency: 'USD' },
          final_price: { value: 149.99, currency: 'USD' },
        },
      },
      thumbnail: { url: 'https://example.com/kettle.jpg', label: null },
      media_gallery: [],
      stock_status: 'IN_STOCK',
      rating_summary: 80,
      review_count: 12,
      categories: [],
      related_products: [],
      upsell_products: [
        {
          id: 31,
          sku: 'BUYDEEM-CUP',
          url_key: 'buydeem-cup',
          name: 'Buydeem Cup',
          thumbnail: { url: 'https://example.com/cup.jpg', label: null },
          price_range: {
            minimum_price: {
              regular_price: { value: 29.99, currency: 'USD' },
              final_price: { value: 24.99, currency: 'USD' },
            },
          },
          stock_status: 'IN_STOCK',
        },
      ],
      description: { html: '<p>Desc</p>' },
      short_description: { html: '<p>Short</p>' },
      configurable_options: [],
      variants: [],
      options: [],
    });

    getRelatedProductsBFFMock.mockResolvedValueOnce([
      {
        sku: 'BUYDEEM-TEA',
        name: 'Buydeem Tea',
        price: 12.5,
        image: 'https://example.com/tea.jpg',
        inStock: true,
      },
    ]);

    fetchReviewSummaryBySkuMock.mockResolvedValueOnce({
      sku: 'BUYDEEM-K568',
      average: 4.8,
      total: 1,
      distribution: {
        '1': 0,
        '1.5': 0,
        '2': 0,
        '2.5': 0,
        '3': 0,
        '3.5': 0,
        '4': 0,
        '4.5': 0,
        '5': 1,
      },
    });

    fetchReviewsBySkuMock.mockResolvedValueOnce({
      items: [
        {
          id: 99,
          authorName: 'Alice',
          rating: 5,
          title: 'Great',
          content: 'Works well',
          createdAt: '2026-04-10T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        pageCount: 1,
        total: 1,
      },
    });

    fetchProductQaBySkuMock.mockResolvedValueOnce({
      productId: 30,
      sku: 'BUYDEEM-K568',
      items: [
        {
          id: 501,
          productId: 30,
          kind: 'user_qa',
          sku: 'BUYDEEM-K568',
          productSku: 'BUYDEEM-K568',
          authorName: 'Taylor',
          questionText: 'Does it support 220V?',
          answerText: 'No, this model is 120V only.',
          answeredAt: '2026-04-09T00:00:00.000Z',
          answeredBy: 'Support',
          status: 'answered',
          helpfulCount: 3,
          viewerHasMarkedHelpful: false,
          createdAt: '2026-04-08T00:00:00.000Z',
          updatedAt: '2026-04-09T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        pageCount: 1,
        total: 1,
      },
    });

    fetchPdpRecipesBySkuMock.mockResolvedValueOnce([
      {
        id: 71,
        title: 'Kettle tea eggs',
        image: 'https://example.com/recipe.jpg',
        href: '/recipes/kettle-tea-eggs',
        time: '20 min',
        servings: 2,
        difficulty: 'Easy',
        tags: ['Breakfast'],
      },
    ]);

    fetchPdpArticlesBySkuMock.mockResolvedValueOnce([
      {
        id: 81,
        title: 'How to descale your kettle',
        image: 'https://example.com/article.jpg',
        date: 'Apr 9, 2026',
        excerpt: 'Keep your kettle clean.',
        href: '/blog/kettle-care',
        readTime: '4 min read',
      },
    ]);
    fetchPdpProductVideosBySkuMock.mockResolvedValueOnce([]);

    const { getProductDetailAggregate, resolveProductDetailAggregate } =
      await import('@/features/product/detail.bff');

    const aggregate = await getProductDetailAggregate('buydeem-k568');

    expect(aggregate.core.product.sku).toBe('BUYDEEM-K568');
    expect(aggregate.core.stock).toEqual({
      sku: 'BUYDEEM-K568',
      inStock: true,
      stockStatus: 'IN_STOCK',
      qty: null,
      isLowStock: false,
    });
    expect(aggregate.core.price).toEqual({
      regular: 199.99,
      final: 149.99,
      special: 149.99,
      currency: 'USD',
    });

    await expect(aggregate.deferred.related).resolves.toEqual([
      {
        id: 0,
        sku: 'BUYDEEM-TEA',
        url_key: null,
        name: 'Buydeem Tea',
        display_name: 'Buydeem Tea',
        price: 12.5,
        special_price: null,
        type_id: 'simple',
        is_in_stock: true,
        review_count: 0,
        rating_percentage: 0,
        promotion_label: null,
        unified_thumbnail: 'https://example.com/tea.jpg',
      },
    ]);

    await expect(aggregate.deferred.upsell).resolves.toEqual([
      {
        id: 31,
        sku: 'BUYDEEM-CUP',
        url_key: 'buydeem-cup',
        name: 'Buydeem Cup',
        display_name: 'Buydeem Cup',
        price: 29.99,
        special_price: 24.99,
        type_id: 'simple',
        is_in_stock: true,
        review_count: 0,
        rating_percentage: 0,
        promotion_label: null,
        unified_thumbnail: 'https://example.com/cup.jpg',
      },
    ]);

    await expect(aggregate.deferred.reviews).resolves.toEqual({
      summary: {
        sku: 'BUYDEEM-K568',
        average: 4.8,
        total: 1,
        distribution: {
          '1': 0,
          '1.5': 0,
          '2': 0,
          '2.5': 0,
          '3': 0,
          '3.5': 0,
          '4': 0,
          '4.5': 0,
          '5': 1,
        },
      },
      items: [
        {
          id: 99,
          authorName: 'Alice',
          rating: 5,
          title: 'Great',
          content: 'Works well',
          createdAt: '2026-04-10T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        pageCount: 1,
        total: 1,
      },
    });

    await expect(aggregate.deferred.productQa).resolves.toMatchObject({
      sku: 'BUYDEEM-K568',
      items: [{ id: 501 }],
    });

    await expect(aggregate.deferred.cms).resolves.toEqual({
      recipes: [
        {
          id: 71,
          title: 'Kettle tea eggs',
          image: 'https://example.com/recipe.jpg',
          href: '/recipes/kettle-tea-eggs',
          time: '20 min',
          servings: 2,
          difficulty: 'Easy',
          tags: ['Breakfast'],
        },
      ],
      blog_posts: [
        {
          id: 81,
          title: 'How to descale your kettle',
          image: 'https://example.com/article.jpg',
          date: 'Apr 9, 2026',
          excerpt: 'Keep your kettle clean.',
          href: '/blog/kettle-care',
          readTime: '4 min read',
        },
      ],
      product_videos: [],
    });

    await expect(
      resolveProductDetailAggregate(aggregate)
    ).resolves.toMatchObject({
      product: { sku: 'BUYDEEM-K568' },
      stock: { sku: 'BUYDEEM-K568' },
      related: [{ sku: 'BUYDEEM-TEA' }],
      upsell: [{ sku: 'BUYDEEM-CUP' }],
      reviews: {
        summary: { sku: 'BUYDEEM-K568' },
        items: [{ id: 99 }],
      },
      productQa: {
        sku: 'BUYDEEM-K568',
        items: [{ id: 501 }],
      },
      cms: {
        recipes: [{ id: 71 }],
        blog_posts: [{ id: 81 }],
      },
    });
  });
});

describe('fetchUnifiedProductBySku mapping', () => {
  it('maps GraphQL customizable option aliases into Magento options', async () => {
    const rawProduct = {
      id: 10,
      sku: 'CUSTOM-MUG',
      url_key: 'custom-mug',
      name: 'Custom Mug',
      long_title: null,
      cp_label: null,
      cp_code: null,
      cp_date: null,
      cp_price: null,
      meta_title: null,
      meta_description: null,
      price_range: {
        minimum_price: {
          regular_price: { value: 20, currency: 'USD' },
          final_price: { value: 18, currency: 'USD' },
        },
      },
      thumbnail: null,
      media_gallery: [],
      stock_status: 'IN_STOCK',
      rating_summary: 0,
      review_count: 0,
      categories: [],
      description: { html: '<p>Desc</p>' },
      short_description: { html: '<p>Short</p>' },
      configurable_options: [],
      variants: [],
      options: [
        {
          __typename: 'CustomizableDropDownOption',
          option_id: 1,
          title: 'Color',
          required: true,
          sort_order: 0,
          dropdownValue: [
            {
              option_type_id: 11,
              title: 'Red',
              price: 2,
              price_type: 'fixed',
              sort_order: 0,
            },
          ],
        },
        {
          __typename: 'CustomizableFieldOption',
          option_id: 2,
          title: 'Engraving',
          required: false,
          sort_order: 1,
          fieldValue: {
            price: 0,
            price_type: 'fixed',
            max_characters: 20,
          },
        },
        {
          __typename: 'CustomizableFileOption',
          option_id: 3,
          title: 'Upload',
          required: false,
          sort_order: 2,
        },
      ],
    };

    fetchProductDetailBySkuGQLMock.mockResolvedValueOnce(rawProduct);

    const { fetchUnifiedProductBySku } = await import(
      '@/features/product/unified.api'
    );
    const product = await fetchUnifiedProductBySku('CUSTOM-MUG');

    expect(product.options).toEqual([
      {
        option_id: 1,
        title: 'Color',
        required: true,
        sort_order: 0,
        type: 'drop_down',
        values: [
          {
            option_type_id: 11,
            title: 'Red',
            price: 2,
            price_type: 'fixed',
            sort_order: 0,
          },
        ],
      },
      {
        option_id: 2,
        title: 'Engraving',
        required: false,
        sort_order: 1,
        type: 'field',
        max_characters: 20,
      },
    ]);
    expect(product.related_products).toEqual([]);
    expect(product.upsell_products).toEqual([]);
  });

  it('maps Magento related products into linked PDP cards', async () => {
    fetchProductDetailBySkuGQLMock.mockResolvedValueOnce({
      id: 20,
      sku: 'BUYDEEM-G563',
      url_key: 'buydeem-g563',
      name: 'Buydeem G563',
      long_title: null,
      cp_label: null,
      cp_code: null,
      cp_date: null,
      cp_price: null,
      meta_title: null,
      meta_description: null,
      price_range: {
        minimum_price: {
          regular_price: { value: 129.99, currency: 'USD' },
          final_price: { value: 99.99, currency: 'USD' },
        },
      },
      thumbnail: null,
      media_gallery: [],
      stock_status: 'IN_STOCK',
      rating_summary: 0,
      review_count: 0,
      categories: [],
      related_products: [
        {
          id: 21,
          sku: 'BUYDEEM-TEAPOT',
          url_key: 'buydeem-teapot',
          name: 'Buydeem Teapot',
          thumbnail: { url: 'https://example.com/teapot.jpg', label: null },
          price_range: {
            minimum_price: {
              regular_price: { value: 59.99, currency: 'USD' },
              final_price: { value: 49.99, currency: 'USD' },
            },
          },
          stock_status: 'IN_STOCK',
        },
      ],
      upsell_products: [],
      description: { html: '<p>Desc</p>' },
      short_description: { html: '<p>Short</p>' },
      configurable_options: [],
      variants: [],
      options: [],
    });

    const { fetchUnifiedProductBySku } = await import(
      '@/features/product/unified.api'
    );
    const product = await fetchUnifiedProductBySku('BUYDEEM-G563');

    expect(product.related_products).toEqual([
      {
        id: 21,
        sku: 'BUYDEEM-TEAPOT',
        url_key: 'buydeem-teapot',
        name: 'Buydeem Teapot',
        display_name: 'Buydeem Teapot',
        price: 59.99,
        special_price: 49.99,
        type_id: 'simple',
        is_in_stock: true,
        review_count: 0,
        rating_percentage: 0,
        promotion_label: null,
        unified_thumbnail: 'https://example.com/teapot.jpg',
      },
    ]);
  });
});
