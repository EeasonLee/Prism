'use client';

import { OptimizedImage } from '@prism/ui';
import { useEffect, useRef, useState } from 'react';
import { resolveImageUrl, cn } from '@prism/shared';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Play,
} from 'lucide-react';
import type { UnifiedProductImage } from '@/features/product';

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
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
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
      url: resolveImageUrl(image.url, { size: 800 }) ?? image.url,
      thumbUrl: resolveImageUrl(image.url, { size: 150 }) ?? image.url,
      alt: image.alt ?? productName,
    })),
  ];

  const goTo = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(mediaItems.length - 1, index)));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    const touch = event.changedTouches[0];

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (startX == null || startY == null || !touch) return;

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    // 仅处理明显的横向手势，避免和纵向滚动冲突
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    if (deltaX < 0) {
      goTo(activeIndex + 1);
      return;
    }
    goTo(activeIndex - 1);
  };

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
    <div className="flex flex-col lg:grid lg:grid-cols-[5rem_minmax(0,1fr)] lg:items-stretch lg:gap-3">
      {/* 缩略图走廊：桌面端放左侧，移动端放底部 */}
      {mediaItems.length > 1 && (
        <div
          className="order-2 mt-3 flex w-full gap-2 lg:order-1 lg:mt-0 lg:w-20 lg:flex-col lg:items-stretch"
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
                  <OptimizedImage
                    src={item.thumbUrl ?? item.url}
                    alt={item.alt}
                    fill
                    maxDisplayWidth={80}
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <>
                    <div className="relative h-full w-full bg-surface-muted">
                      {item.poster ? (
                        <OptimizedImage
                          src={item.poster}
                          alt={item.alt}
                          fill
                          maxDisplayWidth={80}
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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 预渲染所有图片，通过 CSS 控制可见性，消除切换时的加载延迟 */}
          {mediaItems.map((item, idx) => {
            const isActive = idx === activeIndex;

            if (item.type === 'image') {
              return (
                <div
                  key={idx}
                  aria-hidden={!isActive}
                  className={cn(
                    'absolute inset-0 transition-opacity duration-300',
                    isActive
                      ? 'z-10 opacity-100'
                      : 'z-0 opacity-0 pointer-events-none'
                  )}
                >
                  <OptimizedImage
                    src={item.url}
                    alt={item.alt}
                    fill
                    {...(idx === 0
                      ? { priority: true }
                      : { loading: 'eager' as const })}
                    maxDisplayWidth={800}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              );
            }

            // 视频只渲染活跃的（避免多视频同时播放消耗带宽）
            if (item.type === 'video' && isActive) {
              return (
                <video
                  key={item.url}
                  src={item.url}
                  poster={item.poster}
                  className="h-full w-full object-cover"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={`${productName} product video`}
                />
              );
            }

            return null;
          })}

          {/* 左右切换箭头 */}
          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous media"
                onClick={() => goTo(activeIndex - 1)}
                disabled={activeIndex === 0}
                className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-ink shadow-md backdrop-blur-sm transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-35 lg:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next media"
                onClick={() => goTo(activeIndex + 1)}
                disabled={activeIndex === mediaItems.length - 1}
                className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-ink shadow-md backdrop-blur-sm transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-35 lg:flex"
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
