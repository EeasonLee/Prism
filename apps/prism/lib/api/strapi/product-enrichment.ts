/**
 * Strapi 商品富文本 API
 *
 * 提供 Magento 缺失的内容字段：展示图片、促销文案、富文本描述、SEO 等。
 * 联结键：sku（与 Magento 对齐）
 *
 * 数据源：Strapi CT `product-enrichments`（api/product-enrichments）
 * 缓存策略：1 小时，tag = 'product-enrichments'（Strapi webhook 触发 revalidate）
 */

import { apiClient } from '../client';
import { env } from '../../env';

// ─── Strapi 响应原始结构 ──────────────────────────────────────────────────────

interface StrapiImage {
  url: string;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: {
    thumbnail?: { url: string; width: number; height: number } | null;
    small?: { url: string; width: number; height: number } | null;
    medium?: { url: string; width: number; height: number } | null;
  } | null;
}

interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiProductEnrichmentRaw {
  id: number;
  documentId: string;
  sku: string;
  display_name?: string | null;
  short_description_html?: string | null;
  description_html?: string | null;
  images?: StrapiImage[] | null;
  thumbnail?: StrapiImage | null;
  promotion_label?: string | null;
  promotion_expires_at?: string | null;
  is_featured?: boolean | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

// ─── 对外暴露的类型 ───────────────────────────────────────────────────────────

/** Strapi 商品图片条目（已标准化） */
export interface ProductEnrichmentImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

/**
 * Strapi 商品富文本数据
 *
 * 所有字段均为可选——有则覆盖 Magento 对应字段，无则 fallback 到 Magento 原始值。
 * 永远不介入价格、库存、配置选项等核心商业字段。
 */
export interface StrapiProductEnrichment {
  /** 联结键，必须与 Magento SKU 完全一致 */
  sku: string;
  /** 展示名称（覆盖 Magento name，用于本地化或营销优化） */
  display_name?: string;
  /** 短描述 HTML（覆盖 Magento short_description） */
  short_description_html?: string;
  /** 详情描述 HTML（覆盖 Magento description） */
  description_html?: string;
  /** 高质量商品图片列表（覆盖 Magento media_gallery） */
  images?: ProductEnrichmentImage[];
  /** 主缩略图 URL（覆盖 unified_images[0]） */
  thumbnail_url?: string;
  /** 促销标签，如 "New Arrival"、"Buy 2 Get 1"、"Limited Edition" */
  promotion_label?: string;
  /** 促销截止日期（ISO 8601），用于前端自动隐藏过期标签 */
  promotion_expires_at?: string;
  /** 是否精选（用于首页轮播、推荐位） */
  is_featured?: boolean;
  /** SEO 标题（覆盖默认 `{name} - Joydeem`） */
  seo_title?: string;
  /** SEO 描述 */
  seo_description?: string;
}

// ─── 内部工具函数 ─────────────────────────────────────────────────────────────

/**
 * 将 Strapi 返回的相对 URL（/uploads/...）转换为绝对 URL
 * Strapi v5 media URL 可能是相对路径，需要拼接 API base URL
 */
function resolveStrapiUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (env.NEXT_PUBLIC_API_URL ?? 'http://localhost:1337').replace(
    /\/$/,
    ''
  );
  return `${base}${url}`;
}

function normalizeImage(img: StrapiImage): ProductEnrichmentImage {
  return {
    url: resolveStrapiUrl(img.url) ?? img.url,
    alt: img.alternativeText ?? '',
    width: img.width ?? undefined,
    height: img.height ?? undefined,
  };
}

function normalizeEnrichment(
  raw: StrapiProductEnrichmentRaw
): StrapiProductEnrichment {
  return {
    sku: raw.sku,
    display_name: raw.display_name ?? undefined,
    short_description_html: raw.short_description_html ?? undefined,
    description_html: raw.description_html ?? undefined,
    images: raw.images?.map(normalizeImage) ?? undefined,
    thumbnail_url: resolveStrapiUrl(raw.thumbnail?.url) ?? undefined,
    promotion_label: raw.promotion_label ?? undefined,
    promotion_expires_at: raw.promotion_expires_at ?? undefined,
    is_featured: raw.is_featured ?? undefined,
    seo_title: raw.seo_title ?? undefined,
    seo_description: raw.seo_description ?? undefined,
  };
}

// ─── 公开 API ─────────────────────────────────────────────────────────────────

/**
 * 批量获取指定 SKU 列表的 Strapi 商品富文本数据
 *
 * 返回以 sku 为 key 的 Map，未命中的 SKU 不会出现在 Map 中（调用方自行 fallback）。
 * 此函数**不会抛出异常**——调用方应使用 .catch(() => new Map()) 处理整体失败。
 *
 * 缓存：1 小时，tag = 'product-enrichments'
 */
export async function fetchProductEnrichments(
  skus: string[]
): Promise<Map<string, StrapiProductEnrichment>> {
  if (skus.length === 0) return new Map();

  // 批量查询：skus 拆成 URL 过滤参数
  const skuFilter = skus
    .map((s, i) => `filters[sku][$in][${i}]=${encodeURIComponent(s)}`)
    .join('&');

  // Strapi v5 populate 语法：populate[field]=true，不支持逗号分隔
  const populateParams = 'populate[images]=true&populate[thumbnail]=true';

  const data = await apiClient.get<
    StrapiListResponse<StrapiProductEnrichmentRaw>
  >(
    `api/product-enrichments?${skuFilter}&${populateParams}&pagination[pageSize]=100`,
    {
      next: { tags: ['product-enrichments'], revalidate: 3600 },
    } as Parameters<typeof apiClient.get>[1]
  );

  const result = new Map<string, StrapiProductEnrichment>();
  for (const item of data.data) {
    result.set(item.sku, normalizeEnrichment(item));
  }
  return result;
}

/**
 * 获取单个 SKU 的 Strapi 富文本数据
 *
 * 内部调用 fetchProductEnrichments，保持批量接口的一致性。
 */
export async function fetchProductEnrichment(
  sku: string
): Promise<StrapiProductEnrichment | undefined> {
  const map = await fetchProductEnrichments([sku]);
  return map.get(sku);
}
