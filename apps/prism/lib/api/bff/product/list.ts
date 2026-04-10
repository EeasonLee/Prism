import type { ProductCardItem, ProductListResult } from './types';
import { productService } from '@/lib/services/product.service';

export type { ProductCardItem, ProductListResult } from './types';

export interface GetProductListBFFParams {
  categoryId?: number;
  page?: number;
  limit?: number;
  sort?: 'name' | 'price';
}

interface ProductListSourceItem {
  sku: string;
  name: string;
  url_key: string | null;
  price_range?: {
    minimum_price?: {
      final_price?: {
        value?: number;
      };
    };
  };
  thumbnail?: {
    url?: string | null;
  } | null;
  stock_status: 'IN_STOCK' | 'OUT_OF_STOCK';
}

function mapProductCardItem(item: ProductListSourceItem): ProductCardItem {
  const priceValue =
    item.price_range?.minimum_price?.final_price?.value ?? null;

  return {
    sku: item.sku,
    name: item.name,
    displayName: item.name,
    urlKey: item.url_key ?? null,
    image: item.thumbnail?.url ?? null,
    price: {
      value: priceValue,
      currency: null,
    },
    originalPrice: null,
    inStock: item.stock_status === 'IN_STOCK',
    type: 'simple',
    promotionLabel: null,
    reviewCount: 0,
    ratingPercentage: 0,
  };
}

/**
 * Product list BFF 入口。
 *
 * 当前阶段只做既有列表查询能力的收口，不改变数据来源、映射逻辑或返回结构。
 * 不在这里引入 Redis、Meilisearch、额外聚合或 DTO 改造。
 */
export async function getProductListBFF(
  params: GetProductListBFFParams
): Promise<ProductListResult> {
  const response = await productService.getProducts({
    categoryId: params.categoryId,
    page: params.page,
    pageSize: params.limit,
    sort: params.sort,
  });

  return {
    items: response.items.map(item =>
      mapProductCardItem(item as ProductListSourceItem)
    ),
    pagination: {
      page: response.page_info.current_page,
      pageSize: response.page_info.page_size,
      total: response.total_count,
      totalPages: response.page_info.total_pages,
    },
  };
}
