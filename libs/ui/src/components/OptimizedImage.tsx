'use client';

import {
  extractImageUrl,
  resolveImageUrl,
  shouldDisableImageOptimization,
  getOptimalCdnSize,
  type StrapiImage,
  type ProductImageSize,
} from '@prism/shared';
import { cn } from '@prism/shared';
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
  /** 禁用 blur-up 渐进加载（极少数场景使用） */
  disableBlurUp?: boolean;
}

/** 图片加载状态 */
type ImageLoadState = 'loading' | 'loaded' | 'error';

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
 * 生成 blur-up 缩略图 URL
 *
 * 策略：
 * 1. Strapi 对象 → 优先用 formats.thumbnail（已在 API 响应中，零额外请求）
 * 2. CDN URL   → 生成 80px 缩略图
 * 3. 非 CDN / 本地图 → null（退化为纯 fade-in）
 */
function resolveBlurSrc(
  src: StrapiImage | string | null | undefined,
  baseUrl?: string
): string | null {
  if (!src) return null;

  // Strapi 对象：优先取 thumbnail（API 已返回，零额外请求）
  if (typeof src === 'object') {
    const thumbUrl = src.formats?.thumbnail?.url;
    if (thumbUrl) return thumbUrl;
    const smallUrl = src.formats?.small?.url;
    if (smallUrl) return smallUrl;
  }

  // 字符串：尝试生成 80px CDN 缩略图
  let rawUrl: string;
  if (typeof src === 'string') {
    rawUrl = src.trim();
  } else {
    rawUrl = src.url?.trim() ?? '';
  }
  if (!rawUrl) return null;

  // SVG 不能 blur
  if (/\.svg(\?.*)?$/i.test(rawUrl)) return null;

  // 本地静态图 /images/、/_next/ 跳过
  if (
    rawUrl.startsWith('/images/') ||
    rawUrl.startsWith('/_next/') ||
    rawUrl === '/favicon.ico'
  ) {
    return null;
  }

  // 用 resolveImageUrl + size: 80 生成缩略图 URL
  // 内部会自动处理 CDN 路径识别、相对路径、域名重写等
  const blurUrl = resolveImageUrl(rawUrl, { size: 80, baseUrl });
  if (!blurUrl) return null;

  // 如果 80px URL 与原图 URL 相同 → CDN 未生效 → 跳过
  const originalUrl = resolveImageUrl(rawUrl, { baseUrl });
  if (blurUrl === originalUrl) return null;

  return blurUrl;
}

/**
 * 统一的图片组件
 * 封装了 Next.js Image 组件的使用，统一处理图片 URL、优化、错误处理、blur-up 等
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
  disableBlurUp = false,
  ...imageProps
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [useOriginalAbsoluteUrl, setUseOriginalAbsoluteUrl] = useState(false);
  const [imageState, setImageState] = useState<ImageLoadState>('loading');

  const { baseUrl } = useImageConfig();

  // 从 Strapi 图片对象或字符串中提取原始 URL（用于重试回退比较）
  let rawUrl: string | null = null;
  if (typeof src === 'string') {
    rawUrl = src.trim() || null;
  } else if (src && typeof src === 'object') {
    rawUrl = extractImageUrl(src, preferredFormat);
  }

  // CDN 尺寸推导：maxDisplayWidth 优先，其次 cdnSize，都没有时默认取最大 CDN 尺寸（1200）
  // 现在 CDN 有 9 档（80/100/150/300/350/500/650/800/1200），retina 下卡片匹配更精准
  const derivedCdnSize = useMemo(() => {
    if (maxDisplayWidth) {
      return getOptimalCdnSize(maxDisplayWidth, pixelRatio ?? 2);
    }
    if (cdnSize !== undefined) return cdnSize;
    return 800 as ProductImageSize;
  }, [maxDisplayWidth, cdnSize, pixelRatio]);

  // 统一的图片 URL 处理
  const imageUrl = resolveImageUrl(src, {
    format: preferredFormat,
    size: derivedCdnSize ?? undefined,
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

  // 计算 blur 缩略图 URL（useMemo 确保首次渲染即存在，消除"黑一块"）
  // Strapi 对象自带 formats.thumbnail（零额外请求），始终启用
  // CDN URL 字符串生成 80px 缩略图，全站启用 blur-up
  const blurSrc = useMemo(
    () => (disableBlurUp ? null : resolveBlurSrc(src, baseUrl)),
    [src, baseUrl, disableBlurUp]
  );

  // src 变化时重置状态
  useEffect(() => {
    setHasError(false);
    setUseOriginalAbsoluteUrl(false);
    setImageState('loading');
  }, [rawUrl, imageUrl]);

  // 图片加载完成回调——等像素完全解码后再渐显，避免"从上往下扫"的分界线
  const handleLoad = useCallback(
    async (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.target as HTMLImageElement;
      try {
        if (img.decode) {
          await img.decode();
        }
      } catch {
        // decode() 在图片损坏时 reject，静默处理
      }
      setImageState('loaded');
    },
    []
  );

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

    setImageState('error');
    setHasError(true);
    if (onImageError) {
      onImageError(new Error(`Failed to load image: ${resolvedImageUrl}`));
    }
  };

  const isLoading = imageState === 'loading';
  const isFill = imageProps.fill;

  // blur 占位图元素（复用）
  const blurLayer =
    isLoading && blurSrc ? (
      <img
        src={blurSrc}
        alt=""
        aria-hidden="true"
        className={cn(
          'absolute inset-0 h-full w-full',
          'scale-105 blur-[8px]',
          'object-cover',
          'transition-opacity duration-300'
        )}
      />
    ) : null;

  // 主图的 className（合并 transition）
  // relative z-[1] 确保主图在 blur 层之上（非 fill 模式下需要）
  const mainClassName = cn(
    imageProps.className,
    'relative z-[1] transition-opacity duration-400 ease-in',
    imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
  );

  // fill 模式：不包裹 div，blur 层和 Image 作为兄弟元素
  // 父容器提供 position: relative（fill 的正常使用方式）
  if (isFill) {
    return (
      <>
        {blurLayer}
        <Image
          src={resolvedImageUrl}
          alt={alt}
          unoptimized={unoptimized}
          className={mainClassName}
          onLoad={handleLoad}
          onError={handleError}
          {...imageProps}
        />
      </>
    );
  }

  // 非 fill 模式：用一个 relative 容器包裹，控制尺寸
  return (
    <div
      className="relative inline-block max-w-full overflow-hidden"
      style={{
        width: imageProps.width,
        height: imageProps.height,
      }}
    >
      {blurLayer}
      <Image
        src={resolvedImageUrl}
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
