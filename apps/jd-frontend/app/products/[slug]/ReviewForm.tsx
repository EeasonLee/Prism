'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle, Upload, X } from 'lucide-react';
import type {
  ProductReviewDimensionRating,
  ProductReviewMedia,
  ProductReviewTag,
} from '@/features/product';
import { useAuth } from '@/features/auth';
import { useAuthModal } from '@/features/auth';
import type { ReviewTarget } from './ProductReviews';
import { ReviewImagePreview } from './ReviewImagePreview';
import { guestAuthorLabelFromEmail, isReasonableEmail } from '@prism/shared';

interface ReviewFormProps {
  sku: string;
  target: ReviewTarget;
  onSubmitted?: () => void;
}

interface UploadingReviewMedia {
  localId: string;
  fileName: string;
  kind: 'image' | 'video';
  status: 'uploading' | 'uploaded' | 'failed';
  media: ProductReviewMedia | null;
  error: string | null;
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';
const MAX_ATTACHMENTS = 6;
const MAX_VIDEO_COUNT = 1;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function classifyFile(file: File): 'image' | 'video' | null {
  if (file.type.startsWith('image/')) {
    return 'image';
  }
  if (file.type.startsWith('video/')) {
    return 'video';
  }

  return null;
}

function getMediaValidationError(file: File, kind: 'image' | 'video') {
  if (kind === 'image' && file.size > MAX_IMAGE_SIZE) {
    return `Images must be ${formatFileSize(MAX_IMAGE_SIZE)} or smaller.`;
  }
  if (kind === 'video' && file.size > MAX_VIDEO_SIZE) {
    return `Videos must be ${formatFileSize(MAX_VIDEO_SIZE)} or smaller.`;
  }

  return null;
}

function getDisplayName(user: ReturnType<typeof useAuth>['user']) {
  if (!user) return '';
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return fullName || user.username || user.email;
}

function RatingStars({ rating, active }: { rating: number; active: boolean }) {
  return (
    <div className="relative flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          className="h-5 w-5 text-ink-muted/20"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
      <div
        className={`absolute inset-0 flex gap-0.5 overflow-hidden ${
          active ? 'text-amber-400' : 'text-amber-300'
        }`}
        style={{ width: `${(rating / 5) * 100}%` }}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <svg
            key={index}
            className="h-5 w-5 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d={STAR_PATH} />
          </svg>
        ))}
      </div>
    </div>
  );
}

function RatingControl({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-background p-2">
      <div className="relative">
        <RatingStars rating={rating} active={rating > 0} />
        <div className="absolute inset-0 grid grid-cols-10">
          {Array.from({ length: 10 }, (_, index) => {
            const value = (index + 1) / 2;
            const isLeftHalf = index % 2 === 0;

            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange(value)}
                aria-label={`Rate ${value.toFixed(1)} out of 5`}
                className={
                  isLeftHalf ? 'h-full rounded-l-full' : 'h-full rounded-r-full'
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ReviewForm({ sku, target, onSubmitted }: ReviewFormProps) {
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [uploads, setUploads] = useState<UploadingReviewMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [availableTags, setAvailableTags] = useState<ProductReviewTag[]>([]);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [dimensionScores, setDimensionScores] = useState<
    Record<string, number>
  >({});

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const uploadedMediaIds = uploads
    .map(upload => upload.media?.id ?? null)
    .filter((value): value is number => typeof value === 'number');
  const hasUploadingMedia = uploads.some(
    upload => upload.status === 'uploading'
  );
  const hasFailedMedia = uploads.some(upload => upload.status === 'failed');
  const currentVideoCount = uploads.filter(
    upload => upload.kind === 'video'
  ).length;
  const isSubmitDisabled = isSubmitting || hasUploadingMedia || hasFailedMedia;
  const scoredTags = useMemo(
    () => availableTags.filter(tag => tag.isScored),
    [availableTags]
  );
  const nonScoredTags = useMemo(
    () => availableTags.filter(tag => !tag.isScored),
    [availableTags]
  );

  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch('/api/reviews/tags', {
          method: 'GET',
          cache: 'no-store',
        });
        const data = (await response.json().catch(() => null)) as {
          items?: ProductReviewTag[];
          error?: string | { message?: string };
        } | null;
        if (!response.ok || !data?.items) {
          const msg =
            typeof data?.error === 'string' ? data.error : data?.error?.message;
          throw new Error(msg ?? 'Failed to fetch review tags');
        }
        setAvailableTags(data.items);
        setDimensionScores(current => {
          const next = { ...current };
          for (const tag of data.items ?? []) {
            if (tag.isScored && !Number.isInteger(next[tag.slug])) {
              next[tag.slug] = 5;
            }
          }
          return next;
        });
      } catch (_error) {
        setAvailableTags([]);
      }
    };

    void loadTags();
  }, []);

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    setError(null);
    setSuccess(null);

    if (uploads.length + files.length > MAX_ATTACHMENTS) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
      return;
    }

    const nextUploads: Array<{ file: File; entry: UploadingReviewMedia }> = [];
    let nextVideoCount = currentVideoCount;

    for (const file of files) {
      const kind = classifyFile(file);
      if (!kind) {
        setError('Only image and video files are supported.');
        return;
      }

      if (kind === 'video') {
        nextVideoCount += 1;
        if (nextVideoCount > MAX_VIDEO_COUNT) {
          setError('Only 1 video is allowed.');
          return;
        }
      }

      const validationError = getMediaValidationError(file, kind);
      if (validationError) {
        setError(validationError);
        return;
      }

      nextUploads.push({
        file,
        entry: {
          localId: createLocalId(),
          fileName: file.name,
          kind,
          status: 'uploading',
          media: null,
          error: null,
        },
      });
    }

    setUploads(current => [...current, ...nextUploads.map(item => item.entry)]);

    await Promise.all(
      nextUploads.map(async ({ file, entry }) => {
        const formData = new FormData();
        formData.append('files', file);

        try {
          const response = await fetch('/api/reviews/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          const data = (await response.json().catch(() => null)) as {
            items?: ProductReviewMedia[];
            error?: string | { message?: string };
          } | null;

          if (!response.ok || !data?.items?.[0]) {
            const msg =
              typeof data?.error === 'string'
                ? data.error
                : data?.error?.message;
            throw new Error(msg ?? 'Failed to upload media');
          }

          const uploadedMedia = data.items[0];
          setUploads(current =>
            current.map(item =>
              item.localId === entry.localId
                ? {
                    ...item,
                    status: 'uploaded',
                    media: uploadedMedia,
                    error: null,
                  }
                : item
            )
          );
        } catch (uploadError) {
          setUploads(current =>
            current.map(item =>
              item.localId === entry.localId
                ? {
                    ...item,
                    status: 'failed',
                    error:
                      uploadError instanceof Error
                        ? uploadError.message
                        : 'Failed to upload media',
                  }
                : item
            )
          );
        }
      })
    );
  };

  const removeUpload = (localId: string) => {
    setUploads(current => current.filter(item => item.localId !== localId));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    let authorName = '';
    let authorEmail = '';
    let magentoUserId: string | undefined;

    if (isAuthenticated && user) {
      authorName = (displayName || user.email).trim();
      authorEmail = user.email.trim();
      magentoUserId = String(user.id);
    } else {
      authorEmail = guestEmail.trim();
      authorName = guestAuthorLabelFromEmail(authorEmail);
      if (!isReasonableEmail(authorEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    if (hasUploadingMedia) {
      setError('Wait for uploads to finish before submitting your review.');
      return;
    }

    if (hasFailedMedia) {
      setError('Remove failed uploads before submitting your review.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dimensionRatings: ProductReviewDimensionRating[] = scoredTags.map(
        tag => ({
          tagSlug: tag.slug,
          score: Number.isInteger(dimensionScores[tag.slug])
            ? dimensionScores[tag.slug]
            : 5,
        })
      );
      const reviewTagSlugs = Array.from(
        new Set([...selectedTagSlugs, ...scoredTags.map(tag => tag.slug)])
      );
      const response = await fetch(`/api/reviews/${encodeURIComponent(sku)}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorName,
          authorEmail,
          ...(magentoUserId ? { magentoUserId } : {}),
          rating,
          title,
          content,
          mediaIds: uploadedMediaIds,
          reviewTagSlugs,
          dimensionRatings,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        error?: string | { message?: string; detail?: unknown };
        detail?: unknown;
      } | null;

      if (!response.ok) {
        const errorMessage =
          typeof data?.error === 'string' ? data.error : data?.error?.message;
        const detail =
          data?.detail && typeof data.detail === 'object'
            ? JSON.stringify(data.detail)
            : typeof data?.error === 'object' && data?.error?.detail
            ? JSON.stringify(data.error.detail)
            : null;
        throw new Error(
          detail
            ? `${errorMessage ?? 'Failed to submit review'} (${detail})`
            : errorMessage ?? 'Failed to submit review'
        );
      }

      setTitle('');
      setContent('');
      setRating(5);
      setUploads([]);
      setSelectedTagSlugs([]);
      setDimensionScores({});
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
    <section className="overflow-hidden rounded-[28px] border border-border bg-surface">
      <div className="border-b border-border bg-background/60 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="heading-4 text-ink">Write a review</h3>
            <p className="mt-2 body-text text-ink-muted">
              Share what you received, how it performed, and whether you would
              buy it again.
            </p>
          </div>
          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => openLogin('signin')}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="rounded-2xl border border-border bg-background px-4 py-4">
          <p className="micro-text uppercase tracking-[0.18em] text-ink-faint">
            Review target
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-sm font-semibold text-ink">
              Product SKU: {target.sku}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isAuthenticated && (
            <div>
              <label
                htmlFor="review-guest-email"
                className="mb-2 block text-sm font-medium text-ink"
              >
                Email
              </label>
              <input
                id="review-guest-email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                value={guestEmail}
                onChange={event => setGuestEmail(event.target.value)}
                placeholder="For moderation only; display name uses the part before @"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-ink">Rating</span>
              <span className="text-sm font-semibold text-brand">
                {rating.toFixed(1)} / 5
              </span>
            </div>
            <RatingControl rating={rating} onChange={setRating} />
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
              placeholder="What worked well, what did not, and how did this variant compare to your expectations?"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div>
            {availableTags.length > 0 && (
              <div className="space-y-4">
                {nonScoredTags.length > 0 && (
                  <div>
                    <p className="mb-2 block text-sm font-medium text-ink">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {nonScoredTags.map(tag => {
                        const isSelected = selectedTagSlugs.includes(tag.slug);
                        return (
                          <button
                            key={tag.slug}
                            type="button"
                            onClick={() => {
                              setSelectedTagSlugs(current => {
                                if (current.includes(tag.slug)) {
                                  const next = current.filter(
                                    slug => slug !== tag.slug
                                  );
                                  return next;
                                }
                                return [...current, tag.slug];
                              });
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
                  </div>
                )}

                {scoredTags.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-ink">
                      Rate dimensions (0-5)
                    </p>
                    {scoredTags.map(tag => (
                      <label
                        key={tag.slug}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2"
                      >
                        <span className="text-sm text-ink">{tag.name}</span>
                        <select
                          value={String(
                            Number.isInteger(dimensionScores[tag.slug])
                              ? dimensionScores[tag.slug]
                              : 5
                          )}
                          onChange={event => {
                            const score = Number(event.target.value);
                            setDimensionScores(current => ({
                              ...current,
                              [tag.slug]: Number.isInteger(score) ? score : 5,
                            }));
                          }}
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                        >
                          {[0, 1, 2, 3, 4, 5].map(value => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-ink">
                Photos and video
              </label>
              <span className="text-xs text-ink-muted">
                Up to 6 files, 1 video max
              </span>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={event => {
                void handleFileSelection(event);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploads.length >= MAX_ATTACHMENTS || hasUploadingMedia}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm font-medium text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              Add photos or video
            </button>
            <p className="mt-2 text-xs text-ink-muted">
              Images up to 5 MB each. One video up to 20 MB.
            </p>

            {uploads.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {uploads.map(upload => (
                  <div
                    key={upload.localId}
                    className="rounded-2xl border border-border bg-background p-3"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {upload.fileName}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {upload.kind === 'video' ? 'Video' : 'Image'}
                          {upload.status === 'uploading' ? ' · Uploading' : ''}
                          {upload.status === 'uploaded' ? ' · Ready' : ''}
                          {upload.status === 'failed' ? ' · Failed' : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUpload(upload.localId)}
                        className="rounded-full p-1 text-ink-muted transition hover:bg-surface hover:text-ink"
                        aria-label={`Remove ${upload.fileName}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-surface-muted">
                      {upload.status === 'uploading' && (
                        <LoaderCircle className="h-6 w-6 animate-spin text-brand" />
                      )}
                      {upload.status === 'failed' && (
                        <p className="px-3 text-center text-xs text-red-500">
                          {upload.error ?? 'Upload failed'}
                        </p>
                      )}
                      {upload.status === 'uploaded' && upload.media && (
                        <ReviewImagePreview
                          media={[upload.media]}
                          altFallback={upload.fileName}
                          thumbnailClassName="h-full w-full object-cover"
                          buttonClassName="h-full w-full cursor-pointer"
                          previewLabel={`Preview media ${upload.fileName}`}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-muted">
              Helpful votes use a device visitor key. Reviews stay pending until
              approval. Guests only need an email (not shown publicly); your
              public display name comes from the part before @ in that address.
            </p>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
