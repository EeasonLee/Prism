import { env } from '@/infrastructure/config/env';
import type { MagentoCustomizableOption, ProductCardItem } from '../bff-types';

interface InventoryItem {
  sku: string;
  salable_qty: number;
  is_salable: boolean;
  stock_status: string;
  image_url?: string;
  updated_at?: string;
}

interface InventoryBulkResponse {
  items: Record<string, InventoryItem>;
  not_found: string[];
}

/**
 * 服务端获取 add-on 商品的图片和库存状态。
 *
 * 从 customizable options 中提取 SKU，调用 catalog-sync-service 的
 * /v1/inventory/bulk 接口，返回 option_type_id -> ProductCardItem 映射。
 * 失败时静默降级返回空对象。
 */
export async function fetchAddonProductsByOptions(
  options: MagentoCustomizableOption[]
): Promise<Record<number, ProductCardItem>> {
  // 提取去重 SKU
  const skuMap = new Map<number, { sku: string; title: string }>();
  const skuSet = new Set<string>();

  for (const opt of options) {
    if (!opt.values) continue;
    for (const v of opt.values) {
      if (v.sku && !skuSet.has(v.sku)) {
        skuSet.add(v.sku);
        skuMap.set(v.option_type_id, { sku: v.sku, title: v.title });
      }
    }
  }

  const skus = [...skuSet];
  if (skus.length === 0) return {};

  const catalogSyncUrl = env.NEXT_PUBLIC_CATALOG_SYNC_URL?.trim();
  if (!catalogSyncUrl) return {};

  try {
    const res = await fetch(`${catalogSyncUrl}/v1/inventory/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skus }),
    });

    if (!res.ok) return {};

    const data = (await res.json()) as InventoryBulkResponse;
    const result: Record<number, ProductCardItem> = {};

    for (const [optionTypeId, { sku, title }] of skuMap) {
      const item = data.items[sku];
      if (!item || item.stock_status !== 'in_stock') continue;

      result[optionTypeId] = {
        sku: item.sku,
        name: title,
        displayName: title,
        shortName: title,
        longTitle: null,
        shortDescription: null,
        urlKey: null,
        image: item.image_url || null,
        price: { value: null, currency: null },
        originalPrice: null,
        inStock: true,
        type: null,
        promotionLabel: null,
        cpLabel: null,
        cpLabelColor: null,
        reviewCount: 0,
        ratingPercentage: 0,
      };
    }

    return result;
  } catch {
    return {};
  }
}
