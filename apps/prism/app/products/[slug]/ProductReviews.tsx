'use client';

import {
  BadgeCheck,
  ImageIcon,
  LoaderCircle,
  ThumbsUp,
  Video,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ProductReview,
  ProductReviewDistributionKey,
  ProductReviewDimensionSummaryItem,
  ProductReviewListResult,
  ProductReviewMediaGalleryItem,
  ProductReviewPagination,
  ProductReviewSummary,
  ProductReviewTag,
} from '../../../lib/api/strapi/reviews';
import { cn } from '@prism/shared';
import { Pagination } from '../../recipes/components/Pagination';
import { getReviewVisitorKey } from './review-visitor-key';
import { ReviewForm } from './ReviewForm';
import { ReviewImagePreview } from './ReviewImagePreview';

interface SummaryDistribution {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';
const DISTRIBUTION_KEYS: Array<keyof SummaryDistribution> = [
  '5',
  '4',
  '3',
  '2',
  '1',
];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'highest_rating', label: 'Highest rating' },
  { value: 'most_helpful', label: 'Most helpful' },
] as const;
const RATING_FILTER_OPTIONS = [
  { value: 'all', label: 'All ratings' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
] as const;

export interface ReviewTarget {
  sku: string;
  requiresVariantSelection: boolean;
}

interface ProductReviewsProps {
  sku: string;
  target: ReviewTarget;
  summary?: ProductReviewSummary;
  initialReviews?: ProductReview[];
  initialPagination?: ProductReviewPagination;
  allowSubmit?: boolean;
  isReviewFormOpen?: boolean;
  onReviewFormOpenChange?: (open: boolean) => void;
}

function StarRow({
  rating,
  size = 'md',
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dimension =
    size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div
      className="relative flex gap-0.5"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={`base-${i}`}
          className={`${dimension} text-ink-muted/20`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
      <div
        className="absolute inset-0 flex gap-0.5 overflow-hidden text-amber-400"
        style={{ width: `${Math.max(0, Math.min(100, (rating / 5) * 100))}%` }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <svg
            key={`fill-${i}`}
            className={`${dimension} shrink-0`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d={STAR_PATH} />
          </svg>
        ))}
      </div>
    </div>
  );
}

function DistributionRow({
  stars,
  count,
  total,
}: {
  stars: keyof SummaryDistribution;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <span className="w-8 shrink-0 text-sm font-medium tabular-nums text-ink-muted sm:w-9">
        {stars}★
      </span>
      <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-sm tabular-nums text-ink sm:w-10">
        {Math.round(pct)}%
      </span>
      <span className="w-12 shrink-0 text-right text-sm tabular-nums text-ink-faint sm:w-14">
        ({count.toLocaleString('en-US')})
      </span>
    </div>
  );
}

function formatReviewDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getInitials(name: string) {
  const parts = name
    .split(' ')
    .map(part => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'NA';
  return parts.map(part => part[0]?.toUpperCase() ?? '').join('');
}

function mergeSummaryDistribution(
  distribution?: Partial<Record<ProductReviewDistributionKey, number>>
): SummaryDistribution {
  return {
    '5': Number(distribution?.['5'] ?? 0),
    '4': Number(distribution?.['4'] ?? 0) + Number(distribution?.['4.5'] ?? 0),
    '3': Number(distribution?.['3'] ?? 0) + Number(distribution?.['3.5'] ?? 0),
    '2': Number(distribution?.['2'] ?? 0) + Number(distribution?.['2.5'] ?? 0),
    '1': Number(distribution?.['1'] ?? 0) + Number(distribution?.['1.5'] ?? 0),
  };
}

function ReviewMediaStrip({ review }: { review: ProductReview }) {
  if (review.media.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
      {review.media.map((media, index) => (
        <div
          key={media.id}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface-muted"
        >
          <ReviewImagePreview
            media={review.media}
            initialIndex={index}
            altFallback={review.title}
            thumbnailClassName="h-full w-full object-cover"
            buttonClassName="h-full w-full cursor-pointer"
            previewLabel={`Preview review media ${index + 1}`}
          />
        </div>
      ))}
    </div>
  );
}

function CustomerMediaGallery({
  media,
  activeTab,
  onTabChange,
}: {
  media: ProductReviewMediaGalleryItem[];
  activeTab: 'all' | 'image' | 'video';
  onTabChange: (next: 'all' | 'image' | 'video') => void;
}) {
  const mediaTabs: Array<{
    key: 'all' | 'image' | 'video';
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'all', label: 'All' },
    { key: 'image', label: 'Images', icon: ImageIcon },
    { key: 'video', label: 'Videos', icon: Video },
  ];

  return (
    <section className="mt-8 rounded-[28px] border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="heading-4 text-ink">Customer Photos &amp; Videos</h3>
        <div className="flex items-center gap-2">
          {mediaTabs.map(tab => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`inline-flex h-8 items-center justify-center rounded-lg border text-sm transition ${
                  tab.key === 'all'
                    ? `px-3 font-medium ${
                        isActive
                          ? 'border-ink bg-ink text-background'
                          : 'border-border text-ink hover:border-ink'
                      }`
                    : `w-8 ${
                        isActive
                          ? 'border-ink bg-ink text-background'
                          : 'border-border text-ink-muted hover:border-ink hover:text-ink'
                      }`
                }`}
                aria-label={`Filter by ${tab.label.toLowerCase()}`}
                aria-pressed={isActive}
              >
                {Icon ? (
                  <>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{tab.label}</span>
                  </>
                ) : (
                  tab.label
                )}
              </button>
            );
          })}
        </div>
      </div>
      {media.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {media.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-muted"
            >
              <ReviewImagePreview
                media={media}
                initialIndex={index}
                altFallback={item.reviewTitle ?? 'Review media'}
                thumbnailClassName="h-full w-full object-cover"
                buttonClassName="h-full w-full cursor-pointer"
                previewLabel={`Preview customer media ${index + 1}`}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">
          No customer media available for this filter.
        </p>
      )}
    </section>
  );
}

function ReviewCard({
  review,
  onHelpful,
  helpfulPending,
}: {
  review: ProductReview;
  onHelpful: (review: ProductReview) => Promise<void>;
  helpfulPending: boolean;
}) {
  const displayDate =
    formatReviewDate(review.createdAt) || review.createdAt || '';
  const reviewDimensionRatings = review.dimensionRatings
    .map(item => {
      const relatedTag = review.reviewTags.find(
        tag => tag.slug === item.tagSlug
      );
      return {
        slug: item.tagSlug,
        name: relatedTag?.name ?? item.tagSlug,
        score: item.score,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <article className="rounded-[26px] border border-border bg-card p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,180px)_minmax(0,1fr)_minmax(0,250px)] lg:items-start">
        <aside className="space-y-3 lg:pr-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
              {getInitials(review.authorName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-ink">
                  {review.authorName}
                </span>
                {review.verified && (
                  <BadgeCheck
                    className="h-4 w-4 text-brand"
                    aria-label="Verified purchase"
                  />
                )}
              </div>
              {displayDate && (
                <p className="mt-1 text-xs text-ink-muted">{displayDate}</p>
              )}
            </div>
          </div>

          <dl className="space-y-1.5 text-sm">
            {review.sku && (
              <div className="flex items-start justify-between gap-3">
                <dt className="text-ink-faint">SKU</dt>
                <dd className="text-right font-medium text-ink">
                  {review.sku}
                </dd>
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <dt className="text-ink-faint">Rating</dt>
              <dd className="font-semibold tabular-nums text-ink">
                {review.rating.toFixed(1)} / 5
              </dd>
            </div>
          </dl>
        </aside>

        <div className="lg:pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <StarRow rating={review.rating} size="sm" />
            <span className="text-sm font-medium text-ink-muted">
              {review.rating.toFixed(1)} out of 5 stars
            </span>
          </div>

          <h4 className="mt-2 text-2xl font-bold leading-tight text-ink">
            {review.title}
          </h4>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {review.content}
          </p>

          <ReviewMediaStrip review={review} />

          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => {
                void onHelpful(review);
              }}
              disabled={
                helpfulPending ||
                review.viewerHasMarkedHelpful ||
                !review.documentId
              }
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                review.viewerHasMarkedHelpful
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border text-ink hover:border-brand hover:text-brand'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {helpfulPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ThumbsUp className="h-4 w-4" />
              )}
              Helpful ({review.helpfulCount})
            </button>
            {review.helpfulCount > 0 && (
              <span className="text-xs text-ink-muted">
                {review.helpfulCount}{' '}
                {review.helpfulCount === 1 ? 'person' : 'people'} found this
                helpful
              </span>
            )}
          </div>
        </div>

        {reviewDimensionRatings.length > 0 && (
          <aside className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <p className="text-sm font-semibold text-ink">
              Ratings by Attribute
            </p>
            <div className="mt-3 space-y-3">
              {reviewDimensionRatings.map(item => (
                <div key={item.slug}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-ink-muted">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                      {item.score.toFixed(1)}
                    </span>
                  </div>
                  <div
                    className="relative h-2 overflow-hidden rounded-full bg-surface-muted"
                    aria-hidden="true"
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-brand"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, (item.score / 5) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </article>
  );
}

export function ProductReviews({
  sku,
  target,
  summary,
  initialReviews,
  initialPagination,
  allowSubmit = true,
  isReviewFormOpen,
  onReviewFormOpenChange,
}: ProductReviewsProps) {
  const [visitorKey, setVisitorKey] = useState<string | null>(null);

  useEffect(() => {
    setVisitorKey(getReviewVisitorKey());
  }, []);

  const fallbackPagination = useMemo<ProductReviewPagination>(
    () => ({
      page: 1,
      pageSize: 10,
      pageCount: 0,
      total: 0,
    }),
    []
  );
  const effectiveSummary = summary;
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews ?? []);
  const [pagination, setPagination] = useState<ProductReviewPagination>(
    initialPagination ?? fallbackPagination
  );
  const [sort, setSort] =
    useState<(typeof SORT_OPTIONS)[number]['value']>('newest');
  const [ratingFilter, setRatingFilter] =
    useState<(typeof RATING_FILTER_OPTIONS)[number]['value']>('all');
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [helpfulPendingId, setHelpfulPendingId] = useState<number | null>(null);
  const [availableTags, setAvailableTags] = useState<ProductReviewTag[]>([]);
  const [customerMedia, setCustomerMedia] = useState<
    ProductReviewMediaGalleryItem[]
  >([]);
  const [mediaTab, setMediaTab] = useState<'all' | 'image' | 'video'>('all');
  const [dimensionSummary, setDimensionSummary] = useState<
    ProductReviewDimensionSummaryItem[]
  >([]);
  const [internalIsReviewFormOpen, setInternalIsReviewFormOpen] =
    useState(false);

  const effectiveIsReviewFormOpen =
    isReviewFormOpen ?? internalIsReviewFormOpen;

  const setReviewFormOpen = useCallback(
    (open: boolean) => {
      onReviewFormOpenChange?.(open);
      if (isReviewFormOpen === undefined) {
        setInternalIsReviewFormOpen(open);
      }
    },
    [isReviewFormOpen, onReviewFormOpenChange]
  );

  const reviewFilters = useMemo(
    () => ({
      ratings: ratingFilter === 'all' ? [] : [Number(ratingFilter)],
      tagSlugs: selectedTagSlugs,
    }),
    [ratingFilter, selectedTagSlugs]
  );

  const loadPage = useCallback(
    async (page: number, nextSort = sort, nextFilters = reviewFilters) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pagination.pageSize),
          sort: nextSort,
        });
        if (visitorKey) {
          params.set('dedupeKey', visitorKey);
        }
        if (nextFilters.ratings.length > 0) {
          params.set('ratings', nextFilters.ratings.join(','));
        }
        if (nextFilters.tagSlugs.length > 0) {
          params.set('tagSlugs', nextFilters.tagSlugs.join(','));
        }

        const response = await fetch(
          `/api/reviews/${encodeURIComponent(sku)}?${params.toString()}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );
        const data = (await response.json().catch(() => null)) as
          | ProductReviewListResult
          | { error?: string }
          | null;

        if (!response.ok || !data || !('items' in data)) {
          throw new Error(
            data && 'error' in data && typeof data.error === 'string'
              ? data.error
              : 'Failed to load reviews'
          );
        }

        setReviews(data.items);
        setPagination(data.pagination);
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load reviews'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.pageSize, sku, sort, visitorKey, reviewFilters]
  );

  useEffect(() => {
    void loadPage(1, sort, reviewFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku]);

  useEffect(() => {
    const loadAuxData = async () => {
      try {
        const [tagResponse, mediaResponse, dimensionResponse] =
          await Promise.all([
            fetch('/api/reviews/tags', { method: 'GET', cache: 'no-store' }),
            fetch(
              `/api/reviews/${encodeURIComponent(
                sku
              )}/media?type=all&page=1&pageSize=36`,
              {
                method: 'GET',
                cache: 'no-store',
              }
            ),
            fetch(`/api/reviews/${encodeURIComponent(sku)}/dimension-summary`, {
              method: 'GET',
              cache: 'no-store',
            }),
          ]);

        const tagData = (await tagResponse.json().catch(() => null)) as {
          items?: ProductReviewTag[];
        } | null;
        const mediaData = (await mediaResponse.json().catch(() => null)) as {
          items?: ProductReviewMediaGalleryItem[];
        } | null;
        const dimensionData = (await dimensionResponse
          .json()
          .catch(() => null)) as {
          items?: ProductReviewDimensionSummaryItem[];
        } | null;

        setAvailableTags(tagResponse.ok ? tagData?.items ?? [] : []);
        setCustomerMedia(mediaResponse.ok ? mediaData?.items ?? [] : []);
        setDimensionSummary(
          dimensionResponse.ok ? dimensionData?.items ?? [] : []
        );
      } catch (_error) {
        setAvailableTags([]);
        setCustomerMedia([]);
        setDimensionSummary([]);
      }
    };

    void loadAuxData();
  }, [sku]);

  const handleHelpful = useCallback(
    async (review: ProductReview) => {
      if (!review.documentId || !visitorKey) {
        return;
      }

      setHelpfulPendingId(review.id);
      setLoadError(null);
      try {
        const response = await fetch('/api/reviews/helpful', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentId: review.documentId,
            dedupeKey: visitorKey,
          }),
        });

        const data = (await response.json().catch(() => null)) as {
          helpfulCount?: number;
          viewerHasMarkedHelpful?: boolean;
          error?: string;
        } | null;

        if (!response.ok) {
          throw new Error(data?.error ?? 'Failed to update helpful state');
        }

        setReviews(current =>
          current.map(item =>
            item.id === review.id
              ? {
                  ...item,
                  helpfulCount: Number(data?.helpfulCount ?? item.helpfulCount),
                  viewerHasMarkedHelpful:
                    data?.viewerHasMarkedHelpful ?? item.viewerHasMarkedHelpful,
                }
              : item
          )
        );
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Failed to update helpful state'
        );
      } finally {
        setHelpfulPendingId(null);
      }
    },
    [visitorKey]
  );

  const totalReviews =
    effectiveSummary?.total ?? pagination.total ?? reviews.length;
  const summaryDistribution = useMemo(
    () => mergeSummaryDistribution(effectiveSummary?.distribution),
    [effectiveSummary?.distribution]
  );
  const closeReviewForm = useCallback(() => {
    setReviewFormOpen(false);
  }, [setReviewFormOpen]);

  const showDimensionBreakdown = dimensionSummary.length > 0;

  return (
    <section aria-labelledby="reviews-heading" className="py-12 lg:py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h2 id="reviews-heading" className="heading-3 text-ink">
          Customer Reviews
        </h2>
        {allowSubmit && (
          <button
            type="button"
            onClick={() => setReviewFormOpen(true)}
            className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            Write a review
          </button>
        )}
      </div>

      <div className="mt-8 space-y-8">
        <div>
          <div
            data-testid="reviews-summary"
            className={cn(
              'grid gap-4',
              showDimensionBreakdown
                ? 'lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,260px)]'
                : 'lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]'
            )}
          >
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-5 py-6 text-center sm:px-6">
              <p className="text-5xl font-black tracking-tight text-ink">
                {(effectiveSummary?.average ?? 0).toFixed(1)}
              </p>
              <div className="mt-2">
                <StarRow rating={effectiveSummary?.average ?? 0} size="lg" />
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                {totalReviews.toLocaleString('en-US')}{' '}
                {totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 lg:min-w-0">
              <div className="space-y-2.5">
                {DISTRIBUTION_KEYS.map(key => (
                  <DistributionRow
                    key={key}
                    stars={key}
                    count={summaryDistribution[key]}
                    total={totalReviews}
                  />
                ))}
              </div>
            </div>

            {showDimensionBreakdown && (
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6 lg:min-w-0">
                <h3 className="mb-4 text-sm font-semibold text-ink">
                  Ratings by Attribute
                </h3>
                <div className="space-y-3">
                  {dimensionSummary.map(item => (
                    <div
                      key={item.slug}
                      className="flex items-center gap-2 sm:gap-3"
                    >
                      <span
                        className="max-w-[42%] shrink-0 truncate text-sm text-ink-muted sm:max-w-[38%]"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      <div
                        className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted"
                        aria-label={`${item.name}, ${item.average.toFixed(
                          1
                        )} out of ${item.scaleMax}`}
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-brand"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                (item.average / item.scaleMax) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right text-sm font-semibold tabular-nums text-ink sm:w-10">
                        {item.average.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <CustomerMediaGallery
          media={customerMedia.filter(item =>
            mediaTab === 'all' ? true : item.kind === mediaTab
          )}
          activeTab={mediaTab}
          onTabChange={setMediaTab}
        />

        <div>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Browse reviews</p>
              <p className="text-sm text-ink-muted">
                All approved reviews for this product.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                <span>Rating</span>
                <select
                  value={ratingFilter}
                  onChange={event => {
                    const nextRating = event.target
                      .value as (typeof RATING_FILTER_OPTIONS)[number]['value'];
                    setRatingFilter(nextRating);
                    const nextFilters = {
                      ratings: nextRating === 'all' ? [] : [Number(nextRating)],
                      tagSlugs: selectedTagSlugs,
                    };
                    void loadPage(1, sort, nextFilters);
                  }}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                >
                  {RATING_FILTER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                <span>Sort by</span>
                <select
                  value={sort}
                  onChange={event => {
                    const nextSort = event.target
                      .value as (typeof SORT_OPTIONS)[number]['value'];
                    setSort(nextSort);
                    void loadPage(1, nextSort, reviewFilters);
                  }}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {availableTags.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-muted">Tags:</span>
              {availableTags.map(tag => {
                const isSelected = selectedTagSlugs.includes(tag.slug);
                return (
                  <button
                    key={tag.slug}
                    type="button"
                    onClick={() => {
                      const nextTagSlugs = isSelected
                        ? selectedTagSlugs.filter(slug => slug !== tag.slug)
                        : [...selectedTagSlugs, tag.slug];
                      setSelectedTagSlugs(nextTagSlugs);
                      const nextFilters = {
                        ratings:
                          ratingFilter === 'all' ? [] : [Number(ratingFilter)],
                        tagSlugs: nextTagSlugs,
                      };
                      void loadPage(1, sort, nextFilters);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      isSelected
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border text-ink hover:border-brand hover:text-brand'
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}

          {loadError && (
            <p role="alert" className="mb-4 text-sm text-red-500">
              {loadError}
            </p>
          )}

          {reviews.length > 0 ? (
            <>
              <div className="grid gap-4">
                {reviews.map(review => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onHelpful={handleHelpful}
                    helpfulPending={helpfulPendingId === review.id}
                  />
                ))}
              </div>
              {pagination.pageCount > 1 && (
                <div className="mt-6">
                  <p className="mb-3 text-sm text-ink-muted">
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                    {Math.min(
                      pagination.page * pagination.pageSize,
                      pagination.total
                    )}{' '}
                    of {pagination.total} reviews
                  </p>
                  <Pagination
                    pagination={pagination}
                    onPageChange={page =>
                      void loadPage(page, sort, reviewFilters)
                    }
                    isLoading={isLoading}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[28px] border border-dashed border-border bg-card p-8 text-center">
              <p className="text-base font-semibold text-ink">
                No approved reviews yet
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                Be the first customer to share your experience with this
                product.
              </p>
            </div>
          )}
        </div>
      </div>

      {allowSubmit && effectiveIsReviewFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Write a review"
          onClick={closeReviewForm}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-background shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeReviewForm}
              aria-label="Close review form"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
            <ReviewForm
              sku={sku}
              target={target}
              onSubmitted={() => {
                closeReviewForm();
                void loadPage(1, sort, reviewFilters);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
