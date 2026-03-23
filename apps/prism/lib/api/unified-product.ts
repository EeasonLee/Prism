/**
 * 商品数据融合层
 *
 * 将 Magento（核心商业字段）与 Strapi（内容富文本字段）合并为统一的 UnifiedProduct 类型。
 * 联结键：sku
 *
 * 设计原则：
 * - Strapi 字段优先（有则覆盖 Magento 对应字段）
 * - Magento 核心商业字段（价格、库存、配置选项）永远不被 Strapi 覆盖
 * - Strapi 获取失败时静默降级，返回纯 Magento 数据，不影响页面可用性
 * - 两侧数据并发获取，不串行
 */

import { fetchProductBySku, fetchProducts } from './magento/catalog';
import type {
  FetchProductsParams,
  MagentoProduct,
  MagentoProductListResponse,
} from './magento/types';
import {
  fetchProductEnrichment,
  fetchProductEnrichments,
} from './strapi/product-enrichment';
import type { StrapiProductEnrichment } from './strapi/product-enrichment';

function normalizeHtmlContent(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value == null) {
    return null;
  }

  if (typeof value === 'object') {
    if ('html' in value && typeof value.html === 'string') {
      const trimmed = value.html.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if ('rendered' in value && typeof value.rendered === 'string') {
      const trimmed = value.rendered.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }

  return null;
}

export type UnifiedProductContent = Pick<
  StrapiProductEnrichment,
  'key_points' | 'guarantees' | 'recipes' | 'blog_posts'
>;

// ─── 统一图片类型 ─────────────────────────────────────────────────────────────

export interface UnifiedProductImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

// ─── 统一商品类型 ─────────────────────────────────────────────────────────────

/**
 * UnifiedProduct = Magento 核心字段 + Strapi 内容富文本字段
 *
 * 所有 Magento 原始字段保持不变，新增的 unified_* 字段为融合后的展示字段。
 * 组件应优先使用 unified_* 字段，而非直接访问 Magento 原始字段。
 */
export interface UnifiedProduct extends MagentoProduct {
  /** 是否已加载 Strapi 富文本（用于调试，勿用于业务判断） */
  _enriched: boolean;

  // ── 内容字段（Strapi 优先，fallback 到 Magento） ──

  /** 展示名称：Strapi.display_name ?? Magento.name */
  display_name: string;
  /** 副标题（仅 Strapi product-enrichment，Magento 无对应字段） */
  subtitle: string | null;
  /** 短描述 HTML：Strapi.short_description_html ?? Magento.short_description */
  short_description_html: string | null;
  /** 详情描述 HTML：Strapi.description_html ?? Magento.description */
  description_html: string | null;
  /**
   * 商品详情区 HTML（仅 Strapi product_detail_html）
   * PDP「Details」锚点区块；与主描述 description_html 独立，无 Magento 回退
   */
  product_detail_html: string | null;

  // ── 媒体字段 ──

  /** 统一图片列表：Strapi.images（有）> Magento.media_gallery */
  unified_images: UnifiedProductImage[];
  /** 主缩略图：Strapi.thumbnail_url > unified_images[0] > Magento.thumbnail_url */
  unified_thumbnail: string | null;

  // ── 营销字段（仅 Strapi，Magento 无对应字段） ──

  /** 促销标签，如 "New Arrival"、"Buy 2 Get 1"、"Limited Edition" */
  promotion_label: string | null;
  /** 促销截止日期（ISO 8601），过期后前端自动隐藏标签 */
  promotion_expires_at: string | null;
  /** 是否精选（用于首页轮播、推荐位） */
  is_featured: boolean;

  // ── SEO 字段 ──

  /** SEO 标题（覆盖默认拼接标题） */
  seo_title: string | null;
  /** SEO 描述 */
  seo_description: string | null;
  /** PDP 关联食谱 */
  recipes?: StrapiProductEnrichment['recipes'];
  /** PDP 关联文章 */
  blog_posts?: StrapiProductEnrichment['blog_posts'];
}

// ─── 融合函数 ─────────────────────────────────────────────────────────────────

/**
 * 将单个 Magento 商品与可选的 Strapi 富文本数据合并为 UnifiedProduct
 *
 * 纯函数，无 I/O，可在任何上下文安全调用。
 */
export function mergeProduct(
  magento: MagentoProduct,
  enrichment?: StrapiProductEnrichment
): UnifiedProduct {
  // 图片优先级：Strapi.images > Magento.media_gallery > 空数组
  const strapiImages: UnifiedProductImage[] = (enrichment?.images ?? []).map(
    img => ({
      url: img.url,
      alt: img.alt || magento.name,
      width: img.width,
      height: img.height,
    })
  );

  const magentoImages: UnifiedProductImage[] = (magento.media_gallery ?? [])
    .filter(img => img.url)
    .map(img => ({
      url: img.url,
      alt: img.label ?? magento.name,
    }));

  const unified_images = strapiImages.length > 0 ? strapiImages : magentoImages;

  // 缩略图优先级：Strapi 指定缩略图 > unified_images[0] > Magento 原始缩略图
  const unified_thumbnail =
    enrichment?.thumbnail_url ??
    unified_images[0]?.url ??
    magento.thumbnail_url ??
    null;

  // 促销标签过期检测：过期则忽略
  const now = Date.now();
  const promotionExpired =
    enrichment?.promotion_expires_at != null &&
    new Date(enrichment.promotion_expires_at).getTime() < now;
  const promotion_label =
    enrichment?.promotion_label != null && !promotionExpired
      ? enrichment.promotion_label
      : null;

  const subtitleRaw = enrichment?.subtitle?.trim();
  const subtitle = subtitleRaw ? subtitleRaw : null;

  const short_description_html =
    normalizeHtmlContent(enrichment?.short_description_html) ??
    normalizeHtmlContent(magento.short_description);
  const description_html =
    normalizeHtmlContent(enrichment?.description_html) ??
    normalizeHtmlContent(magento.description);
  const product_detail_html = normalizeHtmlContent(
    enrichment?.product_detail_html
  );

  return {
    ...magento,
    _enriched: !!enrichment,
    display_name: enrichment?.display_name ?? magento.name,
    subtitle,
    short_description_html,
    description_html,
    product_detail_html,
    unified_images,
    unified_thumbnail,
    promotion_label,
    promotion_expires_at: enrichment?.promotion_expires_at ?? null,
    is_featured: enrichment?.is_featured ?? false,
    seo_title: enrichment?.seo_title ?? null,
    seo_description: enrichment?.seo_description ?? null,
    recipes: enrichment?.recipes,
    blog_posts: enrichment?.blog_posts,
  };
}

// ─── 数据获取函数 ─────────────────────────────────────────────────────────────

/**
 * 获取商品列表并融合 Strapi 富文本数据
 *
 * - Magento 和 Strapi 并发获取
 * - Strapi 失败时静默降级，返回纯 Magento 数据
 */
export async function fetchUnifiedProducts(
  params: FetchProductsParams
): Promise<{
  items: UnifiedProduct[];
  page_info: MagentoProductListResponse['page_info'];
  total_count: number;
}> {
  const productList = await fetchProducts(params);
  const skus = productList.items.map(p => p.sku);

  const enrichmentMap = await fetchProductEnrichments(skus).catch(
    () => new Map<string, StrapiProductEnrichment>()
  );

  return {
    ...productList,
    items: productList.items.map(p =>
      mergeProduct(p, enrichmentMap.get(p.sku))
    ),
  };
}

/**
 * 获取单个商品详情并融合 Strapi 富文本数据
 *
 * - Magento 和 Strapi 并发获取
 * - Strapi 失败时静默降级
 */
export async function fetchUnifiedProductBySku(
  sku: string
): Promise<UnifiedProduct> {
  const [product, enrichment] = await Promise.all([
    fetchProductBySku(sku),
    fetchProductEnrichment(sku).catch(() => undefined),
  ]);

  return mergeProduct(product, enrichment);
}
