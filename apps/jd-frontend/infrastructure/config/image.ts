/**
 * 图片环境配置
 *
 * 全项目唯一配置入口。集中管理 baseUrl、域名重写映射，封装 resolveImageUrl。
 */

import {
  resolveImageUrl as rawResolveImageUrl,
  getOptimalCdnSize,
} from '@prism/shared';
import type { ResolveImageUrlOptions } from '@prism/shared';

// ─── 域名重写映射 ──────────────────────────────────────────────────────────────

/** 历史域名 → CDN 映射。可通过 NEXT_PUBLIC_IMAGE_DOMAIN_REWRITE_MAP 覆盖 */
export function getDomainRewriteMap(): Record<string, string> {
  try {
    const envMap = process.env['NEXT_PUBLIC_IMAGE_DOMAIN_REWRITE_MAP'];
    if (envMap) {
      return JSON.parse(envMap);
    }
  } catch {
    // JSON 解析失败，使用默认值
  }

  return {
    'www.joydeem.com': 'https://d2s2mafqv46idp.cloudfront.net/joydeem',
    'joydeem.com': 'https://d2s2mafqv46idp.cloudfront.net/joydeem',
  };
}

// ─── baseUrl ──────────────────────────────────────────────────────────────────

function getImageBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env['NEXT_PUBLIC_IMAGE_BASE_URL'] || '';
  }
  return process.env['NEXT_PUBLIC_IMAGE_BASE_URL'] || '';
}

// ─── 缓存配置（避免每次调用重复计算） ─────────────────────────────────────────

let _baseUrl: string | undefined;
let _domainRewriteMap: Record<string, string> | undefined;

function getCachedBaseUrl(): string {
  if (_baseUrl === undefined) {
    _baseUrl = getImageBaseUrl();
  }
  return _baseUrl;
}

function getCachedDomainRewriteMap(): Record<string, string> {
  if (_domainRewriteMap === undefined) {
    _domainRewriteMap = getDomainRewriteMap();
  }
  return _domainRewriteMap;
}

// ─── 公开 API ─────────────────────────────────────────────────────────────────

/** 全项目统一入口：自动注入 baseUrl 和 domainRewriteMap */
export function resolveImageUrl(
  source: Parameters<typeof rawResolveImageUrl>[0],
  options?: ResolveImageUrlOptions
): string | null {
  return rawResolveImageUrl(source, {
    ...options,
    baseUrl: options?.baseUrl ?? getCachedBaseUrl(),
    domainRewriteMap: options?.domainRewriteMap ?? getCachedDomainRewriteMap(),
  });
}

export { getOptimalCdnSize };
export type { ResolveImageUrlOptions };
