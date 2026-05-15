import {
  CACHE_TAG_PRODUCT_REVIEWS,
  CACHE_TAG_PRODUCT_REVIEW_SUMMARIES,
  REVALIDATE_SECONDS_REVIEW_UGC,
} from '@/infrastructure/config/cache-policy';
import { strapiClient as apiClient } from '@/infrastructure/api/clients/strapi';
import { resolveImageUrl } from '@/infrastructure/config/image';

interface StrapiReviewMediaRaw {
  id: number;
  kind?: 'image' | 'video';
  url?: string | null;
  width?: number | null;
  height?: number | null;
  mime?: string | null;
  alt?: string | null;
  posterUrl?: string | null;
}

interface StrapiReviewRaw {
  id: number;
  documentId?: string;
  sku?: string | null;
  author_name: string;
  rating: number;
  title: string;
  content: string;
  media?: StrapiReviewMediaRaw[];
  images?: unknown;
  review_tags?: StrapiReviewTagRaw[];
  dimension_ratings?: StrapiReviewDimensionRatingRaw[];
  verified?: boolean | null;
  helpful_count?: number | null;
  viewer_has_marked_helpful?: boolean | null;
  review_status?: 'pending' | 'approved' | 'rejected' | null;
  /** 评论对外展示时间（审核通过 / 同步自 Magento 的发布时间） */
  review_published_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface StrapiReviewListResponseRaw {
  data: StrapiReviewRaw[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiReviewTagRaw {
  id: number;
  documentId?: string | null;
  name: string;
  slug: string;
  sortOrder?: number | null;
  isActive?: boolean | null;
  isScored?: boolean | null;
}

interface StrapiReviewDimensionRatingRaw {
  tagSlug?: string;
  score?: number;
}

interface StrapiReviewTagListResponseRaw {
  data: StrapiReviewTagRaw[];
}

interface StrapiReviewDimensionSummaryItemRaw {
  slug: string;
  name: string;
  average: number;
  count: number;
  scaleMax?: number;
}

interface StrapiReviewDimensionSummaryResponseRaw {
  data: StrapiReviewDimensionSummaryItemRaw[];
}

interface StrapiReviewMediaGalleryItemRaw extends StrapiReviewMediaRaw {
  reviewDocumentId?: string | null;
  reviewTitle?: string | null;
  reviewAuthor?: string | null;
  reviewCreatedAt?: string | null;
}

interface StrapiReviewMediaGalleryResponseRaw {
  data: StrapiReviewMediaGalleryItemRaw[];
  meta: {
    pagination: ProductReviewPagination;
    type: 'all' | 'image' | 'video';
  };
}

export type ProductReviewDistributionKey =
  | '1'
  | '1.5'
  | '2'
  | '2.5'
  | '3'
  | '3.5'
  | '4'
  | '4.5'
  | '5';

interface StrapiReviewSummaryRaw {
  data?: {
    sku: string;
    average: number;
    total: number;
    distribution: Partial<Record<ProductReviewDistributionKey, number>>;
  };
}

interface SubmitReviewResponseRaw {
  data: StrapiReviewRaw;
  meta?: {
    message?: string;
  };
}

export interface ProductReviewMedia {
  id: number;
  kind: 'image' | 'video';
  url: string;
  width: number | null;
  height: number | null;
  mime: string | null;
  alt: string | null;
  posterUrl: string | null;
}

export interface ProductReview {
  id: number;
  documentId?: string;
  sku: string;
  authorName: string;
  rating: number;
  title: string;
  content: string;
  media: ProductReviewMedia[];
  reviewTags: ProductReviewTag[];
  dimensionRatings: ProductReviewDimensionRating[];
  verified: boolean;
  helpfulCount: number;
  viewerHasMarkedHelpful: boolean;
  status: 'pending' | 'approved' | 'rejected';
  /** 对应 Strapi `review_published_at`，无则回退 `createdAt` 展示 */
  reviewPublishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProductReviewSummary {
  sku: string;
  average: number;
  total: number;
  distribution: Record<ProductReviewDistributionKey, number>;
}

export interface ProductReviewTag {
  id: number;
  documentId: string | null;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  isScored: boolean;
}

export interface ProductReviewDimensionRating {
  tagSlug: string;
  score: number;
}

export interface ProductReviewDimensionSummaryItem {
  slug: string;
  name: string;
  average: number;
  count: number;
  scaleMax: number;
}

export interface ProductReviewMediaGalleryItem extends ProductReviewMedia {
  reviewDocumentId: string | null;
  reviewTitle: string | null;
  reviewAuthor: string | null;
  reviewCreatedAt: string | null;
}

export interface ProductReviewPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface ProductReviewListResult {
  items: ProductReview[];
  pagination: ProductReviewPagination;
}

export interface ProductReviewMediaGalleryResult {
  items: ProductReviewMediaGalleryItem[];
  pagination: ProductReviewPagination;
  type: 'all' | 'image' | 'video';
}

export interface ReviewQueryFilters {
  ratings?: number[];
  tagSlugs?: string[];
}

export interface SubmitProductReviewInput {
  sku: string;
  authorName: string;
  authorEmail: string;
  /** 登录用户传入 Magento 用户 ID；游客省略 */
  magentoUserId?: string;
  rating: number;
  title: string;
  content: string;
  mediaIds: number[];
  reviewTagSlugs?: string[];
  dimensionRatings?: ProductReviewDimensionRating[];
}

export interface SubmitProductReviewResult {
  review: ProductReview;
  message: string;
}

function normalizeRelativePath(path: string): string {
  const trimmed = path.trim().replace(/^['"]|['"]$/g, '');
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function toReviewImageUrl(
  path: string | null | undefined,
  width?: number | null
): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = normalizeRelativePath(path);
  if (!normalizedPath) return '';

  const resolvedSize =
    typeof width === 'number' && Number.isFinite(width) && width > 0
      ? Math.round(width)
      : undefined;

  return (
    resolveImageUrl(normalizedPath, {
      size: resolvedSize,
      subPath: 'amasty/review',
    }) ?? normalizedPath
  );
}

function parseLegacyImagesField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .flatMap(item => item.split(','))
      .map(item => normalizeRelativePath(item))
      .filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const cleaned = value.trim().replace(/^\[/, '').replace(/\]$/, '');
  if (!cleaned) return [];

  return cleaned
    .split(',')
    .map(item => normalizeRelativePath(item))
    .filter(Boolean);
}

function normalizeReviewMedia(media: StrapiReviewMediaRaw): ProductReviewMedia {
  return {
    id: media.id,
    kind: media.kind === 'video' ? 'video' : 'image',
    url: toReviewImageUrl(media.url, media.width),
    width: media.width ?? null,
    height: media.height ?? null,
    mime: media.mime ?? null,
    alt: media.alt ?? null,
    posterUrl: media.posterUrl
      ? toReviewImageUrl(media.posterUrl, media.width)
      : null,
  };
}

function mergeReviewMedia(
  mediaList: StrapiReviewMediaRaw[] | undefined,
  imagesField: unknown
): ProductReviewMedia[] {
  const normalizedMedia = (mediaList ?? []).map(normalizeReviewMedia);
  const legacyImages = parseLegacyImagesField(imagesField);
  const seenUrls = new Set(
    normalizedMedia.map(item => item.url).filter(Boolean)
  );

  const mappedLegacyMedia = legacyImages
    .map<ProductReviewMedia | null>((path, index) => {
      const url = toReviewImageUrl(path, undefined);
      if (!url || seenUrls.has(url)) return null;
      seenUrls.add(url);
      return {
        id: 1_000_000_000 + index,
        kind: 'image',
        url,
        width: null,
        height: null,
        mime: null,
        alt: null,
        posterUrl: null,
      };
    })
    .filter((item): item is ProductReviewMedia => item !== null);

  return [...normalizedMedia, ...mappedLegacyMedia];
}

function normalizeReviewTag(tag: StrapiReviewTagRaw): ProductReviewTag {
  return {
    id: tag.id,
    documentId: tag.documentId ?? null,
    name: tag.name,
    slug: tag.slug,
    sortOrder: Number(tag.sortOrder ?? 0),
    isActive: tag.isActive ?? true,
    isScored: tag.isScored ?? false,
  };
}

function normalizeDimensionRatings(
  value: StrapiReviewDimensionRatingRaw[] | undefined
): ProductReviewDimensionRating[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => ({
      tagSlug: typeof item.tagSlug === 'string' ? item.tagSlug : '',
      score: Number(item.score ?? -1),
    }))
    .filter(
      item =>
        item.tagSlug.length > 0 &&
        Number.isInteger(item.score) &&
        item.score >= 0 &&
        item.score <= 5
    );
}

export const normalizeReviewMediaForTest = normalizeReviewMedia;
export const mergeReviewMediaForTest = mergeReviewMedia;

function normalizeReview(review: StrapiReviewRaw): ProductReview {
  return {
    id: review.id,
    documentId: review.documentId,
    sku: review.sku ?? '',
    authorName: review.author_name,
    rating: Number(review.rating ?? 0),
    title: review.title,
    content: review.content,
    media: mergeReviewMedia(review.media, review.images),
    reviewTags: (review.review_tags ?? []).map(normalizeReviewTag),
    dimensionRatings: normalizeDimensionRatings(review.dimension_ratings),
    verified: review.verified ?? false,
    helpfulCount: Number(review.helpful_count ?? 0),
    viewerHasMarkedHelpful: review.viewer_has_marked_helpful ?? false,
    status: review.review_status ?? 'pending',
    reviewPublishedAt: review.review_published_at ?? null,
    createdAt: review.createdAt ?? null,
    updatedAt: review.updatedAt ?? null,
  };
}

function emptySummary(sku: string): ProductReviewSummary {
  return {
    sku,
    average: 0,
    total: 0,
    distribution: {
      '1': 0,
      '1.5': 0,
      '2': 0,
      '2.5': 0,
      '3': 0,
      '3.5': 0,
      '4': 0,
      '4.5': 0,
      '5': 0,
    },
  };
}

export async function fetchReviewsBySku(
  sku: string,
  page = 1,
  pageSize = 10,
  sort: 'newest' | 'highest_rating' | 'most_helpful' = 'newest',
  dedupeKey?: string | null,
  filters?: ReviewQueryFilters
): Promise<ProductReviewListResult> {
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sort,
  });
  if (dedupeKey) {
    searchParams.set('dedupeKey', dedupeKey);
  }
  if (filters?.ratings && filters.ratings.length > 0) {
    searchParams.set('ratings', filters.ratings.join(','));
  }
  if (filters?.tagSlugs && filters.tagSlugs.length > 0) {
    searchParams.set('tagSlugs', filters.tagSlugs.join(','));
  }

  const response = await apiClient.get<StrapiReviewListResponseRaw>(
    `api/product-reviews/by-sku/${encodeURIComponent(
      sku
    )}?${searchParams.toString()}`,
    {
      next: {
        tags: [CACHE_TAG_PRODUCT_REVIEWS],
        revalidate: REVALIDATE_SECONDS_REVIEW_UGC,
      },
    } as Parameters<typeof apiClient.get>[1]
  );

  return {
    items: response.data.map(normalizeReview),
    pagination: response.meta.pagination,
  };
}

export async function fetchReviewTags(): Promise<ProductReviewTag[]> {
  const response = await apiClient.get<StrapiReviewTagListResponseRaw>(
    'api/review-tags/active',
    {
      cache: 'no-store',
    } as Parameters<typeof apiClient.get>[1]
  );

  return (response.data ?? []).map(normalizeReviewTag);
}

export async function fetchReviewDimensionSummaryBySku(
  sku: string
): Promise<ProductReviewDimensionSummaryItem[]> {
  const response = await apiClient.get<StrapiReviewDimensionSummaryResponseRaw>(
    `api/product-reviews/by-sku/${encodeURIComponent(sku)}/dimension-summary`,
    {
      cache: 'no-store',
    } as Parameters<typeof apiClient.get>[1]
  );

  return (response.data ?? []).map(item => ({
    slug: item.slug,
    name: item.name,
    average: Number(item.average ?? 0),
    count: Number(item.count ?? 0),
    scaleMax: Number(item.scaleMax ?? 5),
  }));
}

export async function fetchReviewMediaBySku(
  sku: string,
  type: 'all' | 'image' | 'video' = 'all',
  page = 1,
  pageSize = 24
): Promise<ProductReviewMediaGalleryResult> {
  const searchParams = new URLSearchParams({
    type,
    page: String(page),
    pageSize: String(pageSize),
  });
  const response = await apiClient.get<StrapiReviewMediaGalleryResponseRaw>(
    `api/product-reviews/by-sku/${encodeURIComponent(
      sku
    )}/media?${searchParams.toString()}`,
    {
      next: {
        tags: [CACHE_TAG_PRODUCT_REVIEWS],
        revalidate: REVALIDATE_SECONDS_REVIEW_UGC,
      },
    } as Parameters<typeof apiClient.get>[1]
  );

  return {
    items: (response.data ?? []).map(item => ({
      ...normalizeReviewMedia(item),
      reviewDocumentId: item.reviewDocumentId ?? null,
      reviewTitle: item.reviewTitle ?? null,
      reviewAuthor: item.reviewAuthor ?? null,
      reviewCreatedAt: item.reviewCreatedAt ?? null,
    })),
    pagination: response.meta.pagination,
    type: response.meta.type,
  };
}

export async function fetchReviewSummaryBySku(
  sku: string
): Promise<ProductReviewSummary> {
  const response = await apiClient.get<StrapiReviewSummaryRaw>(
    `api/product-review-summaries/by-sku/${encodeURIComponent(sku)}`,
    {
      next: {
        tags: [CACHE_TAG_PRODUCT_REVIEW_SUMMARIES],
        revalidate: REVALIDATE_SECONDS_REVIEW_UGC,
      },
    } as Parameters<typeof apiClient.get>[1]
  );

  if (!response.data) {
    return emptySummary(sku);
  }

  return {
    sku: response.data.sku,
    average: Number(response.data.average ?? 0),
    total: Number(response.data.total ?? 0),
    distribution: {
      '1': Number(response.data.distribution?.['1'] ?? 0),
      '1.5': Number(response.data.distribution?.['1.5'] ?? 0),
      '2': Number(response.data.distribution?.['2'] ?? 0),
      '2.5': Number(response.data.distribution?.['2.5'] ?? 0),
      '3': Number(response.data.distribution?.['3'] ?? 0),
      '3.5': Number(response.data.distribution?.['3.5'] ?? 0),
      '4': Number(response.data.distribution?.['4'] ?? 0),
      '4.5': Number(response.data.distribution?.['4.5'] ?? 0),
      '5': Number(response.data.distribution?.['5'] ?? 0),
    },
  };
}

export async function submitReview(
  input: SubmitProductReviewInput,
  accessToken?: string | null
): Promise<SubmitProductReviewResult> {
  const dataPayload: Record<string, unknown> = {
    sku: input.sku,
    author_name: input.authorName,
    author_email: input.authorEmail,
    rating: input.rating,
    title: input.title,
    content: input.content,
    media: input.mediaIds,
    review_tags: input.reviewTagSlugs ?? [],
    dimension_ratings: input.dimensionRatings ?? [],
  };
  const trimmedMagento = input.magentoUserId?.trim();
  if (trimmedMagento) {
    dataPayload.magento_user_id = trimmedMagento;
  }

  const response = await apiClient.post<SubmitReviewResponseRaw>(
    'api/product-reviews',
    {
      body: {
        data: dataPayload,
      },
      cache: 'no-store',
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    }
  );

  return {
    review: normalizeReview(response.data),
    message: response.meta?.message ?? 'Review submitted and pending approval.',
  };
}
