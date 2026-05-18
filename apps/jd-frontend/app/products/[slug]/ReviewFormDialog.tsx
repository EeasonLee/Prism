'use client';

import { CheckCircle2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { ReviewTarget } from './ProductReviews';
import { ReviewForm } from './ReviewForm';

interface ReviewFormDialogProps {
  sku: string;
  target: ReviewTarget;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

type ReviewSubmitState = {
  message: string;
};

export function ReviewFormDialog({
  sku,
  target,
  isOpen,
  onOpenChange,
  onSubmitted,
}: ReviewFormDialogProps) {
  const [submitState, setSubmitState] = useState<ReviewSubmitState | null>(
    null
  );

  const closeReviewForm = useCallback(() => {
    setSubmitState(null);
    onOpenChange(false);
  }, [onOpenChange]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={submitState ? 'Review submitted' : 'Write a review'}
      onClick={closeReviewForm}
    >
      <div className="relative flex w-full max-w-4xl flex-col">
        <button
          type="button"
          onClick={closeReviewForm}
          aria-label="Close review form"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white shadow transition hover:bg-black/60 sm:-right-6 sm:-top-10 sm:h-8 sm:w-8 sm:bg-white sm:text-ink-muted sm:hover:bg-surface sm:hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
        <div
          className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-background shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl"
          onClick={event => event.stopPropagation()}
        >
          {submitState ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-14 text-center sm:min-h-[420px]">
              <CheckCircle2
                className="h-14 w-14 text-emerald-500"
                aria-hidden="true"
              />
              <h3 className="mt-5 text-2xl font-semibold text-ink">
                Review submitted
              </h3>
              <p className="mt-3 max-w-lg text-sm text-ink-muted sm:text-base">
                {submitState.message}
              </p>
              <button
                type="button"
                onClick={closeReviewForm}
                className="btn-primary mt-8 rounded-full px-6 py-2.5 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          ) : (
            <ReviewForm
              sku={sku}
              target={target}
              onSubmitted={result => {
                setSubmitState({ message: result.message });
                onSubmitted?.();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
