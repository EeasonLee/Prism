import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UnifiedProductQueryResult } from '../lib/domain/product/query';

const {
  searchProductsFromMeilisearchMock,
  searchProductBySkuFromMeilisearchMock,
  resolveMagentoCategoryIdFromStrapiCategoryIdMock,
  resolveMagentoCategoryIdFromStrapiCategorySlugMock,
} = vi.hoisted(() => ({
  searchProductsFromMeilisearchMock: vi.fn(),
  searchProductBySkuFromMeilisearchMock: vi.fn(),
  resolveMagentoCategoryIdFromStrapiCategoryIdMock: vi.fn(),
  resolveMagentoCategoryIdFromStrapiCategorySlugMock: vi.fn(),
}));

vi.mock('../lib/infrastructure/product/meilisearch-product-repo', () => ({
  searchProductsFromMeilisearch: searchProductsFromMeilisearchMock,
  searchProductBySkuFromMeilisearch: searchProductBySkuFromMeilisearchMock,
  searchProductsBySkusFromMeilisearch: vi.fn(),
}));

vi.mock('../lib/infrastructure/product/strapi-category-repo', () => ({
  resolveMagentoCategoryIdFromStrapiCategoryId:
    resolveMagentoCategoryIdFromStrapiCategoryIdMock,
  resolveMagentoCategoryIdFromStrapiCategorySlug:
    resolveMagentoCategoryIdFromStrapiCategorySlugMock,
}));

const emptyResult: UnifiedProductQueryResult = {
  items: [],
  pagination: { page: 1, pageSize: 24, total: 0, totalPages: 1 },
  availableFilters: [],
};

describe('ProductQueryFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps strapiCategoryId to magentoCategoryId before querying products', async () => {
    resolveMagentoCategoryIdFromStrapiCategoryIdMock.mockResolvedValueOnce(88);
    searchProductsFromMeilisearchMock.mockResolvedValueOnce(emptyResult);
    const { productQueryFacade } = await import(
      '../lib/application/product/product-query-facade'
    );

    await productQueryFacade.queryProducts({
      strapiCategoryId: 15,
      page: 2,
      pageSize: 12,
    });

    expect(
      resolveMagentoCategoryIdFromStrapiCategoryIdMock
    ).toHaveBeenCalledWith(15);
    expect(searchProductsFromMeilisearchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        magentoCategoryId: 88,
        page: 2,
        pageSize: 12,
      })
    );
  });

  it('queries sku path via exact sku function', async () => {
    searchProductBySkuFromMeilisearchMock.mockResolvedValueOnce({
      sku: 'JD-001',
      name: 'A',
      displayName: 'A',
      urlKey: null,
      image: null,
      price: { value: 10, currency: 'USD' },
      originalPrice: null,
      inStock: true,
      type: 'simple',
      promotionLabel: null,
      reviewCount: 0,
      ratingPercentage: 0,
    });
    const { productQueryFacade } = await import(
      '../lib/application/product/product-query-facade'
    );

    const result = await productQueryFacade.queryProducts({ sku: 'JD-001' });
    expect(searchProductBySkuFromMeilisearchMock).toHaveBeenCalledWith(
      'JD-001'
    );
    expect(result.items).toHaveLength(1);
  });

  it('maps strapiCategorySlug to magentoCategoryId before querying products', async () => {
    resolveMagentoCategoryIdFromStrapiCategorySlugMock.mockResolvedValueOnce(
      66
    );
    searchProductsFromMeilisearchMock.mockResolvedValueOnce(emptyResult);
    const { productQueryFacade } = await import(
      '../lib/application/product/product-query-facade'
    );

    await productQueryFacade.queryProducts({
      strapiCategorySlug: 'blenders',
      page: 1,
      pageSize: 8,
    });

    expect(
      resolveMagentoCategoryIdFromStrapiCategorySlugMock
    ).toHaveBeenCalledWith('blenders');
    expect(searchProductsFromMeilisearchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        magentoCategoryId: 66,
        page: 1,
        pageSize: 8,
      })
    );
  });
});
