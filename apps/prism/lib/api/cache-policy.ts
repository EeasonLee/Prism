/**
 * Next.js Data Cache：秒级 revalidate 与 `next.tags` 单一事实来源。
 *
 * 分档（与架构约定一致）：
 * - **交易 / 价库**：新鲜度优先 — 不在此文件给长 TTL；库存等用 `no-store` 或 0（见各 Route）。
 * - **评论 / QA（UGC）**：分钟级，可配合 tag 按需失效。
 * - **CMS 关联内容**（食谱/博客块、discovery、enrichment）：小时级兜底 + On-Demand revalidate。
 * - **CMS 页面**：短 ISR（如 60s）+ 按 slug 的 tag。
 *
 * 新 Strapi 读接口：默认归入「CMS 关联」档，除非属于 UGC 或交易域。
 */

// ─── Revalidate seconds ─────────────────────────────────────────────────

/** UGC：评论列表、评分汇总、商品 QA 列表 */
export const REVALIDATE_SECONDS_REVIEW_UGC = 300;

/** CMS 关联：PDP 食谱/文章、Discovery 配置、Product enrichment 等 */
export const REVALIDATE_SECONDS_CMS_ASSOCIATION = 3600;

/** CMS 静态页（首页、Landing）：短 ISR，主要配合 On-Demand */
export const REVALIDATE_SECONDS_CMS_PAGE = 60;

/** 目录/轮播等短时快照（可与 GraphQL 等保持一致） */
export const REVALIDATE_SECONDS_CATALOG_SNAPSHOT = 60;

/** 商品详情聚合 BFF 等（Magento 侧分钟级兜底） */
export const REVALIDATE_SECONDS_PRODUCT_DETAIL = 300;

/** 分类树等 */
export const REVALIDATE_SECONDS_CATEGORY_NAV = 3600;

/** 分类详情（单 id） */
export const REVALIDATE_SECONDS_CATEGORY_DETAIL = 300;

/** 关联推荐等 */
export const REVALIDATE_SECONDS_RELATED_PRODUCTS = 120;

/** 库存等需实时：Route Segment Config 使用 0 */
export const REVALIDATE_SECONDS_REALTIME = 0;

// ─── Next.js cache tags（与 `app/api/revalidate` 及 Strapi webhook 对齐用） ─

export const CACHE_TAG_PRODUCT_REVIEWS = 'product-reviews';

export const CACHE_TAG_PRODUCT_REVIEW_SUMMARIES = 'product-review-summaries';

export const CACHE_TAG_PRODUCT_QA = 'product-qa';

export const CACHE_TAG_PRODUCT_ENRICHMENTS = 'product-enrichments';

export const CACHE_TAG_DISCOVERY_CATEGORIES = 'discovery-categories';

export const CACHE_TAG_DISCOVERY_CATEGORY_MAPPINGS =
  'discovery-category-mappings';

export const CACHE_TAG_DISCOVERY_FILTER_CONFIGS = 'discovery-filter-configs';

/** CMS 单页：按 slug 失效 */
export function cacheTagCmsPage(slug: string): string {
  return `cms-page:${slug}`;
}
