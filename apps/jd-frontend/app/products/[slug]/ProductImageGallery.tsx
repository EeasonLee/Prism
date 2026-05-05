'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { processProductImageUrl } from '@prism/shared';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Play,
} from 'lucide-react';
import type { UnifiedProductImage } from '@/features/product/unified.api';

interface ProductGalleryVideo {
  url: string;
  poster?: string;
}

interface ProductImageGalleryProps {
  images: UnifiedProductImage[];
  productName: string;
  featuredVideo?: ProductGalleryVideo;
}

interface ProductGalleryMediaItem {
  type: 'video' | 'image';
  url: string;
  thumbUrl?: string;
  alt: string;
  poster?: string;
}

export function ProductImageGallery({
  images,
  productName,
  featuredVideo,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [thumbnailColumnHeight, setThumbnailColumnHeight] = useState<
    number | null
  >(null);
  const mainMediaRef = useRef<HTMLDivElement>(null);
  const thumbnailRailRef = useRef<HTMLDivElement>(null);
  const thumbnailButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const mediaItems: ProductGalleryMediaItem[] = [
    ...(featuredVideo
      ? [
          {
            type: 'video' as const,
            url: featuredVideo.url,
            alt: `${productName} video`,
            poster: featuredVideo.poster,
          },
        ]
      : []),
    ...images.map(image => ({
      type: 'image' as const,
      url: processProductImageUrl(image.url, 800) ?? image.url,
      thumbUrl: processProductImageUrl(image.url, 150) ?? image.url,
      alt: image.alt ?? productName,
    })),
  ];

  const goTo = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(mediaItems.length - 1, index)));
  };

  const activeMedia = mediaItems[activeIndex];

  useEffect(() => {
    const thumbnailRail = thumbnailRailRef.current;
    if (!thumbnailRail) return;

    const updateScrollState = () => {
      const { scrollTop, clientHeight, scrollHeight } = thumbnailRail;
      setCanScrollUp(scrollTop > 2);
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 2);
    };

    updateScrollState();
    thumbnailRail.addEventListener('scroll', updateScrollState, {
      passive: true,
    });

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(thumbnailRail);

    return () => {
      thumbnailRail.removeEventListener('scroll', updateScrollState);
      resizeObserver.disconnect();
    };
  }, [mediaItems.length]);

  useEffect(() => {
    const activeThumbnail = thumbnailButtonRefs.current[activeIndex];
    if (!activeThumbnail) return;

    activeThumbnail.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });
  }, [activeIndex]);

  useEffect(() => {
    const mainMedia = mainMediaRef.current;
    if (!mainMedia) return;

    const syncThumbnailHeight = () => {
      if (window.innerWidth < 1024) {
        setThumbnailColumnHeight(null);
        return;
      }

      const nextHeight = mainMedia.clientHeight;
      setThumbnailColumnHeight(nextHeight > 0 ? nextHeight : null);
    };

    syncThumbnailHeight();
    const resizeObserver = new ResizeObserver(syncThumbnailHeight);
    resizeObserver.observe(mainMedia);
    window.addEventListener('resize', syncThumbnailHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncThumbnailHeight);
    };
  }, []);

  const scrollThumbnailRail = (direction: 'up' | 'down') => {
    const thumbnailRail = thumbnailRailRef.current;
    if (!thumbnailRail) return;
    const verticalOffset = direction === 'up' ? -96 : 96;
    thumbnailRail.scrollBy({ top: verticalOffset, behavior: 'smooth' });
  };

  if (mediaItems.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-surface text-ink-muted/30">
        <svg
          className="h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[5rem_minmax(0,1fr)] lg:items-stretch lg:gap-3">
      {/* 缩略图走廊：桌面端放左侧，移动端放底部 */}
      {mediaItems.length > 1 && (
        <div
          className="order-2 mt-3 flex gap-2 lg:order-1 lg:mt-0 lg:w-20 lg:flex-col lg:items-stretch"
          style={
            thumbnailColumnHeight != null
              ? { height: `${thumbnailColumnHeight}px` }
              : undefined
          }
        >
          <button
            type="button"
            aria-label="Scroll thumbnails up"
            onClick={() => scrollThumbnailRail('up')}
            disabled={!canScrollUp}
            className="hidden h-7 w-full items-center justify-center rounded-md border border-border bg-background text-ink transition hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40 lg:flex"
          >
            <ChevronUp className="h-4 w-4" />
          </button>

          <div
            ref={thumbnailRailRef}
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0"
            role="listbox"
            aria-label="Product media thumbnails"
          >
            {mediaItems.map((item, idx) => (
              <button
                key={idx}
                ref={node => {
                  thumbnailButtonRefs.current[idx] = node;
                }}
                type="button"
                role="option"
                aria-selected={idx === activeIndex}
                aria-label={`View ${item.type} ${idx + 1}: ${item.alt}`}
                onClick={() => goTo(idx)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-surface transition-all lg:h-20 lg:w-20 ${
                  idx === activeIndex
                    ? 'border-brand shadow-sm'
                    : 'border-transparent hover:border-border'
                }`}
              >
                {item.type === 'image' ? (
                  <Image
                    src={item.thumbUrl ?? item.url}
                    alt={item.alt}
                    fill
                    unoptimized
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <>
                    <div className="relative h-full w-full bg-surface-muted">
                      {item.poster ? (
                        <Image
                          src={item.poster}
                          alt={item.alt}
                          fill
                          unoptimized
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                          aria-label={item.alt}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/15" />
                    </div>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white">
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </span>
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label="Scroll thumbnails down"
            onClick={() => scrollThumbnailRail('down')}
            disabled={!canScrollDown}
            className="hidden h-7 w-full items-center justify-center rounded-md border border-border bg-background text-ink transition hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40 lg:flex"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 主图 */}
      <div className="order-1 w-full lg:order-2 lg:flex-1">
        <div
          ref={mainMediaRef}
          className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-background"
        >
          {activeMedia?.type === 'image' && (
            <Image
              src={activeMedia.url}
              alt={activeMedia.alt}
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-opacity duration-300"
            />
          )}
          {activeMedia?.type === 'video' && (
            <video
              key={activeMedia.url}
              src={activeMedia.url}
              poster={activeMedia.poster}
              className="h-full w-full object-cover"
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={`${productName} product video`}
            />
          )}

          {/* 左右切换箭头 */}
          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous media"
                onClick={() => goTo(activeIndex - 1)}
                disabled={activeIndex === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-ink opacity-0 shadow-md backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-background disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next media"
                onClick={() => goTo(activeIndex + 1)}
                disabled={activeIndex === mediaItems.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-ink opacity-0 shadow-md backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-background disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* 图片计数 badge */}
          {mediaItems.length > 1 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-ink backdrop-blur-sm">
              {activeIndex + 1} / {mediaItems.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
