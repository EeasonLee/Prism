import { env } from '@/core/config/env';
import {
  getApiBaseUrl,
  getStrapiServerBaseUrl,
} from '@/core/config/api-config';

/**
 * Strapi custom routes are prefixed with ``api/``. When ``STRAPI_URL`` /
 * ``STRAPI_INTERNAL_URL`` is configured on the server, connect directly
 * to Strapi to avoid routing through ``NEXT_PUBLIC_API_URL`` (public/nginx
 * loopback, which can be extremely slow, time out, and appear to "retry endlessly").
 */
function resolveServerSideBaseUrl(cleanUrl: string): string {
  if (cleanUrl.startsWith('http')) {
    return getApiBaseUrl();
  }
  const strapiStylePath =
    cleanUrl.startsWith('api/') && !cleanUrl.startsWith('api-proxy/');
  if (!strapiStylePath) {
    return getApiBaseUrl();
  }
  const hasExplicitStrapiHost =
    Boolean((env.STRAPI_INTERNAL_URL || '').trim()) ||
    Boolean((env.STRAPI_URL || '').trim());
  if (!hasExplicitStrapiHost) {
    return getApiBaseUrl();
  }
  try {
    return getStrapiServerBaseUrl();
  } catch {
    return getApiBaseUrl();
  }
}

/**
 * Server-side request options (extends Next.js fetch options)
 */
export interface ServerRequestOptions extends RequestInit {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

/**
 * Server-side request adapter
 * - Uses native fetch to call backend APIs directly (no CORS)
 * - Supports Next.js cache configuration
 * - Automatically adds auth token
 */
export async function serverRequest(
  url: string,
  options: ServerRequestOptions = {}
): Promise<Response> {
  const { next, ...fetchOptions } = options;

  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  const baseUrl = resolveServerSideBaseUrl(cleanUrl);
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}/${cleanUrl}`;

  const headers = new Headers(fetchOptions.headers);

  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  if (env.STRAPI_API_TOKEN) {
    headers.set('token', env.STRAPI_API_TOKEN);
  }

  return await fetch(fullUrl, {
    ...fetchOptions,
    headers,
    next,
  });
}
