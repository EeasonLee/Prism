/**
 * 商品数据融合层
 *
 * 完全基于 Magento 原生字段，不依赖 Strapi enrichment。
 * 联结键：sku
 */

import { fetchProducts } from './catalog.api';
import {
  fetchProductDetailBySkuGQL,
  fetchProductDetailByUrlKeyGQL,
} from './product-graphql.service';
import type {
  FetchProductsParams,
  MagentoCustomizableOption,
  MagentoProduct,
  MagentoProductListResponse,
} from '../bff-types';
import { processProductImageUrl } from '@prism/shared';
import { normalizeCpPrice } from '../services/unified-utils';

// ─── 统一图片类型 ─────────────────────────────────────────────────────────────

export interface UnifiedProductImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

// ─── 统一商品类型 ─────────────────────────────────────────────────────────────

/**
 * UnifiedProduct = Magento 核心字段 + 派生展示字段
 *
 * 所有 Magento 原始字段保持不变，新增的 unified_* 字段为派生展示字段。
 * 组件应优先使用 unified_* / 派生字段，而非直接访问 Magento 原始字段。
 */
export interface UnifiedLinkedProduct {
  id: number;
  sku: string;
  url_key: string | null;
  name: string;
  display_name: string;
  price: number;
  special_price: number | null;
  currency: string;
  type_id: string;
  is_in_stock: boolean;
  review_count: number;
  rating_percentage: number;
  promotion_label: string | null;
  unified_thumbnail: string | null;
}

export interface UnifiedProduct extends MagentoProduct {
  // ── 内容字段 ──

  /** 展示名称：Magento.long_title ?? Magento.name */
  display_name: string;
  /** 副标题：Magento.long_title */
  subtitle: string | null;
  /** 短描述 HTML：Magento.short_description */
  short_description_html: string | null;
  /** 详情描述 HTML：Magento.description */
  description_html: string | null;
  /** 商品详情区 HTML（PDP「Details」锚点区块，fallback 到 description） */
  product_detail_html: string | null;

  // ── 媒体字段 ──

  /** 统一图片列表：Magento.media_gallery */
  unified_images: UnifiedProductImage[];
  /** 主缩略图：unified_images[0] > Magento.thumbnail_url */
  unified_thumbnail: string | null;

  // ── 营销字段（Magento 自定义属性） ──

  /** 促销标签：Magento.cp_label（cp_date 过期后为 null） */
  promotion_label: string | null;
  /** 促销截止日期（ISO 8601）：Magento.cp_date */
  promotion_expires_at: string | null;

  // ── SEO 字段 ──

  /** SEO 标题：Magento.meta_title */
  seo_title: string | null;
  /** SEO 描述：Magento.meta_description */
  seo_description: string | null;

  // ── 规格参数 ──

  /** 规格参数：Magento.specifications 自定义属性 */
  specifications: string | null;
}

// ─── HTML 工具函数 ────────────────────────────────────────────────────────────

const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/i;

const HTML_ENTITY_PATTERN = /&(lt|gt|amp|quot|#39|nbsp);/i;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderPlainTextRichContent(value: string): string {
  const blocks: string[] = [];
  const paragraphLines: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    blocks.push(`<p>${escapeHtml(paragraphLines.join(' '))}</p>`);
    paragraphLines.length = 0;
  };

  const flushList = () => {
    if (!listType || listItems.length === 0) {
      listType = null;
      listItems = [];
      return;
    }
    blocks.push(
      `<${listType}>${listItems
        .map(item => `<li>${item}</li>`)
        .join('')}</${listType}>`
    );
    listType = null;
    listItems = [];
  };

  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);

    if (unorderedMatch || orderedMatch) {
      flushParagraph();
      const nextListType = unorderedMatch ? 'ul' : 'ol';
      if (listType && listType !== nextListType) flushList();
      listType = nextListType;
      listItems.push(
        escapeHtml((unorderedMatch ?? orderedMatch)?.[1].trim() ?? '')
      );
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks.length > 0 ? blocks.join('') : `<p>${escapeHtml(value)}</p>`;
}

function decodeCommonHtmlEntities(value: string): string {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
}

/**
 * 某些上游会把 HTML 内容再次 JSON 序列化成字符串，这里做一次温和解码：
 * - 处理首尾被包裹的双引号
 * - 处理 \" / \\n 等转义
 * - 处理常见 HTML 实体（&lt; &gt; ...）
 */
function decodeSerializedHtmlMaybe(raw: string): string {
  const trimmed = raw.trim();
  let normalized = trimmed;

  if (
    trimmed.length >= 2 &&
    trimmed.startsWith('"') &&
    trimmed.endsWith('"') &&
    trimmed.includes('\\"')
  ) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (typeof parsed === 'string') {
        normalized = parsed;
      }
    } catch {
      // 忽略解析失败，走后续兜底替换。
    }
  }

  normalized = normalized
    .replaceAll('\\/', '/')
    .replaceAll('\\"', '"')
    .replaceAll("\\'", "'")
    .replaceAll('\\n', '\n')
    .replaceAll('\\r', '\r')
    .replaceAll('\\t', '\t');

  if (HTML_ENTITY_PATTERN.test(normalized)) {
    normalized = decodeCommonHtmlEntities(normalized);
  }

  return normalized.trim();
}

function normalizeHtmlContent(value: unknown): string | null {
  let raw: string | null = null;

  if (typeof value === 'string') {
    raw = value;
  } else if (value != null && typeof value === 'object') {
    if (
      'html' in value &&
      typeof (value as Record<string, unknown>).html === 'string'
    ) {
      raw = (value as Record<string, unknown>).html as string;
    }
  }

  const trimmed = raw ? decodeSerializedHtmlMaybe(raw) : null;
  if (!trimmed) return null;

  return HTML_TAG_PATTERN.test(trimmed)
    ? trimmed
    : renderPlainTextRichContent(trimmed);
}

/** GraphQL / Magento 可能把 cp_price 打成 string，统一为抵扣金额（美元） */
// Re-export for backward compatibility
export { normalizeCpPrice } from '../services/unified-utils';

// ─── 融合函数 ─────────────────────────────────────────────────────────────────

/**
 * 将 Magento 商品数据映射为 UnifiedProduct
 *
 * 纯函数，无 I/O，可在任何上下文安全调用。
 */
export function mergeProduct(magento: MagentoProduct): UnifiedProduct {
  const magentoImages: UnifiedProductImage[] = (magento.media_gallery ?? [])
    .filter(img => img.url)
    .map(img => ({
      url: processProductImageUrl(img.url) ?? img.url,
      alt: img.label ?? magento.name,
    }));

  const unified_images = magentoImages;
  const unified_thumbnail =
    unified_images[0]?.url ??
    processProductImageUrl(magento.thumbnail_url) ??
    magento.thumbnail_url ??
    null;

  // 促销标签：cp_date 过期后不显示
  const now = Date.now();
  const cpDateExpired =
    magento.cp_date != null && new Date(magento.cp_date).getTime() < now;
  const promotion_label =
    magento.cp_label != null && !cpDateExpired ? magento.cp_label : null;

  const subtitleRaw = magento.long_title?.trim();
  const subtitle = subtitleRaw ? subtitleRaw : null;

  const short_description_html = normalizeHtmlContent(
    magento.short_description
  );
  const description_html = normalizeHtmlContent(magento.description);
  const product_detail_html = normalizeHtmlContent(magento.description);

  return {
    ...magento,
    display_name: magento.name,
    subtitle,
    short_description_html,
    description_html,
    product_detail_html,
    unified_images,
    unified_thumbnail,
    promotion_label,
    promotion_expires_at: magento.cp_date ?? null,
    seo_title: magento.meta_title ?? null,
    seo_description: magento.meta_description ?? null,
    specifications: magento.specifications ?? null,
  };
}

// ─── 数据获取函数 ─────────────────────────────────────────────────────────────

async function fetchProductBySkuGQL(sku: string): Promise<MagentoProduct> {
  const raw = await fetchProductDetailBySkuGQL(sku);
  return mapGQLProduct(raw);
}

async function fetchProductByUrlKeyGQL(slug: string): Promise<MagentoProduct> {
  const raw = await fetchProductDetailByUrlKeyGQL(slug);
  return mapGQLProduct(raw);
}

export function mapLinkedProduct(raw: {
  id: number;
  sku: string;
  url_key: string | null;
  name: string;
  thumbnail: { url: string; label: string | null } | null;
  price_range: {
    minimum_price: {
      regular_price: { value: number; currency: string };
      final_price: { value: number; currency: string };
    };
  };
  stock_status: 'IN_STOCK' | 'OUT_OF_STOCK';
}): UnifiedLinkedProduct {
  const finalPrice = raw.price_range.minimum_price.final_price.value;
  const regularPrice = raw.price_range.minimum_price.regular_price.value;

  const thumbnailUrl =
    processProductImageUrl(raw.thumbnail?.url) ?? raw.thumbnail?.url ?? null;

  return {
    id: raw.id,
    sku: raw.sku,
    url_key: raw.url_key ?? null,
    name: raw.name,
    display_name: raw.name,
    price: regularPrice,
    special_price: finalPrice < regularPrice ? finalPrice : null,
    currency: raw.price_range.minimum_price.final_price.currency,
    type_id: 'simple',
    is_in_stock: raw.stock_status === 'IN_STOCK',
    review_count: 0,
    rating_percentage: 0,
    promotion_label: null,
    unified_thumbnail: thumbnailUrl,
  };
}

export function mapGQLProduct(
  raw: Awaited<ReturnType<typeof fetchProductDetailBySkuGQL>>
): MagentoProduct {
  const finalPrice = raw.price_range.minimum_price.final_price.value;
  const regularPrice = raw.price_range.minimum_price.regular_price.value;

  const thumbnailUrl =
    processProductImageUrl(raw.thumbnail?.url ?? raw.media_gallery[0]?.url) ??
    raw.thumbnail?.url ??
    raw.media_gallery[0]?.url ??
    null;

  return {
    id: raw.id,
    sku: raw.sku,
    url_key: raw.url_key ?? null,
    name: raw.name,
    long_title: raw.long_title ?? null,
    cp_label: raw.cp_label ?? null,
    cp_code: raw.cp_code ?? null,
    cp_date: raw.cp_date ?? null,
    cp_price: normalizeCpPrice(raw.cp_price),
    meta_title: raw.meta_title ?? null,
    meta_description: raw.meta_description ?? null,
    specifications: raw.specifications ?? null,
    price: regularPrice,
    final_price: finalPrice,
    special_price: finalPrice < regularPrice ? finalPrice : null,
    currency: raw.price_range.minimum_price.final_price.currency,
    type_id:
      raw.__typename === 'ConfigurableProduct' ? 'configurable' : 'simple',
    thumbnail_url: thumbnailUrl,
    image_url: thumbnailUrl,
    media_gallery: raw.media_gallery
      .filter(m => !m.disabled)
      .sort((a, b) => a.position - b.position)
      .map(m => ({
        url: processProductImageUrl(m.url) ?? m.url,
        label: m.label,
        position: m.position,
        media_type: 'image',
      })),
    stock_status: raw.stock_status,
    is_in_stock: raw.stock_status === 'IN_STOCK',
    rating: raw.rating_summary / 20,
    rating_percentage: raw.rating_summary,
    review_count: raw.review_count,
    categories: raw.categories,
    related_products: (raw.related_products ?? []).map(mapLinkedProduct),
    upsell_products: (raw.upsell_products ?? []).map(mapLinkedProduct),
    description: raw.description?.html ?? null,
    short_description: raw.short_description?.html ?? null,
    configurable_options:
      raw.configurable_options?.map((opt, index) => ({
        id: index + 1,
        attribute_id: String(opt.attribute_id),
        attribute_code: opt.attribute_code,
        label: opt.label,
        values: opt.values.map(v => ({
          value_index: v.value_index,
          label: v.label,
        })),
        position: index,
      })) ?? [],
    children:
      raw.variants?.map(v => ({
        id: v.product.id,
        sku: v.product.sku,
        name: v.product.name,
        cp_label: v.product.cp_label ?? null,
        cp_code: v.product.cp_code ?? null,
        cp_date: v.product.cp_date ?? null,
        cp_price: normalizeCpPrice(v.product.cp_price),
        price: v.product.price_range.minimum_price.regular_price.value,
        special_price:
          v.product.price_range.minimum_price.final_price.value <
          v.product.price_range.minimum_price.regular_price.value
            ? v.product.price_range.minimum_price.final_price.value
            : null,
        is_in_stock: v.product.stock_status === 'IN_STOCK',
        stock_status: v.product.stock_status,
        attributes: v.attributes.reduce<Record<string, string>>((acc, attr) => {
          acc[attr.code] = String(attr.value_index);
          const matchingOption = raw.configurable_options?.find(
            opt => opt.attribute_code === attr.code
          );
          if (matchingOption) {
            acc[String(matchingOption.attribute_id)] = String(attr.value_index);
          }
          return acc;
        }, {}),
        media_gallery: v.product.media_gallery.map((m, idx) => ({
          url: processProductImageUrl(m.url) ?? m.url,
          label: null,
          position: idx,
          media_type: 'image',
        })),
      })) ?? [],
    options:
      raw.options?.reduce<MagentoCustomizableOption[]>((acc, opt) => {
        const optRecord = opt as unknown as Record<string, unknown>;
        const baseOption = {
          option_id: opt.option_id,
          title: opt.title,
          required: opt.required,
          sort_order: opt.sort_order,
        };

        // 同时兼容 GraphQL alias 的 camelCase 与历史 snake_case 字段名。
        const selectionValue =
          optRecord.dropdownValue ??
          optRecord.drop_down_value ??
          optRecord.radioValue ??
          optRecord.radio_value ??
          optRecord.checkboxValue ??
          optRecord.checkbox_value ??
          optRecord.multipleValue ??
          optRecord.multiple_value ??
          null;

        const textValue =
          optRecord.fieldValue ??
          optRecord.field_value ??
          optRecord.areaValue ??
          optRecord.area_value ??
          null;

        if (Array.isArray(selectionValue)) {
          const typeName = opt.__typename
            .replace('Customizable', '')
            .replace('Option', '')
            .toLowerCase()
            .replace('dropdown', 'drop_down');
          acc.push({
            ...baseOption,
            type: typeName as MagentoCustomizableOption['type'],
            values: selectionValue.map((v: Record<string, unknown>) => ({
              option_type_id: v.option_type_id as number,
              title: v.title as string,
              price: v.price as number,
              price_type: v.price_type as 'fixed' | 'percent' | 'dynamic',
              sort_order: v.sort_order as number,
            })),
          });
          return acc;
        }

        if (textValue && typeof textValue === 'object') {
          const typeName = opt.__typename
            .replace('Customizable', '')
            .replace('Option', '')
            .toLowerCase();
          acc.push({
            ...baseOption,
            type: typeName as MagentoCustomizableOption['type'],
            max_characters:
              ((textValue as Record<string, unknown>).max_characters as
                | number
                | null) ?? null,
          });
        }

        return acc;
      }, []) ?? [],
  } as MagentoProduct;
}

export async function fetchUnifiedProducts(
  params: FetchProductsParams
): Promise<{
  items: UnifiedProduct[];
  page_info: MagentoProductListResponse['page_info'];
  total_count: number;
}> {
  const productList = await fetchProducts(params);
  return {
    ...productList,
    items: productList.items.map(p => mergeProduct(p)),
  };
}

export async function fetchUnifiedProductBySku(
  sku: string
): Promise<UnifiedProduct> {
  const product = await fetchProductBySkuGQL(sku);
  return mergeProduct(product);
}

export async function fetchUnifiedProductBySlug(
  slug: string
): Promise<UnifiedProduct> {
  const product = await fetchProductByUrlKeyGQL(slug);
  return mergeProduct(product);
}
