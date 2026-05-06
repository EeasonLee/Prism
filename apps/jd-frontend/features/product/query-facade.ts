import type {
  UnifiedProductQuery,
  UnifiedProductQueryResult,
} from '@/features/product/query.model';
import {
  searchProductsFromMeilisearch,
  searchProductBySkuFromMeilisearch,
  searchProductsBySkusFromMeilisearch,
} from '@/features/product/meilisearch.repo';
import {
  resolveMagentoCategoryIdFromStrapiCategoryId,
  resolveMagentoCategoryIdFromStrapiCategorySlug,
} from '@/shared/mapping/category-mapping';
import type { ProductCardItem } from '@/features/product/bff-types';

function normalizePageSize(size: number | undefined, fallback: number): number {
  return Math.min(48, Math.max(1, Number(size ?? fallback)));
}

function normalizePage(page: number | undefined): number {
  return Math.max(1, Number(page ?? 1));
}

export class ProductQueryFacade {
  async queryProducts(
    query: UnifiedProductQuery
  ): Promise<UnifiedProductQueryResult> {
    const startedAt = Date.now();
    const page = normalizePage(query.page);
    const pageSize = normalizePageSize(query.pageSize, 24);
    const filters = query.filters ?? {};
    const facetKeys =
      query.includeFacets === false
        ? undefined
        : (['brand', 'size', 'categories', 'stock_status'] as const);

    if (query.sku) {
      const item = await searchProductBySkuFromMeilisearch(query.sku);
      const result = {
        items: item ? [item] : [],
        pagination: {
          page: 1,
          pageSize: 1,
          total: item ? 1 : 0,
          totalPages: 1,
        },
        availableFilters: [],
      };
      console.info('[ProductQueryFacade]', {
        queryType: 'sku',
        sku: query.sku,
        durationMs: Date.now() - startedAt,
        hitCount: result.items.length,
      });
      return result;
    }

    if (typeof query.strapiCategoryId === 'number') {
      let magentoCategoryId =
        await resolveMagentoCategoryIdFromStrapiCategoryId(
          query.strapiCategoryId
        );
      if (!magentoCategoryId && query.strapiCategoryId > 0) {
        magentoCategoryId = query.strapiCategoryId;
      }
      const result = await searchProductsFromMeilisearch({
        q: query.q,
        magentoCategoryId,
        page,
        pageSize,
        sort: query.sort,
        filters,
        facets: facetKeys ? [...facetKeys] : undefined,
      });
      console.info('[ProductQueryFacade]', {
        queryType: 'strapiCategoryId',
        strapiCategoryId: query.strapiCategoryId,
        resolvedMagentoCategoryId: magentoCategoryId,
        durationMs: Date.now() - startedAt,
        hitCount: result.items.length,
      });
      return result;
    }
    if (query.strapiCategorySlug?.trim()) {
      const strapiCategorySlug = query.strapiCategorySlug.trim();
      const magentoCategoryId =
        await resolveMagentoCategoryIdFromStrapiCategorySlug(
          strapiCategorySlug
        );
      if (!magentoCategoryId) {
        const result = {
          items: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 1,
          },
          availableFilters: [],
        };
        console.info('[ProductQueryFacade]', {
          queryType: 'strapiCategorySlug',
          strapiCategorySlug,
          resolvedMagentoCategoryId: null,
          durationMs: Date.now() - startedAt,
          hitCount: 0,
        });
        return result;
      }
      const result = await searchProductsFromMeilisearch({
        q: query.q,
        magentoCategoryId,
        page,
        pageSize,
        sort: query.sort,
        filters,
        facets: facetKeys ? [...facetKeys] : undefined,
      });
      console.info('[ProductQueryFacade]', {
        queryType: 'strapiCategorySlug',
        strapiCategorySlug,
        resolvedMagentoCategoryId: magentoCategoryId,
        durationMs: Date.now() - startedAt,
        hitCount: result.items.length,
      });
      return result;
    }

    const result = await searchProductsFromMeilisearch({
      q: query.q,
      magentoCategoryId: query.magentoCategoryId,
      page,
      pageSize,
      sort: query.sort,
      filters,
      facets: facetKeys ? [...facetKeys] : undefined,
    });
    console.info('[ProductQueryFacade]', {
      queryType: query.magentoCategoryId ? 'magentoCategoryId' : 'search',
      resolvedMagentoCategoryId: query.magentoCategoryId ?? null,
      durationMs: Date.now() - startedAt,
      hitCount: result.items.length,
    });
    return result;
  }

  async queryBySkus(skus: string[]): Promise<ProductCardItem[]> {
    return searchProductsBySkusFromMeilisearch(skus);
  }
}

export const productQueryFacade = new ProductQueryFacade();
