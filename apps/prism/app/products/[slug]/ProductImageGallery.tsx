'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { UnifiedProductImage } from '../../../lib/api/unified-product';

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
  alt: string;
  poster?: string;
}

export function ProductImageGallery({
  images,
  productName,
  featuredVideo,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
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
      url: image.url,
      alt: image.alt ?? productName,
    })),
  ];

  const goTo = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(mediaItems.length - 1, index)));
  };

  const activeMedia = mediaItems[activeIndex];

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
    <div className="lg:flex lg:items-start lg:gap-3">
      {/* 缩略图走廊：桌面端放左侧，移动端放底部 */}
      {mediaItems.length > 1 && (
        <div
          className="order-2 mt-3 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:mt-0 lg:max-h-[640px] lg:w-20 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1"
          role="listbox"
          aria-label="Product media thumbnails"
        >
          {mediaItems.map((item, idx) => (
            <button
              key={idx}
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
                  src={item.url}
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
      )}

      {/* 主图 */}
      <div className="order-1 w-full lg:order-2 lg:flex-1">
        <div className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-background">
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
