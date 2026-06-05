'use client';

import {
  cn,
  extractImageUrl,
  getOptimalCdnSize,
  resolveImageUrl,
  shouldDisableImageOptimization,
  type ImageSize,
  type RemoteImage,
} from '@prism/shared';
import Image from 'next/image';
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useImageConfig } from './image-config-context';

export interface OptimizedImageProps
  extends Omit<
    ComponentProps<typeof Image>,
    'src' | 'alt' | 'unoptimized' | 'placeholder' | 'onError'
  > {
  src: RemoteImage | string | null | undefined;
  alt: string;
  fallback?: ReactNode;
  placeholder?: ReactNode;
  preferredFormat?: 'large' | 'medium' | 'small' | 'thumbnail' | 'original';
  onImageError?: (error: Error) => void;
  forceUnoptimized?: boolean;
  maxDisplayWidth?: number;
  cdnSize?: ImageSize;
  pixelRatio?: number;
}

type ImageLoadState = 'loading' | 'loaded' | 'error';

function DefaultPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface text-ink-muted/40">
      <svg
        className="h-1/2 w-1/2 min-h-4 min-w-4 max-h-16 max-w-16"
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

export function OptimizedImage({
  src,
  alt,
  fallback,
  placeholder,
  preferredFormat,
  onImageError,
  forceUnoptimized = false,
  maxDisplayWidth,
  cdnSize,
  pixelRatio,
  ...imageProps
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [imageState, setImageState] = useState<ImageLoadState>('loading');
  const { baseUrl, domainRewriteMap } = useImageConfig();

  const rawUrl =
    typeof src === 'string'
      ? src.trim() || null
      : extractImageUrl(src, preferredFormat);

  const derivedSize = useMemo(() => {
    if (maxDisplayWidth) {
      return getOptimalCdnSize(maxDisplayWidth, pixelRatio ?? 2);
    }

    return cdnSize ?? undefined;
  }, [cdnSize, maxDisplayWidth, pixelRatio]);

  const imageUrl = resolveImageUrl(src, {
    format: preferredFormat,
    size: derivedSize ?? undefined,
    baseUrl,
    domainRewriteMap,
  });

  useEffect(() => {
    setHasError(false);
    setImageState('loading');
  }, [rawUrl, imageUrl]);

  const handleLoad = useCallback(
    async (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.target as HTMLImageElement;

      try {
        if (img.decode) {
          await img.decode();
        }
      } catch {
        // Decoding can fail even after a fallback render path is available.
      }

      setImageState('loaded');
    },
    []
  );

  if (!imageUrl || hasError) {
    if (hasError && fallback) {
      return fallback as React.ReactElement;
    }

    return (placeholder ?? <DefaultPlaceholder />) as React.ReactElement;
  }

  const unoptimized =
    forceUnoptimized || shouldDisableImageOptimization(imageUrl);

  const handleError = () => {
    setImageState('error');
    setHasError(true);
    onImageError?.(new Error(`Failed to load image: ${imageUrl}`));
  };

  const mainClassName = cn(
    imageProps.className,
    'transition-opacity duration-300 ease-in',
    imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
  );

  if (imageProps.fill) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        unoptimized={unoptimized}
        className={mainClassName}
        onLoad={handleLoad}
        onError={handleError}
        {...imageProps}
      />
    );
  }

  return (
    <div
      className="relative inline-block max-w-full overflow-hidden"
      style={{
        width: imageProps.width,
        height: imageProps.height,
      }}
    >
      <Image
        src={imageUrl}
        alt={alt}
        unoptimized={unoptimized}
        className={mainClassName}
        onLoad={handleLoad}
        onError={handleError}
        {...imageProps}
      />
    </div>
  );
}
