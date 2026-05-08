'use client';
/* eslint-disable @next/next/no-img-element */

import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProductReviewMedia } from '@/features/product';

interface ReviewMediaViewerProps {
  media: ProductReviewMedia[];
  initialIndex?: number;
  altFallback: string;
  thumbnailClassName?: string;
  buttonClassName?: string;
  previewLabel?: string;
}

function getMediaAlt(item: ProductReviewMedia, altFallback: string) {
  return item.alt ?? altFallback;
}

function ReviewMediaThumbnail({
  item,
  altFallback,
  className,
}: {
  item: ProductReviewMedia;
  altFallback: string;
  className: string;
}) {
  if (item.kind === 'image') {
    return (
      <img
        src={item.url}
        alt={getMediaAlt(item, altFallback)}
        className={className}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      {item.posterUrl ? (
        <img
          src={item.posterUrl}
          alt={getMediaAlt(item, altFallback)}
          className={className}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <video
          src={item.url}
          muted
          playsInline
          preload="metadata"
          aria-label={getMediaAlt(item, altFallback)}
          className={className}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-ink shadow-sm">
          <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
        </span>
      </div>
    </div>
  );
}

export function ReviewImagePreview({
  media,
  initialIndex = 0,
  altFallback,
  thumbnailClassName = 'h-full w-full object-cover',
  buttonClassName,
  previewLabel = 'Preview media',
}: ReviewMediaViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeMedia = media[activeIndex] ?? media[0];
  const canNavigate = media.length > 1;

  const dialogLabel = useMemo(() => {
    if (activeMedia?.kind === 'video') {
      return 'Media viewer video preview';
    }
    return 'Media viewer image preview';
  }, [activeMedia?.kind]);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if (!canNavigate) {
        return;
      }

      if (event.key === 'ArrowRight') {
        setActiveIndex(current => (current + 1) % media.length);
      }

      if (event.key === 'ArrowLeft') {
        setActiveIndex(current => (current - 1 + media.length) % media.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canNavigate, isOpen, media.length]);

  if (!activeMedia) {
    return null;
  }

  const openViewer = () => {
    setActiveIndex(initialIndex);
    setIsOpen(true);
  };

  const showPrevious = () => {
    setActiveIndex(current => (current - 1 + media.length) % media.length);
  };

  const showNext = () => {
    setActiveIndex(current => (current + 1) % media.length);
  };

  return (
    <>
      <button
        type="button"
        onClick={openViewer}
        className={buttonClassName}
        aria-label={previewLabel}
      >
        <ReviewMediaThumbnail
          item={activeMedia}
          altFallback={altFallback}
          className={thumbnailClassName}
        />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={dialogLabel}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-[28px] bg-background shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-ink shadow-sm transition hover:bg-background"
              aria-label="Close media viewer"
            >
              <X className="h-5 w-5" />
            </button>

            {canNavigate && (
              <>
                <button
                  type="button"
                  onClick={showPrevious}
                  className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-ink shadow-sm transition hover:bg-background"
                  aria-label="Show previous media"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-ink shadow-sm transition hover:bg-background"
                  aria-label="Show next media"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="relative aspect-[4/3] w-full bg-surface-muted sm:aspect-[16/10]">
              {activeMedia.kind === 'image' ? (
                <img
                  src={activeMedia.url}
                  alt={getMediaAlt(activeMedia, altFallback)}
                  className="h-full w-full object-contain"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <video
                  src={activeMedia.url}
                  poster={activeMedia.posterUrl ?? undefined}
                  controls
                  playsInline
                  aria-label={getMediaAlt(activeMedia, altFallback)}
                  className="h-full w-full bg-black object-contain"
                >
                  <track kind="captions" />
                </video>
              )}
            </div>

            {canNavigate && (
              <div className="flex items-center justify-between gap-4 border-t border-border bg-background px-4 py-3 text-sm text-ink-muted">
                <span>
                  {activeIndex + 1} / {media.length}
                </span>
                <span>
                  Use arrow keys or the navigation buttons to switch media.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
