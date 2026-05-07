'use client';

import {
  extractImageUrl,
  resolveImageUrl,
  shouldDisableImageOptimization,
  getOptimalCdnSize,
  type StrapiImage,
  type ProductImageSize,
} from '@prism/shared';
import Image from 'next/image';
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useImageConfig } from './image-config-context';

/**
 * OptimizedImage 组件的 props
 */
export interface OptimizedImageProps
  extends Omit<
    ComponentProps<typeof Image>,
    'src' | 'alt' | 'unoptimized' | 'placeholder' | 'onError'
  > {
  /**
   * 图片源：可以是 Strapi 图片对象或 URL 字符串
   * 组件会自动处理相对路径和完整路径
   */
  src: StrapiImage | string | null | undefined;
  /**
   * 图片描述（alt 文本）
   */
  alt: string;
  /**
   * 当图片加载失败时显示的内容
   */
  fallback?: ReactNode;
  /**
   * 当图片不存在时显示的内容
   */
  placeholder?: ReactNode;
  /**
   * 优先使用的图片格式（仅当 src 是 StrapiImage 时有效）
   */
  preferredFormat?: 'large' | 'medium' | 'small' | 'thumbnail' | 'original';
  /**
   * 图片加载失败时的回调
   */
  onImageError?: (error: Error) => void;
  /**
   * 强制禁用 Next.js 图片优化，适用于轮播等需要避免多尺寸重复请求的场景
   */
  forceUnoptimized?: boolean;
  /**
   * 最大显示宽度（CSS px），组件自动选择最优 CDN 尺寸
   * 传入后忽略 cdnSize
   */
  maxDisplayWidth?: number;
  /** 显式指定 CDN 尺寸，优先级低于 maxDisplayWidth */
  cdnSize?: ProductImageSize;
  /** 设备像素比，默认 2（retina） */
  pixelRatio?: number;
}

/**
 * 默认占位符组件
 */
function DefaultPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
      <svg
        className="h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 0 012.828 0L16 16m-2-2l1.586-1.586a2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 0 002-2V6a2 0 00-2-2H6a2 0 00-2 2v12a2 0 002 2z"
        />
      </svg>
    </div>
  );
}

/**
 * 统一的图片组件
 * 封装了 Next.js Image 组件的使用，统一处理图片 URL、优化、错误处理等
 */
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
  const [useOriginalAbsoluteUrl, setUseOriginalAbsoluteUrl] = useState(false);
  const { baseUrl } = useImageConfig();

  // 从 Strapi 图片对象或字符串中提取原始 URL（用于重试回退比较）
  let rawUrl: string | null = null;
  if (typeof src === 'string') {
    rawUrl = src.trim() || null;
  } else if (src && typeof src === 'object') {
    rawUrl = extractImageUrl(src, preferredFormat);
  }

  // CDN 尺寸推导：maxDisplayWidth 优先，其次 cdnSize
  const derivedCdnSize = useMemo(() => {
    if (maxDisplayWidth) {
      return getOptimalCdnSize(maxDisplayWidth, pixelRatio ?? 2);
    }
    return cdnSize;
  }, [maxDisplayWidth, cdnSize, pixelRatio]);

  // 统一的图片 URL 处理
  const imageUrl = resolveImageUrl(src, {
    format: preferredFormat,
    size: derivedCdnSize,
    baseUrl,
  });

  const rawUrlIsAbsolute =
    typeof rawUrl === 'string' &&
    (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'));
  const canRetryWithOriginalAbsoluteUrl =
    rawUrlIsAbsolute && !!imageUrl && rawUrl !== imageUrl;
  const resolvedImageUrl =
    useOriginalAbsoluteUrl && canRetryWithOriginalAbsoluteUrl
      ? rawUrl
      : imageUrl;

  useEffect(() => {
    setHasError(false);
    setUseOriginalAbsoluteUrl(false);
  }, [rawUrl, imageUrl]);

  // 如果图片不存在，显示占位符
  if (!resolvedImageUrl || hasError) {
    if (hasError && fallback) {
      return fallback as React.ReactElement;
    }
    return (placeholder || <DefaultPlaceholder />) as React.ReactElement;
  }

  // 判断是否需要禁用优化
  const unoptimized =
    forceUnoptimized || shouldDisableImageOptimization(resolvedImageUrl);

  // 处理图片加载错误
  const handleError = (_e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!useOriginalAbsoluteUrl && canRetryWithOriginalAbsoluteUrl) {
      setUseOriginalAbsoluteUrl(true);
      return;
    }

    setHasError(true);
    if (onImageError) {
      onImageError(new Error(`Failed to load image: ${resolvedImageUrl}`));
    }
  };

  return (
    <Image
      src={resolvedImageUrl}
      alt={alt}
      unoptimized={unoptimized}
      onError={handleError}
      {...imageProps}
    />
  );
}
