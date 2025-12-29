'use client';

import {
  extractImageUrl,
  processImageUrl,
  shouldDisableImageOptimization,
  type StrapiImage,
} from '@/lib/utils/image';
import Image from 'next/image';
import { type ComponentProps, type ReactNode, useState } from 'react';

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
  preferredFormat?: 'large' | 'medium' | 'small' | 'thumbnail';
  /**
   * 图片加载失败时的回调
   */
  onImageError?: (error: Error) => void;
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
  ...imageProps
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);

  // 从 Strapi 图片对象或字符串中提取 URL
  let rawUrl: string | null = null;
  if (typeof src === 'string') {
    rawUrl = src;
  } else if (src && typeof src === 'object') {
    rawUrl = extractImageUrl(src, preferredFormat);
  }

  // 处理 URL（自动处理相对路径和完整路径）
  const imageUrl = processImageUrl(rawUrl);

  // 如果图片不存在，显示占位符
  if (!imageUrl || hasError) {
    if (hasError && fallback) {
      return fallback as React.ReactElement;
    }
    return (placeholder || <DefaultPlaceholder />) as React.ReactElement;
  }

  // 判断是否需要禁用优化
  const unoptimized = shouldDisableImageOptimization(imageUrl);

  // 处理图片加载错误
  const handleError = (_e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    if (onImageError) {
      onImageError(new Error(`Failed to load image: ${imageUrl}`));
    }
  };

  return (
    <Image
      src={imageUrl}
      alt={alt}
      unoptimized={unoptimized}
      onError={handleError}
      {...imageProps}
    />
  );
}
