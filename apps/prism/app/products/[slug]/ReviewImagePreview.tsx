'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ReviewImagePreviewProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  thumbnailClassName?: string;
  buttonClassName?: string;
  previewLabel?: string;
}

export function ReviewImagePreview({
  src,
  alt,
  width,
  height,
  thumbnailClassName = 'h-full w-full object-cover',
  buttonClassName,
  previewLabel = 'Preview image',
}: ReviewImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClassName}
        aria-label={previewLabel}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={thumbnailClassName}
        />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-[28px] bg-background shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-ink shadow-sm transition hover:bg-background"
              aria-label="Close image preview"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-[4/3] w-full bg-surface-muted sm:aspect-[16/10]">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 1024px) 100vw, 960px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
