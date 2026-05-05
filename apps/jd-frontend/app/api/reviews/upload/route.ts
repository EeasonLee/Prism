import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/core/api/route-helpers';
import { env } from '@/core/config/env';
import {
  getStrapiBaseUrl,
  getStrapiServerBaseUrl,
} from '@/core/config/api-config';

interface StrapiUploadItem {
  id: number;
  url?: string | null;
  mime?: string | null;
  width?: number | null;
  height?: number | null;
  alternativeText?: string | null;
  formats?: {
    thumbnail?: {
      url?: string | null;
    } | null;
  } | null;
}

function toAbsoluteUrl(url: string | null | undefined) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const baseUrl = getStrapiBaseUrl();
  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  return url;
}

function normalizeUploadItem(item: StrapiUploadItem) {
  const mime = item.mime ?? null;
  return {
    id: item.id,
    kind: mime?.startsWith('video/') ? 'video' : 'image',
    url: toAbsoluteUrl(item.url),
    width: item.width ?? null,
    height: item.height ?? null,
    mime,
    alt: item.alternativeText ?? null,
    posterUrl: toAbsoluteUrl(item.formats?.thumbnail?.url ?? null),
  };
}

function extractUploadItems(
  data:
    | StrapiUploadItem[]
    | { items?: StrapiUploadItem[]; error?: string; message?: string }
    | null
) {
  return Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray(data.items)
    ? data.items
    : null;
}

export const extractUploadItemsForTest = extractUploadItems;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const baseUrl = getStrapiServerBaseUrl();
    const uploadUrl = `${baseUrl}/api/review-media/upload`;
    const headers: Record<string, string> = {};

    if (env.STRAPI_API_TOKEN) {
      headers.token = env.STRAPI_API_TOKEN;
    }

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      cache: 'no-store',
    });

    const data = (await response.json().catch(() => null)) as
      | StrapiUploadItem[]
      | { items?: StrapiUploadItem[]; error?: string; message?: string }
      | null;

    const items = extractUploadItems(data);

    if (!response.ok || !items) {
      const message =
        data &&
        typeof data === 'object' &&
        'error' in data &&
        typeof data.error === 'string'
          ? data.error
          : data &&
            typeof data === 'object' &&
            'message' in data &&
            typeof data.message === 'string'
          ? data.message
          : 'Failed to upload review media';

      return NextResponse.json(
        { error: message },
        { status: response.status || 502 }
      );
    }

    return NextResponse.json({ items: items.map(normalizeUploadItem) });
  } catch (error) {
    return handleApiError(error);
  }
}

export const runtime = 'nodejs';
