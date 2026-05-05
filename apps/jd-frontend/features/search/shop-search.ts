import { productQueryFacade } from '@/features/product/query-facade';
import type { ProductCardItem } from '@/features/product/bff-types';

function moveOutOfStockToEnd(items: ProductCardItem[]): ProductCardItem[] {
  const inStock: ProductCardItem[] = [];
  const outOfStock: ProductCardItem[] = [];

  for (const item of items) {
    if (item.inStock) {
      inStock.push(item);
    } else {
      outOfStock.push(item);
    }
  }

  return [...inStock, ...outOfStock];
}

export type ShopSortOption = 'featured' | 'price_asc' | 'price_desc' | 'newest';

export interface ShopSearchParams {
  q?: string;
  slug?: string;
  brand?: string;
  size?: string;
  stockStatus?: string;
  category?: string;
  categorySlug?: string;
  /** Magento category id (numeric). */
  categoryId?: number;
  /** Strapi product-category id when CMS stores Strapi PK instead of Magento id. */
  strapiCategoryId?: number;
  /** When neither Magento id nor Strapi id applies, pass Strapi category slug for mapping. */
  strapiCategorySlug?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: ShopSortOption;
  page?: number;
  pageSize?: number;
}

export interface ShopPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ShopFilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface ShopAvailableFilter {
  key: string;
  label: string;
  options: ShopFilterOption[];
}

export interface ShopSearchResult {
  items: ProductCardItem[];
  pagination: ShopPagination;
  availableFilters: ShopAvailableFilter[];
}

const FACET_CONFIG = [
  { key: 'brand', label: 'Brand' },
  { key: 'stock_status', label: 'Availability' },
] as const;

function buildAvailableFilters(
  fd?: Record<string, Record<string, number>>
): ShopAvailableFilter[] {
  if (!fd) return [];
  return FACET_CONFIG.filter(c => fd[c.key]).map(c => ({
    key: c.key,
    label: c.label,
    options: Object.entries(fd[c.key]).map(([value, count]) => ({
      value,
      label: value,
      count,
    })),
  }));
}

export async function searchProducts(
  params: ShopSearchParams
): Promise<ShopSearchResult> {
  const hasMagentoCategoryId =
    typeof params.categoryId === 'number' &&
    Number.isFinite(params.categoryId) &&
    params.categoryId > 0;
  const hasStrapiCategoryId =
    typeof params.strapiCategoryId === 'number' &&
    Number.isFinite(params.strapiCategoryId) &&
    params.strapiCategoryId > 0;

  const result = await productQueryFacade.queryProducts({
    q: params.q,
    ...(hasStrapiCategoryId
      ? { strapiCategoryId: params.strapiCategoryId }
      : hasMagentoCategoryId
      ? { magentoCategoryId: params.categoryId }
      : params.strapiCategorySlug?.trim()
      ? { strapiCategorySlug: params.strapiCategorySlug.trim() }
      : {}),
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    filters: {
      brand: params.brand,
      size: params.size,
      stockStatus: params.stockStatus,
      category: params.category,
      priceMin: params.priceMin,
      priceMax: params.priceMax,
    },
  });

  const orderedItems =
    params.sort === undefined || params.sort === 'featured'
      ? moveOutOfStockToEnd(result.items)
      : result.items;

  return {
    items: orderedItems,
    pagination: result.pagination,
    availableFilters:
      result.availableFilters.length > 0
        ? result.availableFilters.map(filter => ({
            key: filter.key,
            label: filter.label,
            options: filter.options,
          }))
        : buildAvailableFilters(undefined),
  };
}
