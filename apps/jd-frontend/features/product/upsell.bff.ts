import {
  fetchUnifiedProductBySku,
  type UnifiedLinkedProduct,
} from '@/features/product/unified.api';

/**
 * PDP upsell BFF 入口。
 *
 * 当前阶段只从 Magento 已有 linked products 中收口 upsell_products，
 * 不引入推荐服务、缓存或额外聚合。
 */
export async function getUpsellProductsBFF(
  sku: string
): Promise<UnifiedLinkedProduct[]> {
  const product = await fetchUnifiedProductBySku(sku);

  return (product.upsell_products ?? []).map(item => ({
    id: item.id,
    sku: item.sku,
    url_key: item.url_key ?? null,
    name: item.name,
    display_name: item.display_name,
    price: item.price,
    special_price: item.special_price ?? null,
    type_id: item.type_id,
    is_in_stock: item.is_in_stock,
    review_count: item.review_count ?? 0,
    rating_percentage: item.rating_percentage ?? 0,
    promotion_label: item.promotion_label ?? null,
    unified_thumbnail: item.unified_thumbnail ?? null,
  }));
}
