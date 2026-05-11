/**
 * 统一展示数据映射
 *
 * 将各数据源（ProductCardItem、UnifiedProduct 等）映射为 UnifiedProductDisplay。
 * 同时提供 computeDiscountPercent 纯函数用于折扣百分比计算。
 *
 * @see docs/product-display-rules.md
 */

import type { ProductCardItem, MagentoProduct } from '../bff-types';
import type { UnifiedProductDisplay, VariantData } from '../types';
import type { UnifiedProduct } from '../api/unified.api';

// ─── 折扣计算 ──────────────────────────────────────────────────────────────────

/**
 * 计算折扣百分比（纯函数）
 *
 * @param price      划线价（原价）
 * @param finalPrice 售价（实际售价）
 * @returns 折扣百分比（如 25 表示 25%），无折扣时返回 null
 */
export function computeDiscountPercent(
  price: number,
  finalPrice: number
): number | null {
  if (price <= 0 || finalPrice >= price) return null;
  return Math.round(((price - finalPrice) / price) * 100);
}

// ─── ProductCardItem → UnifiedProductDisplay ──────────────────────────────────

/**
 * 将 BFF 商品卡片数据映射为统一展示模型。
 * 适用于搜索结果、分类列表、CMS 网格等 Meilisearch/Magento 混合数据源。
 */
export function mapCardItemToDisplay(
  item: ProductCardItem
): UnifiedProductDisplay {
  const finalPrice = item.price.value ?? 0;
  const regularPrice = item.originalPrice ?? item.price.value ?? 0;
  const discountPercent = computeDiscountPercent(regularPrice, finalPrice);

  let variantData: VariantData | null = null;
  if (item.variantData) {
    variantData = {
      options: (item.variantData.options ?? []).map(o => ({
        attribute_id: o.attribute_id,
        code: o.code,
        label: o.label,
        values: (o.values ?? []).map(v => ({ label: v.label, value: v.value })),
      })),
      customizable_options: (item.variantData.customizable_options ?? []).map(
        co => ({
          option_id: co.option_id,
          title: co.title,
          required: co.required,
          type: co.type,
          values: co.values?.map(v => ({
            option_type_id: v.option_type_id,
            title: v.title,
            price: v.price,
          })),
        })
      ),
      variants: (item.variantData.variants ?? []).map(v => ({
        sku: v.sku,
        attributes: v.attributes,
        inStock: v.inStock,
        price: v.price,
      })),
    };
  }

  return {
    sku: item.sku,
    name: item.name,
    short_name: item.shortName ?? item.displayName ?? null,
    longtitle: item.longTitle ?? null,
    short_description: item.shortDescription ?? null,
    price: regularPrice,
    final_price: finalPrice,
    discount_percent: discountPercent,
    cp_code: item.cpCode ?? null,
    cp_label: item.cpLabel ?? null,
    cp_label_color: item.cpLabelColor ?? null,
    cp_price: item.cpPrice ?? null,
    cp_starts_at: item.cpStartsAt ?? null,
    cp_expires_at: item.cpExpiresAt ?? null,
    is_in_stock: item.inStock,
    best_text: item.promotionLabel ?? null,
    best_color: item.bestColor ?? null,
    rating_summary: item.ratingPercentage > 0 ? item.ratingPercentage : null,
    review_count: item.reviewCount,
    rating_distribution: item.ratingDistribution ?? null,
    image: item.image,
    type_id: item.type ?? 'simple',
    url_key: item.urlKey ?? null,
    variant_data: variantData,
    currency: item.price.currency ?? null,
  };
}

// ─── UnifiedProduct → UnifiedProductDisplay ───────────────────────────────────

/**
 * 将 GraphQL/REST 聚合的 UnifiedProduct 映射为统一展示模型。
 * 适用于 PDP 详情页、关联商品、推荐等。
 */
export function mapUnifiedToDisplay(
  product: UnifiedProduct
): UnifiedProductDisplay {
  const regularPrice = product.price;
  const finalPrice =
    product.final_price ?? product.special_price ?? product.price;
  const discountPercent = computeDiscountPercent(regularPrice, finalPrice);

  const image =
    product.unified_thumbnail ??
    product.thumbnail_url ??
    product.image_url ??
    null;

  return {
    sku: product.sku,
    name: product.name,
    short_name: product.display_name ?? null,
    longtitle: product.long_title ?? null,
    short_description:
      product.short_description_html ?? product.short_description ?? null,
    price: regularPrice,
    final_price: finalPrice,
    discount_percent: discountPercent,
    cp_code: product.cp_code ?? null,
    cp_label: product.cp_label ?? null,
    cp_label_color: null, // UnifiedProduct 不含 Meilisearch 的 cpLabelColor
    cp_price: product.cp_price ?? null,
    cp_starts_at: null, // UnifiedProduct 目前无 cp_starts_at
    cp_expires_at: product.cp_date ?? product.promotion_expires_at ?? null,
    is_in_stock: product.is_in_stock ?? true,
    best_text: product.promotion_label ?? null,
    best_color: null,
    rating_summary:
      (product.rating_percentage ?? 0) > 0
        ? product.rating_percentage ?? null
        : null,
    review_count: product.review_count ?? 0,
    rating_distribution: null,
    image,
    type_id: product.type_id ?? 'simple',
    url_key: product.url_key ?? null,
    variant_data: null, // UnifiedProduct 变体结构不同，需要单独映射
    currency: product.currency ?? 'USD',
  };
}

// ─── MagentoProduct (原始) → UnifiedProductDisplay ────────────────────────────

/**
 * 将原始 MagentoProduct（REST 接口返回）映射为统一展示模型。
 * 适用于 catalog.api.ts 直接获取的商品列表。
 */
export function mapMagentoProductToDisplay(
  product: MagentoProduct
): UnifiedProductDisplay {
  const regularPrice = product.price;
  const finalPrice =
    product.special_price ?? product.final_price ?? product.price;
  const discountPercent = computeDiscountPercent(regularPrice, finalPrice);

  const image = product.thumbnail_url ?? product.image_url ?? null;

  return {
    sku: product.sku,
    name: product.name,
    short_name: product.name ?? null,
    longtitle: product.long_title ?? null,
    short_description: product.short_description ?? null,
    price: regularPrice,
    final_price: finalPrice,
    discount_percent: discountPercent,
    cp_code: product.cp_code ?? null,
    cp_label: product.cp_label ?? null,
    cp_label_color: null,
    cp_price: product.cp_price ?? null,
    cp_starts_at: null,
    cp_expires_at: product.cp_date ?? null,
    is_in_stock: product.is_in_stock ?? true,
    best_text: null,
    best_color: null,
    rating_summary:
      (product.rating_percentage ?? 0) > 0
        ? product.rating_percentage ?? null
        : null,
    review_count: product.review_count ?? 0,
    rating_distribution: null,
    image,
    type_id: product.type_id ?? 'simple',
    url_key: product.url_key ?? null,
    variant_data: null,
    currency: product.currency ?? 'USD',
  };
}
