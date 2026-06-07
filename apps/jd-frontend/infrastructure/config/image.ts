import {
  getOptimalCdnSize,
  resolveImageUrl as rawResolveImageUrl,
} from '@prism/shared';
import type { ResolveImageUrlOptions } from '@prism/shared';

export function getDomainRewriteMap(): Record<string, string> {
  const envMap = process.env['NEXT_PUBLIC_IMAGE_DOMAIN_REWRITE_MAP'];

  if (!envMap) {
    return {};
  }

  try {
    const parsed = JSON.parse(envMap) as unknown;
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function getImageBaseUrl(): string {
  return process.env['NEXT_PUBLIC_IMAGE_BASE_URL'] ?? '';
}

export function resolveImageUrl(
  source: Parameters<typeof rawResolveImageUrl>[0],
  options?: ResolveImageUrlOptions
): string | null {
  return rawResolveImageUrl(source, {
    ...options,
    baseUrl: options?.baseUrl ?? getImageBaseUrl(),
    domainRewriteMap: options?.domainRewriteMap ?? getDomainRewriteMap(),
  });
}

export { getOptimalCdnSize };
export type { ResolveImageUrlOptions };
