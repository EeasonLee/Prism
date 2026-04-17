/**
 * catalog-sync-service 客户端
 *
 * 调用本地运行的 catalog-sync-service internal 接口，
 * 补充商品实时价格、库存、变体与选项数据。
 */

import {
  fetchPricesStockFromMagento,
  fetchVariantsOptionsFromMagento,
} from './magento-fallback';

const CATALOG_SYNC_BASE_URL =
  process.env.CATALOG_SYNC_SERVICE_URL ?? 'http://localhost:4040';

// ─── Prices & Stock ────────────────────────────────────────────────────────────────────────────────────────

export interface PriceStockDocument {
  price: number;
  special_price: number | null;
  stock_status: 'in_stock' | 'out_of_stock';
  stock_qty: number | null;
  updated_at: number;
}

export type PricesStockResponse = Record<string, PriceStockDocument | null>;

export async function fetchPricesStock(
  skus: string[]
): Promise<PricesStockResponse> {
  if (skus.length === 0) {
    return {};
  }

  try {
    const response = await fetch(
      `${CATALOG_SYNC_BASE_URL}/internal/prices-stock`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skus }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `catalog-sync prices-stock request failed: ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as PricesStockResponse;
  } catch (_error) {
    // catalog-sync 不可用时降级到 Magento
    return fetchPricesStockFromMagento(skus);
  }
}

// ─── Variants & Options ─────────────────────────────────────────────────────────────────────────────────────────

// 类型定义与 catalog-sync-service Redis 缓存结构保持一致
export interface CatalogVariantChild {
  sku: string;
  name: string;
  price: number;
  special_price: number | null;
  stock_status: string;
  is_in_stock: boolean;
  attributes: Record<string, string>;
}

export interface CatalogVariantConfig {
  attribute_code: string;
  label: string;
  position: number;
  values: Array<{ value_index: string; label: string }>;
}

export interface CatalogProductVariants {
  configurable_options: CatalogVariantConfig[];
  children: CatalogVariantChild[];
}

export interface CatalogOptionValue {
  option_type_id: number;
  title: string;
  price: number;
  price_type: 'fixed' | 'percent';
  sku?: string;
  sort_order: number;
}

export interface CatalogCustomizableOption {
  option_id: number;
  title: string;
  type: string;
  required: boolean;
  sort_order: number;
  max_characters?: number | null;
  values?: CatalogOptionValue[];
}

export interface VariantsOptionsData {
  variants: CatalogProductVariants | null;
  options: CatalogCustomizableOption[] | null;
}

export type VariantsOptionsResponse = Record<
  string,
  VariantsOptionsData | null
>;

export async function fetchVariantsOptions(
  skus: string[]
): Promise<VariantsOptionsResponse> {
  if (skus.length === 0) {
    return {};
  }

  try {
    const response = await fetch(
      `${CATALOG_SYNC_BASE_URL}/internal/variants-options`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skus }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `catalog-sync variants-options request failed: ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as VariantsOptionsResponse;
  } catch (_error) {
    // catalog-sync 不可用时降级到 Magento
    return fetchVariantsOptionsFromMagento(skus);
  }
}
