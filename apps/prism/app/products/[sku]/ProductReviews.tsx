'use client';

import { BadgeCheck, ThumbsUp } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import type {
  ProductReview,
  ProductReviewListResult,
  ProductReviewPagination,
  ProductReviewSummary,
} from '../../../lib/api/strapi/reviews';
import { Pagination } from '../../recipes/components/Pagination';
import { ReviewForm } from './ReviewForm';
import type { ProductPageExtras, Review as MockReview } from './mock-data';

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'text-amber-400' : 'text-ink-muted/20'
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}

function RatingBar({
  star,
  count,
  total,
}: {
  star: number;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-3 shrink-0 text-right text-xs text-ink-muted">
        {star}
      </span>
      <svg
        className="h-3 w-3 shrink-0 text-amber-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d={STAR_PATH} />
      </svg>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
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

function normalizeMockSummary(
  summary: ProductPageExtras['review_summary']
): ProductReviewSummary {
  return {
    sku: 'mock',
    average: summary.average,
    total: summary.total,
    distribution: summary.distribution,
  };
}

function normalizeMockReviews(reviews: MockReview[]): ProductReview[] {
  return reviews.map(review => ({
    id: review.id,
    sku: 'mock',
    authorName: review.author,
    rating: review.rating,
    title: review.title,
    content: review.content,
    verified: review.verified,
    helpfulCount: review.helpful,
    status: 'approved',
    createdAt: review.date,
    updatedAt: review.date,
  }));
}

function ReviewCard({ review }: { review: ProductReview }) {
  const displayDate =
    formatReviewDate(review.createdAt) || review.createdAt || '';

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
            {getInitials(review.authorName)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
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
            {displayDate && (
              <span className="text-xs text-ink-muted">{displayDate}</span>
            )}
          </div>
        </div>
        <StarRow rating={review.rating} />
      </div>

      <h4 className="mb-2 text-sm font-semibold text-ink">{review.title}</h4>
      <p className="text-sm leading-relaxed text-ink-muted">{review.content}</p>

      {review.helpfulCount > 0 && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
          <ThumbsUp className="h-3.5 w-3.5" />
          <span>{review.helpfulCount} people found this helpful</span>
        </div>
      )}
    </article>
  );
}

interface ProductReviewsProps {
  sku: string;
  summary?: ProductReviewSummary;
  initialReviews?: ProductReview[];
  initialPagination?: ProductReviewPagination;
  mockSummary?: ProductPageExtras['review_summary'];
  mockReviews?: MockReview[];
  allowSubmit?: boolean;
}

export function ProductReviews({
  sku,
  summary,
  initialReviews,
  initialPagination,
  mockSummary,
  mockReviews,
  allowSubmit = true,
}: ProductReviewsProps) {
  const isMock = !!mockSummary && !!mockReviews;

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
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (page: number) => {
      if (isMock) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(
          `/api/reviews/${encodeURIComponent(sku)}?page=${page}&pageSize=${
            pagination.pageSize
          }`,
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
    [isMock, pagination.pageSize, sku]
  );

  const totalReviews =
    effectiveSummary?.total ?? pagination.total ?? reviews.length;

  return (
    <section aria-labelledby="reviews-heading" className="py-12 lg:py-16">
      <h2 id="reviews-heading" className="heading-3 mb-10 text-center text-ink">
        Customer Reviews
      </h2>

      {allowSubmit && <ReviewForm sku={sku} />}

      <div className="mt-8 grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 text-center">
              <p className="text-5xl font-black text-ink">
                {(effectiveSummary?.average ?? 0).toFixed(1)}
              </p>
              <StarRow rating={Math.round(effectiveSummary?.average ?? 0)} />
              <p className="mt-1 text-sm text-ink-muted">
                {totalReviews.toLocaleString()} reviews
              </p>
            </div>
            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map(star => (
                <RatingBar
                  key={star}
                  star={star}
                  count={effectiveSummary?.distribution[star] ?? 0}
                  total={totalReviews}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          {loadError && (
            <p role="alert" className="mb-4 text-sm text-red-500">
              {loadError}
            </p>
          )}

          {reviews.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {reviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
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
                    onPageChange={loadPage}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
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
