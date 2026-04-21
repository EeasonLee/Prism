import { serverRequest } from '@/lib/api/adapters/server-adapter';
import {
  CACHE_TAG_HEADER_MENU,
  REVALIDATE_SECONDS_CATEGORY_NAV,
} from '@/lib/api/cache-policy';
import type { HeaderMenuNode, HeaderMenuResult } from './types';

interface HeaderMenuPayloadLike {
  data?: {
    menu?: unknown;
  } | null;
}

function isHeaderMenuNode(
  value: HeaderMenuNode | null
): value is HeaderMenuNode {
  return value !== null;
}

function normalizeNode(value: unknown): HeaderMenuNode | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;

  const titleRaw = row.title;
  const title = typeof titleRaw === 'string' ? titleRaw.trim() : '';
  if (!title) return null;

  const urlRaw = row.url;
  const url =
    typeof urlRaw === 'string' && urlRaw.trim() ? urlRaw.trim() : null;

  const openInNewTab = row.openInNewTab === true || row.openInNewTab === 'true';

  const childrenRaw = row.children;
  const children = Array.isArray(childrenRaw)
    ? childrenRaw.map(normalizeNode).filter(isHeaderMenuNode)
    : [];

  return {
    title,
    url,
    openInNewTab,
    children,
  };
}

export async function getHeaderMenu(locale = 'en'): Promise<HeaderMenuResult> {
  const response = await serverRequest(
    `api/header-menus?locale=${encodeURIComponent(locale)}`,
    {
      next: {
        revalidate: REVALIDATE_SECONDS_CATEGORY_NAV,
        tags: [CACHE_TAG_HEADER_MENU],
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch header menu: ${response.status}`);
  }

  const payload = (await response.json()) as HeaderMenuPayloadLike;
  const rawMenu = payload?.data?.menu;
  const items = Array.isArray(rawMenu)
    ? rawMenu.map(normalizeNode).filter(isHeaderMenuNode)
    : [];

  return { items };
}
