'use client';

import { OptimizedImage } from '@prism/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveImageUrl } from '@prism/shared';
import useEmblaCarousel from 'embla-carousel-react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Play,
} from 'lucide-react';
import type { UnifiedProductImage } from '@/features/product';
import { useMediaPreload } from './use-media-preload';

import type { MagentoMediaGalleryItem } from '@/features/product';

interface ProductImageGalleryProps {
  images: UnifiedProductImage[];
  productName: string;
  /** 完整的 media_gallery（含视频），按 position 排序后与 images 合并 */
  mediaGallery?: MagentoMediaGalleryItem[];
}

interface ProductGalleryMediaItem {
  type: 'video' | 'image';
  url: string;
  displayUrl?: string;
  fullUrl?: string;
  thumbUrl?: string;
  alt: string;
  poster?: string;
  /** 视频平台类型：'direct' 表示可直接 <video> 播放，'youtube' 需要 iframe */
  videoProvider?: 'direct' | 'youtube';
}

/** 将 YouTube URL 转换为嵌入 URL */
function toYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&rel=0`;
    }
  }
  return null;
}

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

export function ProductImageGallery({
  images,
  productName,
  mediaGallery,
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
  const [emblaRef, api] = useEmblaCarousel({
    loop: true,
    align: 'start',
    containScroll: 'trimSnaps',
  });
  const mediaItems = useMemo<ProductGalleryMediaItem[]>(() => {
    // 没有 mediaGallery 或没有视频时，直接返回纯图片列表
    const videoItems = mediaGallery?.filter(
      m => m.media_type === 'video' && m.video_content
    );
    if (!videoItems || videoItems.length === 0) {
      return images.map(image => {
        const fullUrl = resolveImageUrl(image.url) ?? image.url;
        return {
          type: 'image' as const,
          url: resolveImageUrl(image.url, { size: 800 }) ?? fullUrl,
          displayUrl: resolveImageUrl(image.url, { size: 1200 }) ?? fullUrl,
          fullUrl,
          thumbUrl: resolveImageUrl(image.url, { size: 150 }) ?? fullUrl,
          alt: image.alt ?? productName,
        };
      });
    }

    // 收集视频 poster URL，用于排除图片列表中的重复项
    const videoPosterUrls = new Set(
      videoItems.map(v => resolveImageUrl(v.url) ?? v.url)
    );

    const imageItems: ProductGalleryMediaItem[] = images
      .filter(image => {
        const normalized = resolveImageUrl(image.url) ?? image.url;
        return !videoPosterUrls.has(normalized);
      })
      .map(image => {
        const fullUrl = resolveImageUrl(image.url) ?? image.url;
        return {
          type: 'image' as const,
          url: resolveImageUrl(image.url, { size: 800 }) ?? fullUrl,
          displayUrl: resolveImageUrl(image.url, { size: 1200 }) ?? fullUrl,
          fullUrl,
          thumbUrl: resolveImageUrl(image.url, { size: 150 }) ?? fullUrl,
          alt: image.alt ?? productName,
        };
      });

    // 按 position 将视频插入对应位置
    const sorted = [...(mediaGallery ?? [])].sort(
      (a, b) => a.position - b.position
    );

    const result: ProductGalleryMediaItem[] = [];
    let imageIdx = 0;
    for (const item of sorted) {
      if (item.media_type === 'video' && item.video_content) {
        const videoUrl = item.video_content.video_url;
        result.push({
          type: 'video',
          url: videoUrl,
          alt: item.video_content.video_title || `${productName} video`,
          poster: item.url || undefined,
          videoProvider: isYouTubeUrl(videoUrl) ? 'youtube' : 'direct',
        });
      } else {
        // 图片：从 images 列表按顺序取（已排除视频 poster）
        if (imageIdx < imageItems.length) {
          result.push(imageItems[imageIdx]);
          imageIdx++;
        }
      }
    }
    // 追加剩余图片（mediaGallery 可能缺少某些图片项）
    while (imageIdx < imageItems.length) {
      result.push(imageItems[imageIdx]);
      imageIdx++;
    }

    return result;
  }, [mediaGallery, images, productName]);
  const hasCarousel = mediaItems.length > 1;
  const preloadItems = useMemo(
    () =>
      mediaItems.map(item => ({
        kind: item.type,
        imageUrl:
          item.type === 'image'
            ? item.displayUrl ?? item.url ?? item.fullUrl
            : null,
        posterUrl: item.type === 'video' ? item.poster ?? null : null,
      })),
    [mediaItems]
  );

  const { isReady } = useMediaPreload({
    items: preloadItems,
    activeIndex,
    immediateDistance: 2,
    idleDistance: 4,
  });

  // 变体切换时重置到第一张
  const prevImagesRef = useRef(images);
  useEffect(() => {
    if (prevImagesRef.current !== images) {
      prevImagesRef.current = images;
      api?.scrollTo(0);
    }
  }, [images, api]);

  // 通过 Embla 事件同步 activeIndex
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };

    onSelect();
    api.on('select', onSelect);
    api.on('reInit', onSelect);

    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api]);

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

  // 键盘导航：左右方向键切换主图
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        api?.scrollPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        api?.scrollNext();
      }
    },
    [api]
  );

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

  if (!hasCarousel) {
    const singleItem = mediaItems[0];

    return (
      <div className="flex flex-col">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-background">
          {singleItem.type === 'image' ? (
            <OptimizedImage
              src={
                singleItem.displayUrl ?? singleItem.url ?? singleItem.fullUrl
              }
              alt={singleItem.alt}
              fill
              priority
              maxDisplayWidth={1200}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : singleItem.videoProvider === 'youtube' ? (
            <iframe
              src={toYouTubeEmbedUrl(singleItem.url) ?? singleItem.url}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={singleItem.alt}
            />
          ) : (
            <video
              src={singleItem.url}
              poster={singleItem.poster}
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[5rem_minmax(0,1fr)] lg:items-stretch lg:gap-3">
      {/* 缩略图走廊：桌面端放左侧，移动端放底部 */}
      {hasCarousel && (
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
                onClick={() => api?.scrollTo(idx)}
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
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-background"
        >
          <div ref={emblaRef} className="h-full">
            <div className="flex h-full">
              {mediaItems.map((item, idx) => (
                <div
                  key={idx}
                  className="relative min-w-0 shrink-0 grow-0 basis-full"
                >
                  {item.type === 'image' ? (
                    <OptimizedImage
                      src={item.displayUrl ?? item.url ?? item.fullUrl}
                      alt={item.alt}
                      fill
                      {...(idx === 0
                        ? { priority: true }
                        : { loading: 'lazy' as const })}
                      maxDisplayWidth={1200}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className={`object-cover transition-opacity duration-200 ${
                        isReady(idx) ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  ) : item.type === 'video' &&
                    idx === activeIndex &&
                    item.videoProvider === 'youtube' ? (
                    <iframe
                      src={toYouTubeEmbedUrl(item.url) ?? item.url}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={item.alt}
                    />
                  ) : item.type === 'video' && idx === activeIndex ? (
                    <video
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
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* 左右切换箭头 */}
          {hasCarousel && (
            <>
              <button
                type="button"
                aria-label="Previous media"
                onClick={() => api?.scrollPrev()}
                disabled={!api?.canScrollPrev()}
                className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-ink shadow-md backdrop-blur-sm transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-35 lg:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next media"
                onClick={() => api?.scrollNext()}
                disabled={!api?.canScrollNext()}
                className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-ink shadow-md backdrop-blur-sm transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-35 lg:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* 图片计数 badge */}
          {hasCarousel && (
            <span className="absolute bottom-3 right-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-ink backdrop-blur-sm">
              {activeIndex + 1} / {mediaItems.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
