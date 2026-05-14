'use client';

import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { OptimizedImage } from '@prism/ui';
import useEmblaCarousel from 'embla-carousel-react';
import { resolveImageUrl } from '@prism/shared';
import type { ProductReviewMedia } from '@/features/product';
import { useMediaPreload } from './use-media-preload';

interface ReviewMediaViewerProps {
  media: ProductReviewMedia[];
  initialIndex?: number;
  altFallback: string;
  thumbnailClassName?: string;
  buttonClassName?: string;
  previewLabel?: string;
}

interface PreparedReviewMedia extends ProductReviewMedia {
  previewImageUrl?: string;
  fullImageUrl?: string;
  thumbnailImageUrl?: string;
}

function circularDistance(
  target: number,
  center: number,
  total: number
): number {
  if (total <= 1) return 0;
  const direct = Math.abs(target - center);
  return Math.min(direct, total - direct);
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
      <div className="relative h-full w-full">
        <OptimizedImage
          src={item.url}
          alt={getMediaAlt(item, altFallback)}
          fill
          maxDisplayWidth={80}
          sizes="80px"
          className={className}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      {item.posterUrl ? (
        <OptimizedImage
          src={item.posterUrl}
          alt={getMediaAlt(item, altFallback)}
          fill
          maxDisplayWidth={80}
          sizes="80px"
          className={className}
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
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    loop: media.length > 1,
  });
  const preparedMedia = useMemo<PreparedReviewMedia[]>(
    () =>
      media.map(item => {
        if (item.kind !== 'image') return item;
        const fullImageUrl = resolveImageUrl(item.url) ?? item.url;
        return {
          ...item,
          fullImageUrl,
          previewImageUrl:
            resolveImageUrl(item.url, { size: 1200 }) ?? fullImageUrl,
          thumbnailImageUrl:
            resolveImageUrl(item.url, { size: 150 }) ?? fullImageUrl,
        };
      }),
    [media]
  );

  const activeMedia = preparedMedia[activeIndex] ?? preparedMedia[0];
  const canNavigate = media.length > 1;
  const preloadItems = useMemo(
    () =>
      preparedMedia.map(item => ({
        kind: item.kind,
        imageUrl:
          item.kind === 'image' ? item.previewImageUrl ?? item.url : null,
        posterUrl: item.kind === 'video' ? item.posterUrl ?? null : null,
      })),
    [preparedMedia]
  );

  const { isReady } = useMediaPreload({
    items: preloadItems,
    activeIndex,
    enabled: isOpen,
    immediateDistance: 2,
    idleDistance: 4,
  });

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

    emblaApi?.scrollTo(initialIndex, true);
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
        emblaApi?.scrollNext();
      }

      if (event.key === 'ArrowLeft') {
        emblaApi?.scrollPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canNavigate, emblaApi, initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || !emblaApi) {
      return;
    }

    const syncSelectedIndex = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
    };

    syncSelectedIndex();
    emblaApi.on('select', syncSelectedIndex);
    emblaApi.on('reInit', syncSelectedIndex);

    return () => {
      emblaApi.off('select', syncSelectedIndex);
      emblaApi.off('reInit', syncSelectedIndex);
    };
  }, [emblaApi, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      videoRefs.current.forEach(video => {
        video?.pause();
      });
      return;
    }

    videoRefs.current.forEach((video, index) => {
      if (!video || index === activeIndex) {
        return;
      }
      video.pause();
    });
  }, [activeIndex, isOpen]);

  if (!activeMedia) {
    return null;
  }

  const openViewer = () => {
    setActiveIndex(initialIndex);
    setIsOpen(true);
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
          className="fixed inset-0 z-50 bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={dialogLabel}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative flex h-full w-full flex-col bg-black text-white"
            onClick={event => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white shadow-sm transition hover:bg-black/70"
              aria-label="Close media viewer"
            >
              <X className="h-5 w-5" />
            </button>

            {canNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollPrev()}
                  className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-sm transition hover:bg-black/75"
                  aria-label="Show previous media"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollNext()}
                  className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-sm transition hover:bg-black/75"
                  aria-label="Show next media"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 px-2 pb-4 pt-16 sm:px-6">
                <div ref={emblaRef} className="h-full overflow-hidden">
                  <div className="flex h-full">
                    {preparedMedia.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="min-w-0 shrink-0 grow-0 basis-full px-1 sm:px-2"
                      >
                        <div className="relative flex h-full min-h-[260px] w-full items-center justify-center overflow-hidden rounded-2xl bg-black sm:min-h-[420px]">
                          {item.kind === 'image' ? (
                            <>
                              <OptimizedImage
                                src={
                                  item.thumbnailImageUrl ??
                                  item.previewImageUrl ??
                                  item.url
                                }
                                alt=""
                                fill
                                maxDisplayWidth={150}
                                sizes="100vw"
                                className="bg-black object-contain"
                              />
                              <OptimizedImage
                                src={
                                  index === activeIndex
                                    ? item.fullImageUrl ??
                                      item.previewImageUrl ??
                                      item.url
                                    : item.previewImageUrl ?? item.url
                                }
                                alt={getMediaAlt(item, altFallback)}
                                fill
                                maxDisplayWidth={1600}
                                sizes="100vw"
                                className={`bg-black object-contain transition-opacity duration-200 ${
                                  isReady(index) ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                            </>
                          ) : (
                            <video
                              ref={node => {
                                videoRefs.current[index] = node;
                              }}
                              src={
                                circularDistance(
                                  index,
                                  activeIndex,
                                  preparedMedia.length
                                ) <= 1
                                  ? item.url
                                  : undefined
                              }
                              poster={item.posterUrl ?? undefined}
                              controls
                              playsInline
                              preload="metadata"
                              aria-label={getMediaAlt(item, altFallback)}
                              className="h-full w-full bg-black object-contain"
                            >
                              <track kind="captions" />
                            </video>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {canNavigate && (
              <div className="border-t border-white/15 bg-black/80 px-3 pb-4 pt-3 sm:px-6">
                <div
                  className="mb-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="listbox"
                  aria-label="Media thumbnails"
                >
                  {preparedMedia.map((item, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <button
                        key={`${item.id}-thumb-${index}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        aria-label={`Preview media ${index + 1}`}
                        onClick={() => emblaApi?.scrollTo(index)}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                          isActive
                            ? 'border-white'
                            : 'border-white/20 hover:border-white/60'
                        }`}
                      >
                        {item.kind === 'image' ? (
                          <OptimizedImage
                            src={
                              item.thumbnailImageUrl ??
                              item.previewImageUrl ??
                              item.url
                            }
                            alt={getMediaAlt(item, altFallback)}
                            fill
                            maxDisplayWidth={80}
                            sizes="80px"
                            className="bg-black object-cover"
                          />
                        ) : (
                          <>
                            {item.posterUrl ? (
                              <OptimizedImage
                                src={item.posterUrl}
                                alt={getMediaAlt(item, altFallback)}
                                fill
                                maxDisplayWidth={80}
                                sizes="80px"
                                className="bg-black object-cover"
                              />
                            ) : (
                              <video
                                src={item.url}
                                muted
                                playsInline
                                preload="metadata"
                                aria-label={getMediaAlt(item, altFallback)}
                                className="h-full w-full object-cover"
                              />
                            )}
                            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white">
                                <Play
                                  className="ml-0.5 h-3 w-3"
                                  fill="currentColor"
                                />
                              </span>
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>
                    {activeIndex + 1} / {media.length}
                  </span>
                  <span>Use arrow keys or swipe to switch media.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
