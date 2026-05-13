import { fetchProductDetailBySkuGQL } from './product-graphql.service';
import {
  mapProductVariants,
  type ProductVariantsResponse,
} from '../services/product.mapper';

/**
 * 商品变体 API BFF 入口。
 *
 * 当前阶段只收口 Magento 详情查询与既有 variants 映射，
 * 不增加额外字段或变更返回结构。
 */
export async function getProductVariantsBFF(
  sku: string
): Promise<ProductVariantsResponse> {
  const raw = await fetchProductDetailBySkuGQL(sku);
  return mapProductVariants(raw);
}
