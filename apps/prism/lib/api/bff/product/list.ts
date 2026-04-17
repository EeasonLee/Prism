import type { ProductCardItem, ProductListResult } from './types';
import { searchProductsForBFF } from './meilisearch';
import {
  fetchPricesStock,
  fetchVariantsOptions,
  type PriceStockDocument,
  type CatalogProductVariants,
  type CatalogCustomizableOption,
} from './catalog-sync.client';

export type { ProductCardItem, ProductListResult } from './types';

export interface GetProductListBFFParams {
  categoryId?: number;
  categoryName?: string;
  categorySlug?: string;
  page?: number;
  limit?: number;
  sort?: 'name' | 'price';
}

// ─── 映射工具：将 catalog-sync-service 的 variants/options 原始数据映射为前端结构 ───────────────────────

function mapVariantData(
  variants: CatalogProductVariants | null,
  options: CatalogCustomizableOption[] | null
): NonNullable<ProductCardItem['variantData']> | undefined {
  if (!variants && (!options || options.length === 0)) {
    return undefined;
  }

  const mappedOptions = (variants?.configurable_options ?? []).map(opt => ({
    attribute_id: Number.NaN, // catalog-sync-service 缓存中没有 attribute_id，前端可能需要 code 匹配
    code: opt.attribute_code,
    label: opt.label,
    values: opt.values.map(v => ({
      label: v.label,
      value: v.value_index,
    })),
  }));

  const mappedVariants = (variants?.children ?? []).map(child => ({
    sku: child.sku,
    attributes: child.attributes,
    inStock: child.is_in_stock,
    price: child.price,
  }));

  const mappedCustomizableOptions = (options ?? []).map(opt => ({
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

function mergePriceStock(
  item: ProductCardItem,
  doc: PriceStockDocument | null
): ProductCardItem {
  if (!doc) {
    return item;
  }

  const regularPrice = doc.price;
  const specialPrice =
    doc.special_price != null && doc.special_price > 0
      ? doc.special_price
      : null;
  const displayPrice = specialPrice ?? regularPrice;
  const originalPrice =
    specialPrice != null && regularPrice > specialPrice ? regularPrice : null;

  return {
    ...item,
    price: {
      value: displayPrice,
      currency: item.price.currency,
    },
    originalPrice,
    inStock: doc.stock_status === 'in_stock',
  };
}

// ─── 主函数 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Product list BFF 入口。
 *
 * 数据源：
 * 1. 静态字段（name、thumbnail、url_key 等）来自 Meilisearch products 索引。
 * 2. 动态字段（price、special_price、stock_status、stock_qty）来自 catalog-sync-service
 *    的 POST /internal/prices-stock 端点。
 * 3. 可选变体与选项（variants、options、customizable_options）来自 catalog-sync-service
 *    的 POST /internal/variants-options 端点（基于 Redis 缓存）。
 *
 * 未命中时温和处理：
 * - 价格/库存 miss 时保留 Meilisearch 原始值作为降级。
 * - variants/options miss 时不填充 variantData 字段，前端可以继续通过
 *   /api/products/:sku/variants 单独获取。
 */
export async function getProductListBFF(
  params: GetProductListBFFParams
): Promise<ProductListResult> {
  const meiliResult = await searchProductsForBFF({
    categoryId: params.categoryId,
    categoryName: params.categoryName,
    categorySlug: params.categorySlug,
    page: params.page,
    pageSize: params.limit,
    sort: params.sort,
  });

  const skus = meiliResult.items.map(item => item.sku);

  // catalog-sync-service /internal/prices-stock 限制每次最多 100 个 SKU
  const skuBatches: string[][] = [];
  for (let i = 0; i < skus.length; i += 100) {
    skuBatches.push(skus.slice(i, i + 100));
  }

  const [pricesStockResults, variantsOptionsResults] = await Promise.all([
    Promise.all(skuBatches.map(batch => fetchPricesStock(batch))).then(
      results =>
        results.reduce<Record<string, PriceStockDocument | null>>(
          (acc, result) => ({ ...acc, ...result }),
          {}
        )
    ),
    Promise.all(skuBatches.map(batch => fetchVariantsOptions(batch))).then(
      results =>
        results.reduce<
          Record<
            string,
            {
              variants: CatalogProductVariants | null;
              options: CatalogCustomizableOption[] | null;
            } | null
          >
        >((acc, result) => ({ ...acc, ...result }), {})
    ),
  ]);

  const mergedItems = meiliResult.items.map(item => {
    const priceStockDoc = pricesStockResults[item.sku] ?? null;
    const variantsOptionsDoc = variantsOptionsResults[item.sku] ?? null;

    let merged = mergePriceStock(item, priceStockDoc);

    if (variantsOptionsDoc) {
      const variantData = mapVariantData(
        variantsOptionsDoc.variants,
        variantsOptionsDoc.options
      );
      if (variantData) {
        merged = { ...merged, variantData };
      }
    }

    return merged;
  });

  return {
    items: mergedItems,
    pagination: meiliResult.pagination,
  };
}
