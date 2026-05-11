/**
 * 商品详情页 URL 构建
 *
 * 这是项目中生成商品详情 URL 的**唯一入口**。
 * 所有组件、列表、推荐模块均通过此函数构建跳转链接。
 *
 * @see docs/product-display-rules.md 第六章
 */

import type { UnifiedProductDisplay } from '../types';

// ─── 类型 ──────────────────────────────────────────────────────────────────────

export interface ProductNavigationOptions {
  /** 是否自动领取优惠券（PDP 读取 ?coupon=auto 参数） */
  autoClaimCoupon?: boolean;
  /** 面包屑来源标识（用于记录导航路径） */
  breadcrumbSource?: 'search' | 'category' | 'recommendation';
  /** 是否新标签页打开 */
  openInNewTab?: boolean;
}

/**
 * buildProductUrl 接受的精简输入：只需要 url_key / sku / cp_code。
 * 组件可传入完整 UnifiedProductDisplay 或其 Pick 子集。
 */
type ProductUrlInput = Pick<
  UnifiedProductDisplay,
  'url_key' | 'sku' | 'cp_code'
>;

// ─── 纯函数 ────────────────────────────────────────────────────────────────────

/**
 * 构建商品详情页 URL
 *
 * 规则：
 * - 优先使用 url_key（SEO 友好）
 * - url_key 不存在时 fallback 到 sku
 * - 自动对路径段进行 encodeURIComponent
 */
export function buildProductUrl(
  product: ProductUrlInput,
  options?: ProductNavigationOptions
): string {
  const pathSegment = encodeURIComponent(product.url_key ?? product.sku);
  let url = `/products/${pathSegment}`;

  const params = new URLSearchParams();

  if (options?.autoClaimCoupon && product.cp_code) {
    params.set('coupon', 'auto');
  }

  if (options?.breadcrumbSource) {
    params.set('breadcrumb', options.breadcrumbSource);
  }

  const qs = params.toString();
  if (qs) {
    url += `?${qs}`;
  }

  return url;
}

/**
 * 判断是否应该以新标签页打开。
 * 纯逻辑判断，不涉及 DOM 操作（可在服务端/客户端使用）。
 */
export function shouldOpenInNewTab(
  options?: ProductNavigationOptions
): boolean {
  return options?.openInNewTab ?? false;
}
