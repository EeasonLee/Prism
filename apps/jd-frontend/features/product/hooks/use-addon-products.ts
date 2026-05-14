'use client';

import { useState, useEffect, useMemo } from 'react';
import type { MagentoCustomizableOption, ProductCardItem } from '../bff-types';
import { searchProductsBySkusFromMeilisearch } from '../api/meilisearch.repo';
import { notifyError } from '@/infrastructure/observability/notify';

/** 从 options 中提取 option_type_id -> sku 的映射 */
function buildSkuMap(
  options: MagentoCustomizableOption[]
): Map<number, string> {
  const map = new Map<number, string>();
  for (const opt of options) {
    if (!opt.values) continue;
    for (const v of opt.values) {
      if (v.sku) {
        map.set(v.option_type_id, v.sku);
      }
    }
  }
  return map;
}

/**
 * 从 customizable options 中提取 SKU 并获取商品图片/价格
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
        const items = await searchProductsBySkusFromMeilisearch(skus);
        if (cancelled) return;

        // 构建 sku -> ProductCardItem 映射
        const skuToProduct = new Map<string, ProductCardItem>();
        for (const item of items) {
          skuToProduct.set(item.sku, item);
        }

        // 构建 option_type_id -> ProductCardItem 映射
        const skuMap = buildSkuMap(options);
        const productMap = new Map<number, ProductCardItem>();
        for (const [optionTypeId, sku] of skuMap) {
          const product = skuToProduct.get(sku);
          if (product) {
            productMap.set(optionTypeId, product);
          }
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
