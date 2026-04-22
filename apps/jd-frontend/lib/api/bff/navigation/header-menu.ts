import { serverRequest } from '@/lib/api/adapters/server-adapter';
import {
  CACHE_TAG_HEADER_MENU,
  REVALIDATE_SECONDS_CATEGORY_NAV,
} from '@/lib/api/cache-policy';
import type {
  HeaderMenuCategoryRef,
  HeaderMenuNode,
  HeaderMenuResult,
} from './types';

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

function normalizeCategoryRef(value: unknown): HeaderMenuCategoryRef | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const slugRaw = row.slug;
  const slug = typeof slugRaw === 'string' ? slugRaw.trim() : '';
  if (!slug) return null;

  const idRaw = row.id;
  const id =
    typeof idRaw === 'number' && Number.isFinite(idRaw)
      ? idRaw
      : typeof idRaw === 'string' && idRaw.trim()
      ? Number(idRaw)
      : null;

  const nameRaw = row.name;
  const name =
    typeof nameRaw === 'string' && nameRaw.trim() ? nameRaw.trim() : null;

  const magentoRaw = row.magentoCategoryId;
  const parsedMagento =
    typeof magentoRaw === 'number'
      ? magentoRaw
      : typeof magentoRaw === 'string' && magentoRaw.trim()
      ? Number(magentoRaw)
      : null;
  const magentoCategoryId =
    typeof parsedMagento === 'number' && Number.isFinite(parsedMagento)
      ? parsedMagento
      : null;

  return {
    id: typeof id === 'number' && Number.isFinite(id) ? id : null,
    name,
    slug,
    magentoCategoryId,
  };
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
  const magentoCategoryIdRaw = row.magentoCategoryId;
  const parsedMagentoCategoryId =
    typeof magentoCategoryIdRaw === 'number'
      ? magentoCategoryIdRaw
      : typeof magentoCategoryIdRaw === 'string' && magentoCategoryIdRaw.trim()
      ? Number(magentoCategoryIdRaw)
      : null;
  const parsedTopLevelMagentoCategoryId =
    typeof parsedMagentoCategoryId === 'number' &&
    Number.isFinite(parsedMagentoCategoryId)
      ? parsedMagentoCategoryId
      : null;
  const category = normalizeCategoryRef(row.category);
  const magentoCategoryId =
    parsedTopLevelMagentoCategoryId ?? category?.magentoCategoryId ?? null;

  const childrenRaw = row.children;
  const children = Array.isArray(childrenRaw)
    ? childrenRaw.map(normalizeNode).filter(isHeaderMenuNode)
    : [];

  return {
    title,
    url,
    openInNewTab,
    magentoCategoryId,
    category,
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
