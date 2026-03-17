import { ThumbsUp, BadgeCheck } from 'lucide-react';
import type { Review, ProductPageExtras } from './mock-data';

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

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        {/* 头像 + 姓名 */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
            {review.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-ink">
                {review.author}
              </span>
              {review.verified && (
                <BadgeCheck
                  className="h-4 w-4 text-brand"
                  aria-label="Verified purchase"
                />
              )}
            </div>
            <span className="text-xs text-ink-muted">{review.date}</span>
          </div>
        </div>
        {/* 评分 */}
        <StarRow rating={review.rating} />
      </div>

      <h4 className="mb-2 text-sm font-semibold text-ink">{review.title}</h4>
      <p className="text-sm leading-relaxed text-ink-muted">{review.content}</p>

      {review.helpful > 0 && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
          <ThumbsUp className="h-3.5 w-3.5" />
          <span>{review.helpful} people found this helpful</span>
        </div>
      )}
    </article>
  );
}

interface ProductReviewsProps {
  summary: ProductPageExtras['review_summary'];
  reviews: Review[];
}

export function ProductReviews({ summary, reviews }: ProductReviewsProps) {
  return (
    <section aria-labelledby="reviews-heading" className="py-12 lg:py-16">
      <h2 id="reviews-heading" className="heading-3 mb-10 text-center text-ink">
        Customer Reviews
      </h2>

      <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
        {/* 评分总览 */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 text-center">
              <p className="text-5xl font-black text-ink">
                {summary.average.toFixed(1)}
              </p>
              <StarRow rating={Math.round(summary.average)} />
              <p className="mt-1 text-sm text-ink-muted">
                {summary.total.toLocaleString()} reviews
              </p>
            </div>
            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map(star => (
                <RatingBar
                  key={star}
                  star={star}
                  count={summary.distribution[star]}
                  total={summary.total}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 评论列表 */}
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
