'use client';

import { useState, useEffect, useMemo } from 'react';
import type { MagentoCustomizableOption, ProductCardItem } from '../bff-types';
import { notifyError } from '@/infrastructure/observability/notify';

/** 从 options 中提取 option_type_id -> { sku, title } 的映射 */
function buildSkuMap(
  options: MagentoCustomizableOption[]
): Map<number, { sku: string; title: string }> {
  const map = new Map<number, { sku: string; title: string }>();
  for (const opt of options) {
    if (!opt.values) continue;
    for (const v of opt.values) {
      if (v.sku) {
        map.set(v.option_type_id, { sku: v.sku, title: v.title });
      }
    }
  }
  return map;
}

interface InventoryItem {
  sku: string;
  salable_qty: number;
  is_salable: boolean;
  stock_status: string;
  image_url?: string;
  updated_at?: string;
}

/**
 * 从 inventory bulk API 批量获取 SKU 数据
 */
async function fetchAddonProductsFromInventory(
  skus: string[]
): Promise<Map<string, InventoryItem>> {
  const res = await fetch('/api/inventory/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skus }),
  });

  if (!res.ok) {
    throw new Error(`Inventory API returned ${res.status}`);
  }

  const data = (await res.json()) as {
    success: boolean;
    data?: {
      items: Record<string, InventoryItem>;
      not_found: string[];
    };
  };

  if (!data.success || !data.data) {
    throw new Error('Inventory request failed');
  }

  return new Map(Object.entries(data.data.items));
}

/**
 * 从 customizable options 中提取 SKU 并获取商品图片/库存状态
 *
 * @param options - 商品的 customizable options 列表
 * @returns Map<option_type_id, ProductCardItem> 用于渲染商品卡片
 */
export function useAddonProducts(
  options: MagentoCustomizableOption[]
): Map<number, ProductCardItem> {
  const [products, setProducts] = useState<Map<number, ProductCardItem>>(
    new Map()
  );

  // 提取去重后的 SKU 列表作为唯一数据依赖
  const skus = useMemo(() => {
    const skuSet = new Set<string>();
    for (const opt of options) {
      if (!opt.values) continue;
      for (const v of opt.values) {
        if (v.sku) skuSet.add(v.sku);
      }
    }
    return [...skuSet];
  }, [options]);

  useEffect(() => {
    if (skus.length === 0) return;

    let cancelled = false;

    async function fetchProducts() {
      try {
        const inventoryItems = await fetchAddonProductsFromInventory(skus);
        if (cancelled) return;

        // 构建 option_type_id -> ProductCardItem 映射
        const skuMap = buildSkuMap(options);
        const productMap = new Map<number, ProductCardItem>();

        for (const [optionTypeId, { sku, title }] of skuMap) {
          const inventoryItem = inventoryItems.get(sku);

          // 只处理有库存的商品
          if (!inventoryItem || inventoryItem.stock_status !== 'in_stock') {
            continue;
          }

          // 转换为 ProductCardItem 格式
          const product: ProductCardItem = {
            sku: inventoryItem.sku,
            name: title, // 使用 options 中的标题
            displayName: title,
            shortName: title,
            longTitle: null,
            shortDescription: null,
            urlKey: null,
            image: inventoryItem.image_url || null,
            price: {
              value: null, // inventory API 不返回价格
              currency: null,
            },
            originalPrice: null,
            inStock: true,
            type: null,
            promotionLabel: null,
            cpLabel: null,
            cpLabelColor: null,
            reviewCount: 0,
            ratingPercentage: 0,
          };

          productMap.set(optionTypeId, product);
        }

        setProducts(productMap);
      } catch (err) {
        // 静默降级：保持 products 为空 Map，组件会 fallback 到纯文字展示
        if (!cancelled) {
          void notifyError('Failed to fetch addon product images', err);
        }
      }
    }

    void fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [skus, options]);

  return products;
}
