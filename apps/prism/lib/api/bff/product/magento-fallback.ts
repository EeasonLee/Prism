/**
 * Magento 降级数据源
 *
 * 当 Meilisearch 或 catalog-sync-service 不可用时，
 * 直接回源到 Magento REST API（/api/products 等）。
 */

import { fetchProducts } from '../../magento/catalog';
import type { MagentoProduct } from '../../magento/types';
import type { ProductCardItem } from './types';
import type {
  PriceStockDocument,
  CatalogProductVariants,
  CatalogCustomizableOption,
  VariantsOptionsData,
} from './catalog-sync.client';

export interface MagentoFallbackPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─── ProductCardItem 映射 ─────────────────────────────────────────────────────

export function mapMagentoProductToProductCardItem(
  product: MagentoProduct
): ProductCardItem {
  const displayPrice = product.special_price ?? product.price;
  const originalPrice =
    product.special_price != null && product.price > product.special_price
      ? product.price
      : null;

  const variantData = buildVariantData(product);

  return {
    sku: product.sku,
    name: product.name,
    displayName: product.name,
    urlKey: product.url_key ?? null,
    image: product.thumbnail_url ?? product.image_url ?? null,
    price: {
      value: displayPrice,
      currency: product.currency ?? null,
    },
    originalPrice,
    inStock: product.is_in_stock ?? true,
    type: product.type_id ?? null,
    promotionLabel: null,
    reviewCount: product.review_count ?? 0,
    ratingPercentage: product.rating_percentage ?? 0,
    ...(variantData ? { variantData } : {}),
  };
}

function buildVariantData(
  product: MagentoProduct
): ProductCardItem['variantData'] | undefined {
  const hasOptions =
    (product.configurable_options && product.configurable_options.length > 0) ||
    (product.options && product.options.length > 0) ||
    (product.children && product.children.length > 0);

  if (!hasOptions) {
    return undefined;
  }

  const mappedOptions = (product.configurable_options ?? []).map(opt => ({
    attribute_id: Number(opt.id ?? 0),
    code: opt.attribute_code ?? '',
    label: opt.label,
    values: opt.values.map(v => ({
      label: v.label,
      value: String(v.value_index),
    })),
  }));

  const mappedVariants = (product.children ?? []).map(child => ({
    sku: child.sku,
    attributes: child.attributes,
    inStock: child.is_in_stock,
    price: child.price,
  }));

  const mappedCustomizableOptions = (product.options ?? []).map(opt => ({
    option_id: opt.option_id,
    title: opt.title,
    required: opt.required,
    type: opt.type,
    values: opt.values?.map(v => ({
      option_type_id: v.option_type_id,
      title: v.title,
      price: v.price,
    })),
  }));

  return {
    options: mappedOptions,
    customizable_options: mappedCustomizableOptions,
    variants: mappedVariants,
  };
}

// ─── 列表 Fallback ────────────────────────────────────────────────────────────

export async function fetchProductListFromMagento(params: {
  categoryId?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: ProductCardItem[];
  pagination: MagentoFallbackPagination;
}> {
  const result = await fetchProducts({
    categoryId: params.categoryId,
    keyword: params.keyword,
    page: params.page,
    pageSize: params.pageSize,
  });

  return {
    items: result.items.map(mapMagentoProductToProductCardItem),
    pagination: {
      page: result.page_info.current_page,
      pageSize: result.page_info.page_size,
      total: result.total_count,
      totalPages: result.page_info.total_pages,
    },
  };
}

// ─── Prices & Stock Fallback ──────────────────────────────────────────────────

export async function fetchPricesStockFromMagento(
  skus: string[]
): Promise<Record<string, PriceStockDocument | null>> {
  if (skus.length === 0) {
    return {};
  }

  const result = await fetchProducts({
    skus: skus.join(','),
    pageSize: skus.length,
  });

  const map: Record<string, PriceStockDocument | null> = {};
  for (const sku of skus) {
    map[sku] = null;
  }

  for (const product of result.items) {
    map[product.sku] = {
      price: product.price ?? 0,
      special_price: product.special_price ?? null,
      stock_status:
        product.stock_status === 'IN_STOCK' ? 'in_stock' : 'out_of_stock',
      stock_qty: product.stock_qty ?? null,
      updated_at: Date.now(),
    };
  }

  return map;
}

// ─── Variants & Options Fallback ──────────────────────────────────────────────

export async function fetchVariantsOptionsFromMagento(
  skus: string[]
): Promise<Record<string, VariantsOptionsData | null>> {
  if (skus.length === 0) {
    return {};
  }

  const result = await fetchProducts({
    skus: skus.join(','),
    pageSize: skus.length,
  });

  const map: Record<string, VariantsOptionsData | null> = {};
  for (const sku of skus) {
    map[sku] = null;
  }

  for (const product of result.items) {
    const configurableOptions: CatalogProductVariants['configurable_options'] =
      (product.configurable_options ?? []).map(opt => ({
        attribute_code: opt.attribute_code ?? String(opt.attribute_id),
        label: opt.label,
        position: opt.position ?? 0,
        values: opt.values.map(v => ({
          value_index: String(v.value_index),
          label: v.label,
        })),
      }));

    const children: CatalogProductVariants['children'] = (
      product.children ?? []
    ).map(child => ({
      sku: child.sku,
      name: child.name,
      price: child.price,
      special_price: child.special_price ?? null,
      stock_status: child.stock_status ?? 'IN_STOCK',
      is_in_stock: child.is_in_stock,
      attributes: child.attributes,
    }));

    const customizableOptions: CatalogCustomizableOption[] = (
      product.options ?? []
    ).map(opt => ({
      option_id: opt.option_id,
      title: opt.title,
      required: opt.required,
      type: opt.type,
      sort_order: opt.sort_order,
      max_characters: opt.max_characters ?? null,
      values: opt.values?.map(v => ({
        option_type_id: v.option_type_id,
        title: v.title,
        price: v.price,
        price_type: v.price_type === 'percent' ? 'percent' : 'fixed',
        sku: undefined,
        sort_order: v.sort_order,
      })),
    }));

    map[product.sku] = {
      variants:
        configurableOptions.length > 0 || children.length > 0
          ? { configurable_options: configurableOptions, children }
          : null,
      options: customizableOptions.length > 0 ? customizableOptions : null,
    };
  }

  return map;
}
