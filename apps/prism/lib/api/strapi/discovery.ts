import { apiClient } from '../client';
import type {
  DiscoveryCategory,
  DiscoveryFilterConfig,
  DiscoveryPriceRange,
  DiscoverySeo,
  DiscoverySortOption,
  DiscoveryLayoutType,
} from '../discovery/types';
import { env } from '../../env';

interface StrapiImageLike {
  url?: string | null;
}

interface StrapiSeoRaw {
  title?: string | null;
  description?: string | null;
}

interface StrapiDiscoveryCategoryRaw {
  id: number;
  documentId: string;
  name?: string | null;
  slug?: string | null;
  level?: 1 | 2 | 3 | null;
  sort_order?: number | null;
  is_visible?: boolean | null;
  default_sort?: DiscoverySortOption | null;
  layout_type?: DiscoveryLayoutType | null;
  description?: string | null;
  icon?: StrapiImageLike | null;
  banner?: StrapiImageLike | null;
  seo?: StrapiSeoRaw | null;
  children?: StrapiDiscoveryCategoryRaw[] | null;
}

interface StrapiDiscoveryCategoryMappingRaw {
  id: number;
  documentId: string;
  magento_category_ids?: number[] | null;
  is_active?: boolean | null;
  discovery_category?: {
    id?: number | null;
  } | null;
}

interface StrapiPriceRangeRaw {
  label?: string | null;
  min?: number | null;
  max?: number | null;
}

interface StrapiDiscoveryFilterConfigRaw {
  id: number;
  documentId: string;
  enabled_filters?: string[] | null;
  sort_options?: DiscoverySortOption[] | null;
  default_sort?: DiscoverySortOption | null;
  price_ranges?: StrapiPriceRangeRaw[] | null;
  is_enabled?: boolean | null;
  discovery_category?: {
    id?: number | null;
  } | null;
}

interface StrapiListResponse<T> {
  data: T[];
}

function resolveStrapiUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (env.NEXT_PUBLIC_API_URL ?? 'http://localhost:1337').replace(
    /\/$/,
    ''
  );
  return `${base}${url}`;
}

function normalizeSeo(raw?: StrapiSeoRaw | null): DiscoverySeo | undefined {
  if (!raw) return undefined;
  return {
    title: raw.title ?? undefined,
    description: raw.description ?? undefined,
  };
}

function normalizeCategory(
  raw: StrapiDiscoveryCategoryRaw
): DiscoveryCategory | null {
  if (!raw.name || !raw.slug) return null;

  const children = (raw.children ?? [])
    .map(normalizeCategory)
    .filter((item): item is DiscoveryCategory => item !== null);

  return {
    id: raw.id,
    documentId: raw.documentId,
    name: raw.name,
    slug: raw.slug,
    level: raw.level ?? 1,
    sort_order: raw.sort_order ?? 0,
    is_visible: raw.is_visible ?? true,
    default_sort: raw.default_sort ?? 'featured',
    layout_type: raw.layout_type ?? 'grid',
    description: raw.description ?? undefined,
    icon_url: resolveStrapiUrl(raw.icon?.url),
    banner_url: resolveStrapiUrl(raw.banner?.url),
    seo: normalizeSeo(raw.seo),
    children: children.length > 0 ? children : undefined,
  };
}

function normalizePriceRanges(
  ranges: StrapiPriceRangeRaw[] | null | undefined
): DiscoveryPriceRange[] {
  return (ranges ?? [])
    .map(range => {
      const label = range.label?.trim();
      if (!label) return null;
      return {
        label,
        min: range.min ?? undefined,
        max: range.max ?? undefined,
      };
    })
    .filter((item): item is DiscoveryPriceRange => item !== null);
}

function normalizeFilterConfig(
  raw: StrapiDiscoveryFilterConfigRaw
): DiscoveryFilterConfig {
  return {
    id: raw.id,
    documentId: raw.documentId,
    discovery_category_id: raw.discovery_category?.id ?? 0,
    enabled_filters: raw.enabled_filters ?? [],
    sort_options: raw.sort_options ?? [
      'featured',
      'price_asc',
      'price_desc',
      'newest',
    ],
    default_sort: raw.default_sort ?? 'featured',
    price_ranges: normalizePriceRanges(raw.price_ranges),
    is_enabled: raw.is_enabled ?? true,
  };
}

export async function fetchDiscoveryCategoryBySlug(
  slug: string
): Promise<DiscoveryCategory | null> {
  const encodedSlug = encodeURIComponent(slug);
  const data = await apiClient.get<
    StrapiListResponse<StrapiDiscoveryCategoryRaw>
  >(
    `api/discovery-categories?filters[slug][$eq]=${encodedSlug}&populate[icon]=true&populate[banner]=true&populate[seo]=true&populate[children][populate][icon]=true&populate[children][populate][banner]=true&populate[children][populate][seo]=true`,
    {
      next: { tags: ['discovery-categories'], revalidate: 3600 },
    } as Parameters<typeof apiClient.get>[1]
  );

  const first = data.data[0];
  return first ? normalizeCategory(first) : null;
}

export async function fetchDiscoveryCategoryMapping(
  discoveryCategoryId: string
): Promise<number[]> {
  const encodedId = encodeURIComponent(discoveryCategoryId);
  const data = await apiClient.get<
    StrapiListResponse<StrapiDiscoveryCategoryMappingRaw>
  >(
    `api/discovery-category-mappings?filters[discovery_category][id][$eq]=${encodedId}&filters[is_active][$eq]=true&populate[discovery_category]=true`,
    {
      next: { tags: ['discovery-category-mappings'], revalidate: 3600 },
    } as Parameters<typeof apiClient.get>[1]
  );

  return data.data.flatMap(item => item.magento_category_ids ?? []);
}

export async function fetchDiscoveryFilterConfig(
  discoveryCategoryId: string
): Promise<DiscoveryFilterConfig | null> {
  const encodedId = encodeURIComponent(discoveryCategoryId);
  const data = await apiClient.get<
    StrapiListResponse<StrapiDiscoveryFilterConfigRaw>
  >(
    `api/discovery-filter-configs?filters[discovery_category][id][$eq]=${encodedId}&filters[is_enabled][$eq]=true&populate[discovery_category]=true`,
    {
      next: { tags: ['discovery-filter-configs'], revalidate: 3600 },
    } as Parameters<typeof apiClient.get>[1]
  );

  const first = data.data[0];
  return first ? normalizeFilterConfig(first) : null;
}
