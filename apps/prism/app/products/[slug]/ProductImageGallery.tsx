'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { UnifiedProductImage } from '../../../lib/api/unified-product';

interface ProductImageGalleryProps {
  images: UnifiedProductImage[];
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(images.length - 1, index)));
  };

  const activeImage = images[activeIndex];

  if (images.length === 0) {
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
    <div>
      {/* 主图 */}
      <div className="group relative aspect-square max-h-[min(560px,68vh)] w-full overflow-hidden rounded-2xl bg-surface">
        {activeImage && (
          <Image
            src={activeImage.url}
            alt={activeImage.alt ?? productName}
            fill
            priority
            unoptimized
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-6 transition-opacity duration-300"
          />
        )}

        {/* 左右切换箭头 */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-ink opacity-0 shadow-md backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-background disabled:pointer-events-none disabled:opacity-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex === images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-ink opacity-0 shadow-md backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-background disabled:pointer-events-none disabled:opacity-0"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* 图片计数 badge */}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-ink backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* 缩略图走廊 */}
      {images.length > 1 && (
        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
          role="listbox"
          aria-label="Product image thumbnails"
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              role="option"
              aria-selected={idx === activeIndex}
              aria-label={`View image ${idx + 1}: ${img.alt ?? productName}`}
              onClick={() => goTo(idx)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-surface transition-all ${
                idx === activeIndex
                  ? 'border-brand shadow-sm'
                  : 'border-transparent hover:border-border'
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? productName}
                fill
                unoptimized
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
