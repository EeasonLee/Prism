'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useAuth } from '../../../lib/auth/context';
import { useAuthModal } from '../../../lib/auth-modal/context';

interface ReviewFormProps {
  sku: string;
  onSubmitted?: () => void;
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

export function ReviewForm({ sku, onSubmitted }: ReviewFormProps) {
  const { user, accessToken, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (!user) return '';
    const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
    return fullName || user.username || user.email;
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAuthenticated || !user || !accessToken) {
      openLogin('signin');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${encodeURIComponent(sku)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          authorName: displayName || user.email,
          authorEmail: user.email,
          magentoUserId: String(user.id),
          rating,
          title,
          content,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        message?: string;
        error?: string;
        detail?: unknown;
      } | null;

      if (!response.ok) {
        const detail =
          data?.detail && typeof data.detail === 'object'
            ? JSON.stringify(data.detail)
            : null;
        throw new Error(
          detail
            ? `${data?.error ?? 'Failed to submit review'} (${detail})`
            : data?.error ?? 'Failed to submit review'
        );
      }

      setTitle('');
      setContent('');
      setRating(5);
      setSuccess(
        data?.message ??
          'Your review has been submitted and is pending approval.'
      );
      onSubmitted?.();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to submit review'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ink">Write a review</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Share your experience with this product. Reviews appear after
            approval.
          </p>
        </div>
        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => openLogin('signin')}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            Sign in to review
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <span className="mb-2 block text-sm font-medium text-ink">
            Rating
          </span>
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }, (_, index) => {
              const starValue = index + 1;
              const active = starValue <= rating;
              return (
                <button
                  key={starValue}
                  type="button"
                  aria-label={`Rate ${starValue} star${
                    starValue > 1 ? 's' : ''
                  }`}
                  onClick={() => setRating(starValue)}
                  className="transition hover:scale-105"
                >
                  <svg
                    className={`h-7 w-7 ${
                      active ? 'text-amber-400' : 'text-ink-muted/20'
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d={STAR_PATH} />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="review-title"
            className="mb-2 block text-sm font-medium text-ink"
          >
            Title
          </label>
          <input
            id="review-title"
            type="text"
            maxLength={150}
            minLength={3}
            required
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="Summarize your experience"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div>
          <label
            htmlFor="review-content"
            className="mb-2 block text-sm font-medium text-ink"
          >
            Review
          </label>
          <textarea
            id="review-content"
            rows={5}
            maxLength={2000}
            minLength={10}
            required
            value={content}
            onChange={event => setContent(event.target.value)}
            placeholder="What did you like or dislike?"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-muted">
            Only signed-in customers can submit reviews in this release.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting…' : 'Submit review'}
          </button>
        </div>
      </form>
    </section>
  );
}
