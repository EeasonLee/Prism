import type { UnifiedProduct } from '../../../lib/api/unified-product';
import type { ProductPageCms } from './mock-data';

/**
 * 商品详情页服务端组装结果。
 * - product：Magento UnifiedProduct
 * - cms：Strapi 侧与 PDP 区块相关的片段（当前：食谱、博客来自 Product 关联，经 by-product-sku 接口）
 */
export type ProductDetailCms = Partial<ProductPageCms>;

export interface ProductDetailPageData {
  product: UnifiedProduct;
  cms: ProductDetailCms | null;
}
