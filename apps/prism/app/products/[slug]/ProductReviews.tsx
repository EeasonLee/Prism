'use client';

import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Star,
  ThumbsUp,
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
import { Pagination } from '../../recipes/components/Pagination';
import { getReviewVisitorKey } from './review-visitor-key';
import { ReviewForm } from './ReviewForm';
import { ReviewImagePreview } from './ReviewImagePreview';
import type { ProductPageExtras, Review as MockReview } from './mock-data';

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
  productSku: string;
  purchasedSku: string | null;
  purchasedVariantLabel: string | null;
  requiresVariantSelection: boolean;
}

interface ProductReviewsProps {
  sku: string;
  target: ReviewTarget;
  summary?: ProductReviewSummary;
  initialReviews?: ProductReview[];
  initialPagination?: ProductReviewPagination;
  mockSummary?: ProductPageExtras['review_summary'];
  mockReviews?: MockReview[];
  allowSubmit?: boolean;
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

function RatingBar({
  label,
  count,
  total,
}: {
  label: keyof SummaryDistribution;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 shrink-0 text-right text-xs font-medium text-ink-muted">
        {label}
      </span>
      <Star
        className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400"
        aria-hidden="true"
      />
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-amber-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs text-ink-muted">
        {count}
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

function normalizeMockSummary(
  summary: ProductPageExtras['review_summary']
): ProductReviewSummary {
  return {
    sku: 'mock',
    average: summary.average,
    total: summary.total,
    distribution: {
      '1': Number(summary.distribution[1] ?? 0),
      '1.5': 0,
      '2': Number(summary.distribution[2] ?? 0),
      '2.5': 0,
      '3': Number(summary.distribution[3] ?? 0),
      '3.5': 0,
      '4': Number(summary.distribution[4] ?? 0),
      '4.5': 0,
      '5': Number(summary.distribution[5] ?? 0),
    },
  };
}

function normalizeMockReviews(reviews: MockReview[]): ProductReview[] {
  return reviews.map(review => ({
    id: review.id,
    documentId: String(review.id),
    sku: 'mock',
    productSku: 'mock',
    purchasedSku: 'mock',
    purchasedVariantLabel: null,
    authorName: review.author,
    rating: review.rating,
    title: review.title,
    content: review.content,
    media: [],
    reviewTags: [],
    dimensionRatings: [],
    verified: review.verified,
    helpfulCount: review.helpful,
    viewerHasMarkedHelpful: false,
    status: 'approved',
    createdAt: review.date,
    updatedAt: review.date,
  }));
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
  const scrollerId = 'customer-media-scroller';
  const scrollByStep = (direction: 'left' | 'right') => {
    const node = document.getElementById(scrollerId);
    if (!node) return;
    const step = 280;
    node.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  return (
    <section className="mt-8 rounded-[28px] border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="heading-4 text-ink">Customer Images and Videos</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByStep('left')}
            className="rounded-full border border-border p-2 text-ink transition hover:border-brand hover:text-brand"
            aria-label="Show previous media items"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByStep('right')}
            className="rounded-full border border-border p-2 text-ink transition hover:border-brand hover:text-brand"
            aria-label="Show next media items"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['all', 'image', 'video'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              activeTab === tab
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border text-ink hover:border-brand hover:text-brand'
            }`}
          >
            {tab === 'all' ? 'All' : tab === 'image' ? 'Images' : 'Videos'}
          </button>
        ))}
      </div>
      {media.length > 0 ? (
        <div id={scrollerId} className="flex gap-3 overflow-x-auto pb-1">
          {media.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface-muted"
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
            {getInitials(review.authorName)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold text-ink">
                {review.authorName}
              </span>
              {review.verified && (
                <BadgeCheck
                  className="h-4 w-4 text-brand"
                  aria-label="Verified purchase"
                />
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              {displayDate && <span>{displayDate}</span>}
              {review.purchasedVariantLabel && (
                <span>{review.purchasedVariantLabel}</span>
              )}
              {!review.purchasedVariantLabel && review.purchasedSku && (
                <span>SKU {review.purchasedSku}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarRow rating={review.rating} size="sm" />
          <span className="text-xs font-medium text-ink-muted">
            {review.rating.toFixed(1)} out of 5
          </span>
        </div>
      </div>

      <h4 className="mt-4 text-base font-semibold text-ink">{review.title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        {review.content}
      </p>

      {reviewDimensionRatings.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {reviewDimensionRatings.map(item => (
            <div
              key={item.slug}
              className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2"
            >
              <span className="text-xs font-medium text-ink-muted">
                {item.name}
              </span>
              <span className="text-xs font-semibold text-ink">
                {item.score} / 5
              </span>
            </div>
          ))}
        </div>
      )}

      <ReviewMediaStrip review={review} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
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
            {review.helpfulCount === 1 ? 'person' : 'people'} found this helpful
          </span>
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
  mockSummary,
  mockReviews,
  allowSubmit = true,
}: ProductReviewsProps) {
  const isMock = !!mockSummary && !!mockReviews;
  const [visitorKey, setVisitorKey] = useState<string | null>(null);

  useEffect(() => {
    setVisitorKey(getReviewVisitorKey());
  }, []);

  const fallbackPagination = useMemo<ProductReviewPagination>(
    () => ({
      page: 1,
      pageSize: isMock ? Math.max(mockReviews?.length ?? 0, 1) : 10,
      pageCount: isMock && mockReviews ? 1 : 0,
      total: isMock && mockReviews ? mockReviews.length : 0,
    }),
    [isMock, mockReviews]
  );

  const normalizedMockSummary = useMemo(
    () => (mockSummary ? normalizeMockSummary(mockSummary) : undefined),
    [mockSummary]
  );
  const normalizedMockReviews = useMemo(
    () => (mockReviews ? normalizeMockReviews(mockReviews) : undefined),
    [mockReviews]
  );

  const effectiveSummary = summary ?? normalizedMockSummary;
  const [reviews, setReviews] = useState<ProductReview[]>(
    initialReviews ?? normalizedMockReviews ?? []
  );
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

  const reviewFilters = useMemo(
    () => ({
      ratings: ratingFilter === 'all' ? [] : [Number(ratingFilter)],
      tagSlugs: selectedTagSlugs,
    }),
    [ratingFilter, selectedTagSlugs]
  );

  const loadPage = useCallback(
    async (page: number, nextSort = sort, nextFilters = reviewFilters) => {
      if (isMock) return;
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
    [isMock, pagination.pageSize, sku, sort, visitorKey, reviewFilters]
  );

  useEffect(() => {
    if (isMock) return;
    void loadPage(1, sort, reviewFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku, isMock]);

  useEffect(() => {
    if (isMock) return;
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
  }, [isMock, sku]);

  const handleHelpful = useCallback(
    async (review: ProductReview) => {
      if (!review.documentId || !visitorKey || isMock) {
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
    [isMock, visitorKey]
  );

  const totalReviews =
    effectiveSummary?.total ?? pagination.total ?? reviews.length;
  const summaryDistribution = useMemo(
    () => mergeSummaryDistribution(effectiveSummary?.distribution),
    [effectiveSummary?.distribution]
  );

  return (
    <section aria-labelledby="reviews-heading" className="py-12 lg:py-16">
      <h2 id="reviews-heading" className="heading-3 mb-8 text-center text-ink">
        Customer Reviews
      </h2>

      {allowSubmit && (
        <ReviewForm
          sku={sku}
          target={target}
          onSubmitted={() => void loadPage(1, sort, reviewFilters)}
        />
      )}

      {dimensionSummary.length > 0 && (
        <section className="mt-8 rounded-[28px] border border-border bg-card p-5 sm:p-6">
          <h3 className="heading-4 text-center text-ink">
            Average Customer Ratings
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dimensionSummary.map(item => (
              <div
                key={item.slug}
                className="rounded-2xl border border-border bg-background px-4 py-3"
              >
                <p className="text-sm font-semibold text-ink">{item.name}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {item.name}, {item.average.toFixed(1)} out of {item.scaleMax}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-amber-400"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, (item.average / item.scaleMax) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-ink">
                    {item.average.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <CustomerMediaGallery
        media={customerMedia.filter(item =>
          mediaTab === 'all' ? true : item.kind === mediaTab
        )}
        activeTab={mediaTab}
        onTabChange={setMediaTab}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div
            data-testid="reviews-summary"
            className="rounded-[28px] border border-border bg-surface p-5 sm:p-6"
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="micro-text uppercase tracking-[0.18em] text-ink-faint">
                  Review snapshot
                </p>
                <div className="mt-3 flex items-end gap-3">
                  <p className="text-5xl font-black tracking-tight text-ink">
                    {(effectiveSummary?.average ?? 0).toFixed(1)}
                  </p>
                  <div className="pb-1">
                    <StarRow
                      rating={effectiveSummary?.average ?? 0}
                      size="md"
                    />
                    <p className="mt-2 text-sm text-ink-muted">
                      {totalReviews.toLocaleString()} reviews
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              {DISTRIBUTION_KEYS.map(key => (
                <RatingBar
                  key={key}
                  label={key}
                  count={summaryDistribution[key]}
                  total={totalReviews}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Browse reviews</p>
              <p className="text-sm text-ink-muted">
                All approved reviews for this product, including every variant.
              </p>
            </div>
            {!isMock && (
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
                        ratings:
                          nextRating === 'all' ? [] : [Number(nextRating)],
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
            )}
          </div>

          {!isMock && availableTags.length > 0 && (
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
              {!isMock && pagination.pageCount > 1 && (
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
    </section>
  );
}
