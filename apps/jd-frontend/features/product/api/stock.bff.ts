import { fetchProductDetailBySkuGQL } from './product-graphql.service';

export interface ProductStockResponse {
  sku: string;
  inStock: boolean;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK';
  qty: null;
  isLowStock: boolean;
}

/**
 * 商品库存 API BFF 入口。
 *
 * 当前阶段只透传 Magento 库存状态，不引入额外库存聚合或缓存。
 */
export async function getProductStockBFF(
  sku: string
): Promise<ProductStockResponse> {
  const raw = await fetchProductDetailBySkuGQL(sku);

  return {
    sku: raw.sku,
    inStock: raw.stock_status === 'IN_STOCK',
    stockStatus: raw.stock_status,
    qty: null,
    isLowStock: false,
  };
}
